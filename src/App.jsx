import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';
import * as microsoftTeams from '@microsoft/teams-js';
import confetti from 'canvas-confetti';
import { DAILY_ROUTINES, DAILY_ROUTINES_LIST, categoryLabels, getRoutineBlock } from './dailyPlan';
import AnatomicalModel from './AnatomicalModel';
import ExerciseDemo from './ExerciseDemo';

// Utilidad para reproducir tonos audibles mediante la Web Audio API (evita depender de mp3 externos)
const playAudioTone = (frequency = 440, duration = 0.15) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = frequency;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    
    // Cerrar el contexto de audio tras sonar para liberar recursos del navegador
    setTimeout(() => {
      ctx.close().catch(err => console.warn('Error al cerrar AudioContext:', err));
    }, (duration * 1000) + 100);
  } catch (error) {
    console.warn('AudioContext bloqueado o no soportado:', error);
  }
};

// Comprobar si la hora actual cae dentro de la ventana de almuerzo (soporta cruzado de medianoche)
const isTimeInWindow = (startStr, endStr) => {
  if (!startStr || !endStr) return false;
  const toMins = (str) => {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
  };
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const startMins = toMins(startStr);
  const endMins = toMins(endStr);
  
  if (startMins <= endMins) {
    return currentMins >= startMins && currentMins < endMins;
  } else {
    return currentMins >= startMins || currentMins < endMins;
  }
};

const getLocalDateKey = () => new Date().toLocaleDateString('sv-SE');

const getDailyLogStorageKey = (userId) => {
  return `movement_snacks_logs_${userId}_${getLocalDateKey()}`;
};

// Agrupar logs por día y calcular el ganador de cada día (para el calendario de campeones)
const calculateWinnersMap = (logs, users) => {
  const dailyPoints = {};
  
  logs.forEach(log => {
    if (log.status !== 'completed' && log.status !== undefined) return;
    
    // Obtener la fecha local en formato YYYY-MM-DD
    const dateStr = new Date(log.created_at).toLocaleDateString('sv-SE');
    
    if (!dailyPoints[dateStr]) {
      dailyPoints[dateStr] = {};
    }
    
    dailyPoints[dateStr][log.user_id] = (dailyPoints[dateStr][log.user_id] || 0) + (log.points_earned ?? 10);
  });
  
  const dailyWinners = {};
  
  Object.entries(dailyPoints).forEach(([dateStr, userMap]) => {
    const scores = Object.entries(userMap).map(([userId, points]) => {
      const userObj = users.find(u => u.id === userId) || { id: userId, username: 'Usuario', avatar_url: 'm-grad-7' };
      return { user: userObj, points };
    }).sort((a, b) => b.points - a.points);
    
    if (scores.length > 0) {
      dailyWinners[dateStr] = {
        winner: scores[0].user,
        points: scores[0].points,
        scores: scores
      };
    }
  });
  
  return dailyWinners;
};

const DEFAULT_GRADIENTS = [
  'm-grad-1',
  'm-grad-2',
  'm-grad-3',
  'm-grad-4',
  'm-grad-5',
  'm-grad-6',
  'm-grad-7'
];

export default function App() {
  // --- Estados de Usuario ---
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const cached = localStorage.getItem('movement_snacks_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {}
    return null;
  });
  const [loading, setLoading] = useState(true);

  // --- Estados del Juego / Flujo ---
  // gameState: 'onboarding' | 'waiting_start' | 'idle_countdown' | 'preview_card' | 'active_timer'
  const [gameState, setGameState] = useState('onboarding');
  const [nextSnackTime, setNextSnackTime] = useState(null);
  const [secondsToNextSnack, setSecondsToNextSnack] = useState(0);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [usernameInput, setUsernameInput] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('m-grad-1');

  const getLocalPreferences = (user) => {
    const stored = localStorage.getItem(`movement_snacks_preferences_${user.id}`);
    if (!stored) {
      return {
        reminder_interval: user.reminder_interval || 45,
        lunch_start: user.lunch_start || '14:00',
        lunch_end: user.lunch_end || '16:00'
      };
    }

    try {
      return { ...user, ...JSON.parse(stored) };
    } catch (error) {
      console.error('Error al cargar preferencias locales:', error);
      return user;
    }
  };

  // --- Estado del Catálogo de Rutinas ---
  const [showCatalog, setShowCatalog] = useState(false);

  // --- Estados del Temporizador del Ejercicio ---
  const [activeCategory, setActiveCategory] = useState('pierna');
  const [activePhases, setActivePhases] = useState([]);
  const [activeRoutineName, setActiveRoutineName] = useState('');
  const [startCountdown, setStartCountdown] = useState(-1);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [secondsInPhase, setSecondsInPhase] = useState(0);
  const [inTransition, setInTransition] = useState(false);

  // --- Estados del Tablero Social (Supabase) ---
  const [usersList, setUsersList] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [dailyWinners, setDailyWinners] = useState({});

  // --- Estado de Permisos ---
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [inTeams, setInTeams] = useState(false);
  const [dismissedNotificationBanner, setDismissedNotificationBanner] = useState(() => {
    return localStorage.getItem('movement_snacks_notifications_dismissed') === 'true';
  });
  const [meetingMode, setMeetingMode] = useState(() => {
    return localStorage.getItem('movement_snacks_meeting_mode') === 'true';
  });

  const toggleMeetingMode = () => {
    setMeetingMode((prev) => {
      const next = !prev;
      localStorage.setItem('movement_snacks_meeting_mode', String(next));
      return next;
    });
  };

  // --- Referencias ---
  const countdownTimerRef = useRef(null);
  const activeSnackTimerRef = useRef(null);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Generar monograma de iniciales (ej: "Miquel Angel" -> "MA")
  const getMonogram = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.trim().substring(0, 2).toUpperCase();
  };

  // --- Inicialización y detección de Teams ---
  useEffect(() => {
    // Verificar permisos de notificación de escritorio
    if ('Notification' in window) {
      setNotificationsGranted(Notification.permission === 'granted');
    }

    const restoreDailyState = (user) => {
      const todayStr = new Date().toLocaleDateString('sv-SE');
      const cachedState = localStorage.getItem('movement_snacks_daily_state');
      if (cachedState) {
        try {
          const parsed = JSON.parse(cachedState);
          if (parsed.date === todayStr && parsed.gameState) {
            if (parsed.gameState === 'active_timer' || parsed.gameState === 'preview_card') {
              const minutes = user?.reminder_interval || 45;
              const targetTime = new Date(Date.now() + minutes * 60 * 1000);
              setGameState('idle_countdown');
              setNextSnackTime(targetTime);
              setSecondsToNextSnack(minutes * 60);
            } else {
              setGameState(parsed.gameState);
              if (parsed.nextSnackTime) {
                const nextTime = new Date(parsed.nextSnackTime);
                setNextSnackTime(nextTime);
                const remainingSecs = Math.max(0, Math.floor((nextTime.getTime() - Date.now()) / 1000));
                setSecondsToNextSnack(remainingSecs);
              }
            }
            if (parsed.activeCategory) {
              setActiveCategory(parsed.activeCategory);
            }
            return true;
          }
        } catch (e) {
          console.error('Error al restaurar estado diario:', e);
        }
      }
      setGameState('waiting_start');
      return false;
    };

    const checkExistingUser = async () => {
      setLoading(true);
      try {
        // 1. Intentar iniciar Microsoft Teams SDK
        try {
          await microsoftTeams.app.initialize();
          const context = await microsoftTeams.app.getContext();
          setInTeams(true);
          if (context?.user?.userPrincipalName) {
            const teamsId = context.user.userPrincipalName; // Usamos email de Teams como ID único
            if (supabase) {
              const { data, error } = await supabase.from('users').select('*').eq('id', teamsId).maybeSingle();
              if (data) {
                const mergedUser = getLocalPreferences({ ...data });
                const savedLunch = localStorage.getItem(`lunch_settings_${data.id}`);
                let localStart = '14:00';
                let localEnd = '16:00';
                if (savedLunch) {
                  try {
                    const { start, end } = JSON.parse(savedLunch);
                    localStart = start;
                    localEnd = end;
                  } catch (e) {}
                }
                mergedUser.lunch_start = mergedUser.lunch_start || localStart;
                mergedUser.lunch_end = mergedUser.lunch_end || localEnd;
                localStorage.setItem(`lunch_settings_${data.id}`, JSON.stringify({ start: mergedUser.lunch_start, end: mergedUser.lunch_end }));
                setCurrentUser(mergedUser);
                restoreDailyState(mergedUser);
                setLoading(false);
                return;
              }
            }
            // Los perfiles se administran fuera de la aplicación.
            setGameState('access_restricted');
            setLoading(false);
            return;
          }
        } catch (teamsError) {
          console.log('No se detectó el entorno de MS Teams, usando almacenamiento local.');
          setInTeams(false);
        }

        // 2. Fallback a LocalStorage en navegador estándar
        const localUserId = localStorage.getItem('movement_snacks_user_id') || currentUser?.id;
        if (localUserId) {
          if (supabase) {
            try {
              const { data, error } = await supabase.from('users').select('*').eq('id', localUserId).maybeSingle();
              if (data) {
                const mergedUser = getLocalPreferences({ ...data });
                const savedLunch = localStorage.getItem(`lunch_settings_${data.id}`);
                let localStart = '14:00';
                let localEnd = '16:00';
                if (savedLunch) {
                  try {
                    const { start, end } = JSON.parse(savedLunch);
                    localStart = start;
                    localEnd = end;
                  } catch (e) {}
                }
                mergedUser.lunch_start = mergedUser.lunch_start || localStart;
                mergedUser.lunch_end = mergedUser.lunch_end || localEnd;
                localStorage.setItem(`lunch_settings_${data.id}`, JSON.stringify({ start: mergedUser.lunch_start, end: mergedUser.lunch_end }));
                localStorage.setItem('movement_snacks_user_id', mergedUser.id);
                localStorage.setItem('movement_snacks_profile', JSON.stringify(mergedUser));
                setCurrentUser(mergedUser);
                restoreDailyState(mergedUser);
                setLoading(false);
                return;
              }
            } catch (err) {
              console.error('Error al obtener usuario de Supabase:', err);
            }
          }
          
          // Si no hay Supabase o no se encontró en DB, recuperamos el perfil local guardado
          const cachedUser = localStorage.getItem('movement_snacks_profile');
          if (cachedUser) {
            try {
              const parsed = JSON.parse(cachedUser);
              if (parsed && parsed.id) {
                setCurrentUser(parsed);
                restoreDailyState(parsed);
                setLoading(false);
                return;
              }
            } catch (e) {}
          }
        }

        // Si no hay usuario recordado, cargamos la lista para la pantalla de selección
        let hasUsers = false;
        if (supabase) {
          try {
            const { data } = await supabase.from('users').select('*');
            if (data && data.length > 0) {
              const activeUsers = data.filter(u => !u.username.startsWith('__deleted__'));
              setUsersList(activeUsers);
              hasUsers = activeUsers.length > 0;
            }
          } catch (e) {
            console.error('Error al cargar lista inicial de usuarios:', e);
          }
        } else {
          const localUsers = JSON.parse(localStorage.getItem('movement_snacks_users_local') || '[]');
          const activeLocalUsers = localUsers.filter(u => !u.username.startsWith('__deleted__'));
          if (activeLocalUsers.length > 0) {
            setUsersList(activeLocalUsers);
            hasUsers = true;
          }
        }

        setGameState(hasUsers ? 'user_selection' : 'access_restricted');
      } catch (err) {
        console.error('Error al comprobar usuario existente:', err);
        setGameState('access_restricted');
      } finally {
        setLoading(false);
      }
    };

    checkExistingUser();
  }, []);

  // Inicializar inputs de onboarding si ya hay datos parciales en el estado
  useEffect(() => {
    if (currentUser && gameState === 'onboarding') {
      setUsernameInput(currentUser.username || '');
      setSelectedGradient(currentUser.avatar_url || 'm-grad-1');
    }
  }, [currentUser, gameState]);

  // --- Persistencia del Estado Diario (para soportar navegación/refrescos en Teams) ---
  useEffect(() => {
    if (currentUser && gameState !== 'onboarding') {
      const todayStr = new Date().toLocaleDateString('sv-SE');
      const stateToSave = {
        date: todayStr,
        gameState,
        nextSnackTime: nextSnackTime ? nextSnackTime.toISOString() : null,
        activeCategory
      };
      localStorage.setItem('movement_snacks_daily_state', JSON.stringify(stateToSave));
    }
  }, [gameState, nextSnackTime, activeCategory, currentUser]);

  // El cambio de fecha cierra la jornada sin crear registros ni otorgar puntos.
  useEffect(() => {
    if (!currentUser) return;

    let currentDate = getLocalDateKey();
    const midnightCheck = setInterval(() => {
      const newDate = getLocalDateKey();
      if (newDate === currentDate) return;

      currentDate = newDate;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (activeSnackTimerRef.current) clearInterval(activeSnackTimerRef.current);
      localStorage.removeItem('movement_snacks_daily_state');
      setNextSnackTime(null);
      setSecondsToNextSnack(0);
      setSnoozeCount(0);
      setGameState('waiting_start');
    }, 60 * 1000);

    return () => clearInterval(midnightCheck);
  }, [currentUser]);

  // --- Carga de Marcador y Feed ---
  const fetchLeaderboard = useCallback(async () => {
    if (!currentUser) return;

    if (!supabase) {
      // Inicializar historial local si no existe para hacer la demostración vistosa
      if (!localStorage.getItem('movement_snacks_logs_history')) {
        const mockHistory = [];
        const today = new Date();
        const users = [
          { id: 'local_user', username: currentUser?.username || 'Miquel Ángel', avatar_url: currentUser?.avatar_url || 'm-grad-1' },
          { id: 'compañero_demo', username: 'Carlos R.', avatar_url: 'm-grad-2' }
        ];
        
        for (let i = 1; i <= 20; i++) {
          const logDate = new Date();
          logDate.setDate(today.getDate() - i);
          
          const winnerIdx = i % 2 === 0 ? 0 : 1;
          const loserIdx = winnerIdx === 0 ? 1 : 0;
          
          const winnerCount = Math.floor(Math.random() * 2) + 3; 
          for (let j = 0; j < winnerCount; j++) {
            mockHistory.push({
              id: `mock_${i}_win_${j}`,
              user_id: users[winnerIdx].id,
              category: ['pierna', 'empuje', 'tiron', 'potencia'][Math.floor(Math.random() * 4)],
              status: 'completed',
              points_earned: 10,
              created_at: logDate.toISOString()
            });
          }
          
          const loserCount = Math.floor(Math.random() * 2) + 1; 
          for (let j = 0; j < loserCount; j++) {
            mockHistory.push({
              id: `mock_${i}_lose_${j}`,
              user_id: users[loserIdx].id,
              category: ['pierna', 'empuje', 'tiron', 'potencia'][Math.floor(Math.random() * 4)],
              status: 'completed',
              points_earned: 10,
              created_at: logDate.toISOString()
            });
          }
        }
        localStorage.setItem('movement_snacks_logs_history', JSON.stringify(mockHistory));
      }

      // Carga de marcador local de respaldo
      const cachedUser = currentUser || { id: 'local_user', username: 'Miquel', avatar_url: 'm-grad-1' };
      const localLogs = JSON.parse(localStorage.getItem(getDailyLogStorageKey(cachedUser.id)) || '[]');
      const myPoints = localLogs.filter(l => l.status === 'completed').reduce((sum, l) => sum + (l.points_earned ?? 10), 0);

      const localUsers = [
        { id: cachedUser.id, username: cachedUser.username, avatar_url: cachedUser.avatar_url, points: myPoints },
        { id: 'compañero_demo', username: 'Carlos R.', avatar_url: 'm-grad-2', points: 30 }
      ].sort((a, b) => b.points - a.points);
      setUsersList(localUsers);

      // Agrupar historial local para el calendario
      const historyLogs = JSON.parse(localStorage.getItem('movement_snacks_logs_history') || '[]');
      const allLocalLogs = [...historyLogs, ...localLogs];
      const winners = calculateWinnersMap(allLocalLogs, localUsers);
      setDailyWinners(winners);
      return;
    }

    try {
      // Obtener usuarios filtrando eliminados
      const { data: usersData } = await supabase.from('users').select('*');
      const activeUsersData = (usersData || []).filter(u => !u.username.startsWith('__deleted__'));
      
      // Obtener logs completados a partir de la fecha de inicio del proyecto, ignorando registros de prueba del 25 y 26 de julio
      const projectStart = new Date('2026-07-20T00:00:00Z');
      const testCutoff = new Date('2026-07-26T16:13:00Z');
      const { data: rawLogsData } = await supabase
        .from('snacks_log')
        .select('user_id, points_earned, status, created_at')
        .eq('status', 'completed')
        .gte('created_at', projectStart.toISOString());

      const allLogsData = (rawLogsData || []).filter(log => {
        const logTime = new Date(log.created_at);
        const isTestLog = logTime >= new Date('2026-07-25T00:00:00Z') && logTime <= testCutoff;
        return !isTestLog;
      });

      // Filtrar para el marcador de hoy
      const todayStr = getLocalDateKey();
      const pointsMap = {};
      allLogsData?.forEach((log) => {
        const logDateStr = new Date(log.created_at).toLocaleDateString('sv-SE');
        if (logDateStr === todayStr) {
          pointsMap[log.user_id] = (pointsMap[log.user_id] || 0) + log.points_earned;
        }
      });

      const sortedUsers = activeUsersData.map((u) => ({
        ...u,
        points: pointsMap[u.id] || 0
      })).sort((a, b) => b.points - a.points);

      setUsersList(sortedUsers);

      // Calcular mapa de ganadores diarios para el calendario
      const winners = calculateWinnersMap(allLogsData || [], activeUsersData);
      setDailyWinners(winners);
    } catch (err) {
      console.error('Error al cargar marcador/historial de Supabase:', err);
    }
  }, [currentUser]);

  const fetchActivityFeed = useCallback(async () => {
    if (!currentUser) return;

    if (!supabase) {
      // Carga de feed local de respaldo
      const localLogs = JSON.parse(localStorage.getItem(getDailyLogStorageKey(currentUser.id)) || '[]');
      setActivityFeed(
        localLogs.map((l) => ({
          ...l,
          users: currentUser
        })).reverse()
      );
      return;
    }

    try {
      const projectStart = new Date('2026-07-20T00:00:00Z');
      const testCutoff = new Date('2026-07-26T16:13:00Z');
      const { data: logsData } = await supabase
        .from('snacks_log')
        .select('*, users(username, avatar_url)')
        .gte('created_at', projectStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(30);

      const filteredLogs = (logsData || []).filter(log => {
        const logTime = new Date(log.created_at);
        const isTestLog = logTime >= new Date('2026-07-25T00:00:00Z') && logTime <= testCutoff;
        return !isTestLog;
      }).slice(0, 10);

      setActivityFeed(filteredLogs || []);
    } catch (err) {
      console.error('Error al cargar feed de actividad:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (gameState === 'onboarding' || gameState === 'user_selection' || !currentUser) return;

    fetchLeaderboard();
    fetchActivityFeed();

    if (!supabase) return;

    // Suscripción Realtime a Supabase para notificaciones instantáneas
    const logSubscription = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { event: 'INSERT', table: 'snacks_log' }, (payload) => {
        fetchLeaderboard();
        fetchActivityFeed();

        // Obtener el ID del usuario actual de forma segura
        const myUserId = currentUserRef.current?.id || currentUser?.id || localStorage.getItem('movement_snacks_user_id');

        // Disparar sonido y notificación ÚNICAMENTE si el ejercicio lo completó otro compañero
        if (payload.new && payload.new.user_id && myUserId && payload.new.user_id !== myUserId && payload.new.status === 'completed') {
          if (!meetingMode) playAudioTone(660, 0.4);
          if (payload.new.category === 'finalizado') {
            showDesktopNotification('Jornada finalizada', 'Compañero desconectado');
          } else {
            showDesktopNotification('Compañero activo', 'Pausa activa');
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(logSubscription);
    };
  }, [gameState, currentUser, fetchLeaderboard, fetchActivityFeed, meetingMode]);

  // --- Lógica del Temporizador Principal ---
  useEffect(() => {
    if (gameState !== 'idle_countdown' || !nextSnackTime) return;

    countdownTimerRef.current = setInterval(() => {
      const now = new Date();
      const lunchStart = currentUser?.lunch_start || '14:00';
      const lunchEnd = currentUser?.lunch_end || '16:00';
      
      const inLunch = isTimeInWindow(lunchStart, lunchEnd);
      
      if (inLunch) {
        // Si cae en horario de almuerzo, reprogramamos automáticamente para 5 minutos después del fin
        const toMins = (str) => {
          const [h, m] = str.split(':').map(Number);
          return h * 60 + m;
        };
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const endMins = toMins(lunchEnd);
        let minsToWait = endMins - currentMins;
        if (minsToWait < 0) minsToWait += 24 * 60; // Cruzado de día
        
        const resumeTime = new Date(Date.now() + (minsToWait + 5) * 60 * 1000);
        setNextSnackTime(resumeTime);
        return;
      }

      const remaining = Math.max(0, Math.floor((nextSnackTime.getTime() - Date.now()) / 1000));
      setSecondsToNextSnack(remaining);

      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current);
        triggerSnackAlert();
      }
    }, 1000);

    return () => clearInterval(countdownTimerRef.current);
  }, [gameState, nextSnackTime, currentUser]);

  // --- Notificación de Escritorio con Enfoque de Ventana ---
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        setNotificationsGranted(permission === 'granted');
        if (permission === 'denied') {
          alert('⚠️ Notificaciones Bloqueadas en este ordenador\n\nAl parecer las notificaciones están desactivadas o bloqueadas para este sitio en tu navegador.\n\nPara activarlas y recibir alertas:\n1. Haz clic en el icono del candado (o configuración) a la izquierda de la dirección URL en la parte superior del navegador.\n2. Busca el selector de "Notificaciones" y cámbialo a "Permitir".\n3. Recarga la página.');
        }
      });
    } else {
      alert('Las notificaciones de escritorio no están soportadas en este navegador.');
    }
  };

  const showDesktopNotification = (title, body) => {
    if (meetingMode) return;
    if (notificationsGranted && 'Notification' in window) {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        requireInteraction: true
      });
      // Traer la ventana de la app al frente al hacer clic
      notification.onclick = () => {
        window.focus();
      };
    }
  };

  // --- Acciones de Flujo ---

  // Guardar Onboarding (Nuevo Perfil)
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    const username = usernameInput.trim();
    const avatar = selectedGradient;
    const interval = parseInt(e.target.interval.value);
    const equipment = e.target.equipment.checked;
    const lunchStart = e.target.lunch_start?.value || '14:00';
    const lunchEnd = e.target.lunch_end?.value || '16:00';

    if (!username) return;

    const id = currentUser?.id || 'user_' + Math.random().toString(36).substr(2, 9);
    
    // Perfil completo incluyendo campos locales de almuerzo
    const userPayload = {
      id,
      username,
      avatar_url: avatar,
      reminder_interval: interval,
      has_equipment: equipment,
      lunch_start: lunchStart,
      lunch_end: lunchEnd
    };

    // Payload limpio para Supabase (para evitar fallos por columnas inexistentes)
    const dbPayload = {
      id,
      username,
      avatar_url: avatar,
      reminder_interval: interval,
      has_equipment: equipment,
      lunch_start: lunchStart,
      lunch_end: lunchEnd
    };

    // Guardado local inmediato
    localStorage.setItem('movement_snacks_user_id', id);
    localStorage.setItem('movement_snacks_profile', JSON.stringify(userPayload));
    localStorage.setItem(`lunch_settings_${id}`, JSON.stringify({ start: lunchStart, end: lunchEnd }));

    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').upsert(dbPayload).select().single();
        if (error) throw error;
        const updatedUser = { ...data, lunch_start: lunchStart, lunch_end: lunchEnd };
        setCurrentUser(updatedUser);
        
        // Actualizar lista de usuarios en memoria
        setUsersList(prev => {
          const exists = prev.some(u => u.id === id);
          if (exists) {
            return prev.map(u => u.id === id ? updatedUser : u);
          }
          return [...prev, updatedUser];
        });
      } catch (err) {
        console.error('Error al guardar perfil en Supabase, usando local:', err);
        setCurrentUser(userPayload);
      }
    } else {
      setCurrentUser(userPayload);
      // Guardar en la lista local de usuarios
      const localUsers = JSON.parse(localStorage.getItem('movement_snacks_users_local') || '[]');
      const existsIdx = localUsers.findIndex(u => u.id === id);
      if (existsIdx !== -1) {
        localUsers[existsIdx] = userPayload;
      } else {
        localUsers.push(userPayload);
      }
      localStorage.setItem('movement_snacks_users_local', JSON.stringify(localUsers));
      setUsersList(localUsers);
    }
    
    // Al guardar o registrar, reanudamos el estado de recordatorio diario del usuario
    const restoreDailyState = (user) => {
      const todayStr = new Date().toLocaleDateString('sv-SE');
      const cachedState = localStorage.getItem('movement_snacks_daily_state');
      if (cachedState) {
        try {
          const parsed = JSON.parse(cachedState);
          if (parsed.date === todayStr && parsed.gameState) {
            if (parsed.gameState === 'active_timer' || parsed.gameState === 'preview_card') {
              const minutes = user?.reminder_interval || 45;
              const targetTime = new Date(Date.now() + minutes * 60 * 1000);
              setGameState('idle_countdown');
              setNextSnackTime(targetTime);
              setSecondsToNextSnack(minutes * 60);
            } else {
              setGameState(parsed.gameState);
              if (parsed.nextSnackTime) {
                const nextTime = new Date(parsed.nextSnackTime);
                setNextSnackTime(nextTime);
                const remainingSecs = Math.max(0, Math.floor((nextTime.getTime() - Date.now()) / 1000));
                setSecondsToNextSnack(remainingSecs);
              }
            }
            if (parsed.activeCategory) {
              setActiveCategory(parsed.activeCategory);
            }
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setGameState('waiting_start');
    };
    restoreDailyState(userPayload);
  };

  // --- Gestión de la Rutina Actual y Avance Diario ---
  const getCurrentRoutine = useCallback((user) => {
    const activeUser = user || currentUserRef.current || currentUser;
    const userId = activeUser?.id || localStorage.getItem('movement_snacks_user_id') || 'local';
    const block = getRoutineBlock(activeUser?.lunch_end);
    const routines = DAILY_ROUTINES[block];
    const todayKey = getLocalDateKey();
    const completedIndexKey = `movement_snacks_completed_idx_${userId}_${todayKey}_${block}`;
    const lastCompleted = Number.parseInt(localStorage.getItem(completedIndexKey) ?? '-1', 10);
    const currentIdx = (lastCompleted + 1) % routines.length;
    return {
      block,
      routines,
      currentIdx,
      routine: routines[currentIdx],
      completedCount: Math.min(lastCompleted + 1, routines.length),
      totalCount: routines.length
    };
  }, []);

  const advanceRoutine = useCallback(() => {
    const activeUser = currentUserRef.current || currentUser;
    const userId = activeUser?.id || localStorage.getItem('movement_snacks_user_id') || 'local';
    const { block, currentIdx } = getCurrentRoutine(activeUser);
    const todayKey = getLocalDateKey();
    const completedIndexKey = `movement_snacks_completed_idx_${userId}_${todayKey}_${block}`;
    localStorage.setItem(completedIndexKey, String(currentIdx));
  }, [getCurrentRoutine]);

  // Alerta de Snack Activada (Se cumplió el tiempo o clic en Comenzar)
  const triggerSnackAlert = () => {
    if (!meetingMode) {
      playAudioTone(523.25, 0.4); // Nota DO5
      setTimeout(() => playAudioTone(659.25, 0.4), 150); // Nota MI5
    }
    
    showDesktopNotification('Es hora de tu snack', 'Pausa activa');
    
    const { routine } = getCurrentRoutine(currentUser);
    setActiveRoutineName(routine.routineName);
    setActivePhases(routine.phases);
    setActiveCategory(routine.category);
    setGameState('preview_card');
  };

  // Comenzar el ejercicio real (Terminar vista previa e iniciar inmediatamente sin tiempo extra)
  const handleStartSnack = () => {
    // Pitidos rápidos de salida instantáneos (pip-pip-piiip)
    playAudioTone(880, 0.08);
    setTimeout(() => playAudioTone(1000, 0.08), 80);
    setTimeout(() => playAudioTone(1200, 0.2), 160);

    setGameState('active_timer');
    setStartCountdown(-1);
    runWorkoutTimer();
  };

  // Cronómetro del ejercicio activo con fase de preparación inicial y precisión basada en marcas de tiempo
  const runWorkoutTimer = () => {
    setCurrentPhaseIndex(0);
    setInTransition(true);

    let phaseIdx = 0;
    let isTrans = true;
    const TRANSITION_DURATION = 5;
    let phaseDuration = TRANSITION_DURATION;
    let phaseStartTime = Date.now();
    let lastBeepSec = -1;

    setSecondsInPhase(TRANSITION_DURATION);

    if (activeSnackTimerRef.current) clearInterval(activeSnackTimerRef.current);

    activeSnackTimerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - phaseStartTime) / 1000);
      const remaining = Math.max(0, phaseDuration - elapsed);

      setSecondsInPhase(remaining);

      if (isTrans) {
        // En transición de preparación
        if (remaining > 0 && remaining !== lastBeepSec) {
          lastBeepSec = remaining;
          playAudioTone(580, 0.08);
        }

        if (remaining <= 0) {
          // Finaliza la transición: Pitido agudo de inicio ("Ya!")
          playAudioTone(880, 0.22);
          isTrans = false;
          setInTransition(false);
          phaseDuration = activePhases[phaseIdx].duration;
          phaseStartTime = Date.now();
          lastBeepSec = -1;
          setSecondsInPhase(phaseDuration);
        }
      } else {
        // En ejercicio activo
        if (remaining <= 5 && remaining > 0 && remaining !== lastBeepSec) {
          lastBeepSec = remaining;
          playAudioTone(1000, 0.05); // Pitido corto y agudo tipo Garmin
        }

        if (remaining <= 0) {
          phaseIdx++;
          if (phaseIdx < activePhases.length) {
            // Triple pitido de cambio (pip, pip, piiip)
            playAudioTone(1100, 0.06);
            setTimeout(() => playAudioTone(1100, 0.06), 120);
            setTimeout(() => playAudioTone(1100, 0.12), 240);

            isTrans = true;
            setInTransition(true);
            setCurrentPhaseIndex(phaseIdx);
            phaseDuration = TRANSITION_DURATION;
            phaseStartTime = Date.now();
            lastBeepSec = -1;
            setSecondsInPhase(TRANSITION_DURATION);
          } else {
            // Snack completado!
            clearInterval(activeSnackTimerRef.current);
            handleSnackCompleted();
          }
        }
      }
    }, 250);
  };

  // Completado con Éxito (Se completaron todos los ejercicios del temporizador)
  const handleSnackCompleted = async () => {
    playAudioTone(880, 0.15);
    setTimeout(() => playAudioTone(1046.5, 0.4), 100); // Tono de victoria
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    if (activeSnackTimerRef.current) clearInterval(activeSnackTimerRef.current);

    const activeUser = currentUserRef.current || currentUser;
    let userId = activeUser?.id || localStorage.getItem('movement_snacks_user_id');
    if (!userId) {
      try {
        const cachedProfile = JSON.parse(localStorage.getItem('movement_snacks_profile') || '{}');
        userId = cachedProfile.id;
      } catch (e) {}
    }

    const { routine } = getCurrentRoutine(activeUser);
    const routineCategory = activeCategory || routine.category;
    const routinePhases = activePhases.length > 0 ? activePhases : routine.phases;

    const logPayload = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: userId,
      category: routineCategory,
      exercises_performed: routinePhases.map(p => p.name),
      status: 'completed',
      points_earned: 10,
      created_at: new Date().toISOString()
    };

    // 1. Guardar localmente
    if (userId) {
      const localLogs = JSON.parse(localStorage.getItem(getDailyLogStorageKey(userId)) || '[]');
      localLogs.push(logPayload);
      localStorage.setItem(getDailyLogStorageKey(userId), JSON.stringify(localLogs));
    }

    // 2. Avanzar el índice de la rutina ahora que se ha completado
    advanceRoutine();

    // 3. Actualización optimista inmediata en UI
    setActivityFeed(prev => [{ ...logPayload, users: activeUser }, ...prev.slice(0, 9)]);
    setUsersList(prev => {
      const exists = prev.some(u => u.id === userId);
      if (exists) {
        return prev.map(u => u.id === userId ? { ...u, points: (u.points || 0) + 10 } : u).sort((a, b) => b.points - a.points);
      }
      return [...prev, { ...activeUser, id: userId, points: 10 }].sort((a, b) => b.points - a.points);
    });

    const todayStr = getLocalDateKey();
    setDailyWinners(prev => {
      const currentToday = prev[todayStr];
      const newPoints = (currentToday?.winner?.id === userId ? currentToday.points : 0) + 10;
      return {
        ...prev,
        [todayStr]: {
          winner: activeUser,
          points: (currentToday && currentToday.winner?.id === userId) ? (currentToday.points + 10) : ((currentToday?.points || 0) < 10 ? 10 : currentToday.points),
          scores: [{ user: activeUser, points: newPoints }]
        }
      };
    });

    // 4. Sincronizar en base de datos
    if (supabase && userId) {
      try {
        const { error } = await supabase.from('snacks_log').insert({
          user_id: logPayload.user_id,
          category: logPayload.category,
          exercises_performed: logPayload.exercises_performed,
          status: logPayload.status,
          points_earned: logPayload.points_earned
        });
        if (error) {
          console.error('Error al guardar log en Supabase:', error);
        } else {
          fetchLeaderboard();
          fetchActivityFeed();
        }
      } catch (err) {
        console.error('Error al guardar log en Supabase:', err);
      }
    } else {
      const historyLogs = JSON.parse(localStorage.getItem('movement_snacks_logs_history') || '[]');
      const localLogs = userId ? JSON.parse(localStorage.getItem(getDailyLogStorageKey(userId)) || '[]') : [];
      const allLocalLogs = [...historyLogs, ...localLogs];
      const localUsers = JSON.parse(localStorage.getItem('movement_snacks_users_local') || '[]');
      setDailyWinners(calculateWinnersMap(allLocalLogs, localUsers.length > 0 ? localUsers : [activeUser]));
    }

    // Programar el siguiente
    setSnoozeCount(0);
    const minutes = activeUser?.reminder_interval || 45;
    setNextSnackTime(new Date(Date.now() + minutes * 60 * 1000));
    setSecondsToNextSnack(minutes * 60);

    const nextInfo = getCurrentRoutine(activeUser);
    setActiveRoutineName(nextInfo.routine.routineName);
    setActivePhases(nextInfo.routine.phases);
    setActiveCategory(nextInfo.routine.category);

    setGameState('idle_countdown');
  };

  // Posponer Snack (Snooze 5 o 10 minutos)
  const handleSnooze = (minutes) => {
    playAudioTone(330, 0.3); // Beep grave
    if (activeSnackTimerRef.current) clearInterval(activeSnackTimerRef.current);

    const newSnoozeCount = snoozeCount + 1;
    setSnoozeCount(newSnoozeCount);

    if (newSnoozeCount >= 3) {
      // Superado el límite de posposiciones, se pierde el snack
      handleSkipSnack('snooze_limit');
      return;
    }

    const nextTarget = new Date(Date.now() + minutes * 60 * 1000);
    setNextSnackTime(nextTarget);
    setSecondsToNextSnack(minutes * 60);
    setGameState('idle_countdown');
  };

  // Saltar Snack (Voluntariamente o por límite)
  const handleSkipSnack = async (reason = 'skipped') => {
    playAudioTone(220, 0.5); // Beep triste
    if (activeSnackTimerRef.current) clearInterval(activeSnackTimerRef.current);

    const { routine } = getCurrentRoutine(currentUser);
    const routineCategory = activeCategory || routine.category;

    const logPayload = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: currentUser.id,
      category: routineCategory,
      exercises_performed: [],
      status: reason === 'snooze_limit' ? 'snoozed_limit' : 'skipped',
      points_earned: 0,
      created_at: new Date().toISOString()
    };

    // Guardar localmente
    const localLogs = JSON.parse(localStorage.getItem(getDailyLogStorageKey(currentUser.id)) || '[]');
    localLogs.push(logPayload);
    localStorage.setItem(getDailyLogStorageKey(currentUser.id), JSON.stringify(localLogs));

    // Si se salta, avanzar al siguiente snack
    advanceRoutine();

    setActivityFeed(prev => [{ ...logPayload, users: currentUser }, ...prev.slice(0, 9)]);

    if (supabase) {
      try {
        await supabase.from('snacks_log').insert({
          user_id: logPayload.user_id,
          category: logPayload.category,
          exercises_performed: logPayload.exercises_performed,
          status: logPayload.status,
          points_earned: logPayload.points_earned
        });
        fetchActivityFeed();
      } catch (err) {
        console.error('Error al guardar log de salto en Supabase:', err);
      }
    }

    // Programar el siguiente
    setSnoozeCount(0);
    const minutes = currentUser?.reminder_interval || 45;
    setNextSnackTime(new Date(Date.now() + minutes * 60 * 1000));
    setSecondsToNextSnack(minutes * 60);

    const nextInfo = getCurrentRoutine(currentUser);
    setActiveRoutineName(nextInfo.routine.routineName);
    setActivePhases(nextInfo.routine.phases);
    setActiveCategory(nextInfo.routine.category);

    setGameState('idle_countdown');
  };

  const handleSelectUser = (user) => {
    try {
      const mergedUser = getLocalPreferences({ ...user });
      currentUserRef.current = mergedUser;
      setCurrentUser(mergedUser);
      localStorage.setItem('movement_snacks_user_id', mergedUser.id);
      localStorage.setItem('movement_snacks_profile', JSON.stringify(mergedUser));

      const { routine } = getCurrentRoutine(mergedUser);
      if (routine) {
        setActiveRoutineName(routine.routineName);
        setActivePhases(routine.phases || []);
        setActiveCategory(routine.category || 'pierna');
      }

      // Iniciar el temporizador diario directamente
      const minutes = mergedUser.reminder_interval || 45;
      const targetTime = new Date(Date.now() + minutes * 60 * 1000);
      setNextSnackTime(targetTime);
      setSecondsToNextSnack(minutes * 60);
      setSnoozeCount(0);
      setGameState('idle_countdown');
    } catch (err) {
      console.error('Error al seleccionar usuario:', err);
      setGameState('idle_countdown');
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId, username, e) => {
    e.stopPropagation(); // Evitar click en la tarjeta de selección
    if (!window.confirm(`¿Seguro que deseas eliminar el usuario "${username}"? Esto borrará de forma permanente todos sus datos de entrenamiento y registros.`)) {
      return;
    }

    if (supabase) {
      try {
        await supabase.from('users').delete().eq('id', userId);
        setUsersList(prev => prev.filter(u => u.id !== userId));
        if (currentUser?.id === userId) {
          setCurrentUser(null);
          localStorage.removeItem('movement_snacks_user_id');
          localStorage.removeItem('movement_snacks_profile');
          setGameState('user_selection');
        }
      } catch (err) {
        console.error('Error al eliminar usuario de Supabase:', err);
      }
    } else {
      const localUsers = JSON.parse(localStorage.getItem('movement_snacks_users_local') || '[]');
      const filtered = localUsers.filter(u => u.id !== userId);
      localStorage.setItem('movement_snacks_users_local', JSON.stringify(filtered));
      setUsersList(filtered);
      if (currentUser?.id === userId) {
        setCurrentUser(null);
        localStorage.removeItem('movement_snacks_user_id');
        localStorage.removeItem('movement_snacks_profile');
        setGameState('user_selection');
      }
    }
  };

  // Cerrar sesión y volver a selección de usuario
  const handleLogOutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('movement_snacks_user_id');
    localStorage.removeItem('movement_snacks_profile');
    localStorage.removeItem('movement_snacks_daily_state');
    
    // Recargar lista fresquita de usuarios
    const fetchUsers = async () => {
      if (supabase) {
        try {
          const { data } = await supabase.from('users').select('*');
          if (data) {
            const activeUsers = data.filter(u => !u.username.startsWith('__deleted__'));
            setUsersList(activeUsers);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const localUsers = JSON.parse(localStorage.getItem('movement_snacks_users_local') || '[]');
        const activeLocalUsers = localUsers.filter(u => !u.username.startsWith('__deleted__'));
        setUsersList(activeLocalUsers);
      }
    };
    fetchUsers();
    setGameState('user_selection');
  };

  // Iniciar Jornada ("¡Ya estoy aquí!")
  const handleStartDay = () => {
    playAudioTone(880, 0.2);
    setSnoozeCount(0);
    const minutes = currentUser?.reminder_interval || 45;
    const targetTime = new Date(Date.now() + minutes * 60 * 1000);
    
    const block = getRoutineBlock(currentUser?.lunch_end);
    setActiveCategory(block === 'morning' ? 'potencia' : 'movilidad');

    setNextSnackTime(targetTime);
    setSecondsToNextSnack(minutes * 60);
    setGameState('idle_countdown');
  };

  // Modificar perfil desde el panel
  const handleEditProfile = () => {
    setGameState('onboarding');
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    const reminderInterval = Number(e.target.interval.value);
    const lunchStart = e.target.lunch_start.value;
    const lunchEnd = e.target.lunch_end.value;
    const updatedUser = {
      ...currentUser,
      reminder_interval: reminderInterval,
      lunch_start: lunchStart,
      lunch_end: lunchEnd
    };

    localStorage.setItem(`movement_snacks_preferences_${currentUser.id}`, JSON.stringify({
      reminder_interval: reminderInterval,
      lunch_start: lunchStart,
      lunch_end: lunchEnd
    }));
    localStorage.setItem(`lunch_settings_${currentUser.id}`, JSON.stringify({ start: lunchStart, end: lunchEnd }));
    localStorage.setItem('movement_snacks_profile', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);

    if (gameState === 'settings' && nextSnackTime) {
      const targetTime = new Date(Date.now() + reminderInterval * 60 * 1000);
      setNextSnackTime(targetTime);
      setSecondsToNextSnack(reminderInterval * 60);
      setGameState('idle_countdown');
      return;
    }

    setGameState('waiting_start');
  };

  // Formatear segundos a MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- RENDERIZADO PRINCIPAL ---

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <h2>Iniciando Snacks de Movimiento...</h2>
        <div style={{ fontSize: '2.5rem', animation: 'spin 2s linear infinite' }}>⚡</div>
      </div>
    );
  }

  // PANTALLA 0: SELECCIÓN DE USUARIO (Si no hay usuario activo o se solicita cambiar)
  if (gameState === 'user_selection' || !currentUser) {
    return (
      <div className="app-container" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <header style={{ justifyContent: 'center', marginBottom: '24px' }}>
          <h1>Snacks de Movimiento</h1>
        </header>
        
        <div className="db-card" style={{ padding: '40px 32px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
            ¿Quién entrena hoy? 💻
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.4' }}>
            Selecciona tu perfil para vincular tus snacks y puntuación en este navegador.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px', marginBottom: '16px' }}>
            {usersList.length === 0 ? (
              <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '20px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cargando usuarios del equipo...</p>
              </div>
            ) : (
              usersList.map((user) => (
                <div 
                  key={user.id} 
                  className="user-select-card"
                  onClick={() => handleSelectUser(user)}
                  style={{ 
                    position: 'relative', 
                    cursor: 'pointer', 
                    padding: '20px 16px', 
                    borderRadius: '12px', 
                    border: '1.5px solid var(--border-color)', 
                    textAlign: 'center', 
                    transition: 'all 0.2s ease', 
                    background: 'var(--bg-card)' 
                  }}
                >
                  <div className={`monogram ${user.avatar_url || 'm-grad-1'}`} style={{ width: '60px', height: '60px', fontSize: '1.8rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, margin: '0 auto 12px auto', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
                    {getMonogram(user.username)}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                    {user.username}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // PANTALLA 1: ONBOARDING (REGISTRO)
  if (gameState === 'onboarding') {
    return (
      <div className="app-container">
        <header>
          <h1>Snacks de Movimiento</h1>
        </header>
        
        <div className="db-card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div className="db-card-header">
            <h2 className="db-card-title">Configurar Perfil Profesional</h2>
          </div>
          
          <form onSubmit={handleOnboardingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="form-group">
              <label htmlFor="username">Nombre completo o iniciales</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-control"
                placeholder="Ej: Miquel Ángel, Carlos R..."
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Selecciona el color de tu Monograma</label>
              <div className="avatar-grid">
                {DEFAULT_GRADIENTS.map((grad) => (
                  <div 
                    key={grad}
                    className={`monogram-option ${grad} ${selectedGradient === grad ? 'selected' : ''}`}
                    onClick={() => setSelectedGradient(grad)}
                  >
                    {usernameInput ? getMonogram(usernameInput) : 'MS'}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="interval">Frecuencia del Recordatorio</label>
              <select id="interval" name="interval" className="form-control" defaultValue={currentUser?.reminder_interval || 45}>
                <option value="30">Cada 30 minutos</option>
                <option value="45">Cada 45 minutos</option>
                <option value="60">Cada hora</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="lunch_start">Inicio Almuerzo</label>
                <input
                  type="time"
                  id="lunch_start"
                  name="lunch_start"
                  className="form-control"
                  defaultValue={currentUser?.lunch_start || '14:00'}
                  required
                />
              </div>
              <div>
                <label htmlFor="lunch_end">Fin Almuerzo</label>
                <input
                  type="time"
                  id="lunch_end"
                  name="lunch_end"
                  className="form-control"
                  defaultValue={currentUser?.lunch_end || '16:00'}
                  required
                />
              </div>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="equipment"
                name="equipment"
                defaultChecked={currentUser?.has_equipment || false}
              />
              <label htmlFor="equipment">Dispongo de Material de peso (Mancuerna, Kettlebell, Garrafa)</label>
            </div>

            <button type="submit" className="db-btn db-btn-accent">
              Guardar y Configurar
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (gameState === 'access_restricted') {
    return (
      <div className="app-container" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <header style={{ justifyContent: 'center', marginBottom: '24px' }}><h1>Snacks de Movimiento</h1></header>
        <div className="db-card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <h2 className="db-card-title">Perfil no autorizado</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>Los perfiles se administran fuera de la aplicación. Solicita al responsable que dé de alta tu usuario.</p>
        </div>
      </div>
    );
  }

  if (gameState === 'settings') {
    return (
      <div className="app-container" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <header><h1>Snacks de Movimiento</h1></header>
        <div className="db-card">
          <div className="db-card-header">
            <h2 className="db-card-title">Horario y recordatorios</h2>
          </div>
          <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="form-group">
              <label htmlFor="interval">Tiempo entre snacks</label>
              <select id="interval" name="interval" className="form-control" defaultValue={currentUser?.reminder_interval || 45}>
                <option value="30">Cada 30 minutos</option>
                <option value="45">Cada 45 minutos</option>
                <option value="60">Cada hora</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="lunch_start">Inicio almuerzo</label>
                <input type="time" id="lunch_start" name="lunch_start" className="form-control" defaultValue={currentUser?.lunch_start || '14:00'} required />
              </div>
              <div>
                <label htmlFor="lunch_end">Fin almuerzo</label>
                <input type="time" id="lunch_end" name="lunch_end" className="form-control" defaultValue={currentUser?.lunch_end || '16:00'} required />
              </div>
            </div>
            <button type="submit" className="db-btn db-btn-accent">Guardar ajustes</button>
            <button type="button" className="db-btn db-btn-secondary" onClick={() => setGameState(nextSnackTime ? 'idle_countdown' : 'waiting_start')}>Cancelar</button>
          </form>
        </div>
      </div>
    );
  }

  const isWorkoutMode = gameState === 'preview_card' || gameState === 'active_timer';

  return (
    <div className={`app-container ${isWorkoutMode ? 'workout-focus' : ''}`}>
      {/* Banner de Notificación */}
      {!notificationsGranted && !inTeams && !dismissedNotificationBanner && (
        <div className="notification-banner">
          <span>Habilita las notificaciones flotantes para recibir alertas de escritorio con auto-enfoque.</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="db-btn db-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.75rem' }} onClick={requestNotificationPermission}>
              Activar
            </button>
             <button 
               style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
               onClick={() => {
                 setDismissedNotificationBanner(true);
                 localStorage.setItem('movement_snacks_notifications_dismissed', 'true');
               }}
               title="Cerrar aviso"
             >
               ✕
             </button>
          </div>
        </div>
      )}

      {/* Cabecera */}
      <header>
        <h1>Snacks de Movimiento</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div 
            className="user-tag" 
            onClick={() => setGameState('user_selection')} 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} 
            title="Haz clic para cambiar de usuario"
          >
            <div className={`monogram ${currentUser?.avatar_url || 'm-grad-1'}`}>
              {getMonogram(currentUser?.username)}
            </div>
            <span style={{ fontWeight: 600 }}>{currentUser?.username || 'Seleccionar Usuario'}</span>
          </div>
          <button 
            className="db-btn db-btn-secondary" 
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.75rem', 
              backgroundColor: meetingMode ? 'rgba(234, 88, 12, 0.15)' : 'transparent',
              borderColor: meetingMode ? '#ea580c' : 'var(--border-color)',
              color: meetingMode ? '#ea580c' : 'var(--text-primary)',
              fontWeight: meetingMode ? 700 : 400
            }} 
            onClick={toggleMeetingMode}
            title={meetingMode ? 'Notificaciones silenciadas durante reuniones' : 'Silenciar notificaciones durante reuniones'}
          >
            {meetingMode ? '🤫 Modo Reunión (Silenciado)' : '🔔 Notificaciones'}
          </button>
          <button className="db-btn db-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.75rem', borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => setShowCatalog(true)}>
            Ver Plan Diario
          </button>
          <button className="db-btn db-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.75rem' }} onClick={() => setGameState('settings')}>
            Horario y recordatorios
          </button>
        </div>
      </header>

      {/* Banner Leitmotiv en Relieve de Piedra */}
      {currentUser && gameState !== 'onboarding' && (
        <div className="stone-leitmotiv-container">
          <span className="stone-leitmotiv-text">
            “No dejes que lo perfecto sea enemigo de lo hecho”
          </span>
        </div>
      )}

      {isWorkoutMode ? (
        /* MODO ENTRENAMIENTO: Ocupa el ancho completo (100%) para dar máximo espacio al vídeo y al carrusel */
        <div style={{ width: '100%' }}>
          {gameState === 'preview_card' && (
            <div className="db-card">
              <div className="db-card-header">
                <h2 className="db-card-title">{activeRoutineName || 'Fases del Snack de Movimiento'}</h2>
                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 800 }}>PREPARACIÓN</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Vista previa con demostraciones animadas locales */}
                <div className="filmstrip-container">
                  {activePhases.map((phase, idx) => (
                    <div key={idx} className="filmstrip-card">
                      <span className="filmstrip-card-title">Fase {idx + 1}</span>
                      
                      <div className="filmstrip-video-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                        <ExerciseDemo phase={phase} compact />
                      </div>

                      <span className="filmstrip-card-desc">{phase.name}</span>
                      <span className="filmstrip-card-duration">{phase.duration}s</span>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2px', lineHeight: '1.25' }}>
                        {phase.desc}
                      </p>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 'auto' }}>
                        🎯 {phase.muscles}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Categoría activa: <span style={{ color: 'var(--accent)' }}>{categoryLabels[activeCategory].toUpperCase()}</span>
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
                      Demostraciones animadas locales para seguir cada fase sin depender de vídeos externos.
                    </p>
                  </div>
                  
                  {currentUser?.has_equipment ? (
                    <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: '8px', padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#b45309', margin: 0 }}>
                      ⚠️ Necesitas material de peso (Mancuerna/Garrafa).
                    </div>
                  ) : (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '8px', padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#166534', margin: 0 }}>
                      ✅ Ejercicio 100% peso corporal (sin material).
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center', borderTop: '1.5px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    Levántate, separa el teclado y colócate en posición.
                  </p>
                  
                  <button className="db-btn db-btn-accent" style={{ width: '100%', fontSize: '1.05rem', padding: '16px' }} onClick={handleStartSnack}>
                    ⏱️ Comenzar Snack de 2 Minutos
                  </button>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button className="db-btn db-btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }} onClick={() => handleSnooze(10)}>
                      ⏸️ Posponer 10 min
                    </button>
                    <button className="db-btn db-btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }} onClick={() => setGameState('idle_countdown')}>
                      ↩️ Guardar para luego (Tengo reunión)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {gameState === 'active_timer' && activePhases.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '5fr 1fr', gap: '24px', width: '100%' }}>
              
              {/* Columna Izquierda: Temporizador, Video y Controles */}
              <div className="db-card" style={{ gap: '20px', padding: '24px' }}>
                <div className="db-card-header">
                  <div>
                    <h2 className="db-card-title" style={{ fontSize: '1.25rem' }}>
                      {inTransition ? `Siguiente: ${activePhases[currentPhaseIndex]?.name}` : activePhases[currentPhaseIndex]?.name}
                    </h2>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                      {activeRoutineName}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.05em' }}>
                    {inTransition ? 'PREPARACIÓN' : `FASE ${currentPhaseIndex + 1} DE ${activePhases.length}`}
                  </span>
                </div>

                <div className="active-video-widget">
                  <div className="active-video-label">{inTransition ? 'Prepárate para el siguiente movimiento' : 'Demostración animada'}</div>
                  <div className="active-video-container" style={{ position: 'relative', width: '100%', height: '460px' }}>
                    {inTransition ? (
                      <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRadius: '8px',
                        border: '2px dashed var(--accent)',
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
                      }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>
                          Siguiente Ejercicio - Prepárate 🏁
                        </span>
                        <h3 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 12px 0', color: '#fff', textAlign: 'center', padding: '0 20px' }}>
                          {activePhases[currentPhaseIndex]?.name}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '460px', textAlign: 'center', margin: '0 0 20px 0', padding: '0 20px', lineHeight: '1.45' }}>
                          {activePhases[currentPhaseIndex]?.desc}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' }}>
                          <span style={{ fontSize: '0.9rem' }}>🎯</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Músculos: {activePhases[currentPhaseIndex]?.muscles}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Comienza en</span>
                          <span style={{ fontSize: '5rem', fontWeight: 950, color: 'var(--accent)', lineHeight: 1, textShadow: '0 0 25px rgba(239, 68, 68, 0.4)' }}>
                            {secondsInPhase}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <ExerciseDemo phase={activePhases[currentPhaseIndex]} />
                    )}
                  </div>
                </div>

                <div className="timer-display" style={{ marginTop: '10px' }}>
                  <div className="timer-countdown" style={{ fontSize: '4.5rem', lineHeight: '1.1', color: inTransition ? 'var(--accent)' : '#000000' }}>
                    {inTransition ? `Prep: ${secondsInPhase}s` : formatTime(secondsInPhase)}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '10px', maxWidth: '500px', marginInline: 'auto' }}>
                    {activePhases[currentPhaseIndex]?.desc}
                  </p>
                </div>

                {/* Barra de Progreso Visual */}
                <div className="phases-timeline" style={{ margin: '10px 0' }}>
                  {activePhases.map((phase, idx) => {
                    let cls = 'phase-step';
                    if (idx === currentPhaseIndex) cls += ' active';
                    else if (idx < currentPhaseIndex) cls += ' completed';
                    return (
                      <div key={idx} className={cls} style={{ fontSize: '0.7rem', padding: '6px' }}>
                        {phase.name.split(' ')[0]}
                      </div>
                    );
                  })}
                </div>

                {/* Controles de Emergencia / Posponer / Saltar */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                  <button
                    className="db-btn db-btn-secondary"
                    style={{ flex: 1, padding: '10px' }}
                    onClick={() => handleSnooze(5)}
                    disabled={snoozeCount >= 3}
                  >
                    Posponer 5 min ({snoozeCount}/3)
                  </button>
                  <button className="db-btn db-btn-secondary" style={{ flex: 1, padding: '10px' }} onClick={() => handleSkipSnack('skipped')}>
                    Saltar
                  </button>
                </div>
              </div>

              {/* Columna Derecha: Mapa Muscular Garmin Completo */}
              <div className="db-card" style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <AnatomicalModel 
                  category={activeCategory} 
                  musclesList={activePhases[currentPhaseIndex]?.muscles} 
                  exerciseName={activePhases[currentPhaseIndex]?.name} 
                />
              </div>

            </div>
          )}
        </div>
      ) : (
        /* MODO JORNADA / TRABAJO: Grid de dos columnas (cuenta atrás a la izquierda, social a la derecha) */
        <div className="main-grid">
          
          {/* PANEL IZQUIERDO: ESTADO / JUEGO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* PANTALLA: ESPERANDO INICIAR JORNADA */}
            {gameState === 'waiting_start' && (
              <div className="db-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💼</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
                  ¡Hola de nuevo, {currentUser?.username}!
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
                  Tu temporizador inteligente está configurado. Pulsa el botón cuando comiences tu jornada de trabajo en el ordenador.
                </p>
                <button className="db-btn db-btn-accent" style={{ fontSize: '1rem', padding: '18px 36px' }} onClick={handleStartDay}>
                  Ya estoy en el ordenador, iniciar
                </button>
              </div>
            )}

             {/* PANTALLA: CUENTA ATRÁS HASTA EL SIGUIENTE SNACK */}
             {gameState === 'idle_countdown' && (() => {
               const lunchStart = currentUser?.lunch_start || '14:00';
               const lunchEnd = currentUser?.lunch_end || '16:00';
               const inLunch = isTimeInWindow(lunchStart, lunchEnd);
               
               if (inLunch) {
                 return (
                   <div className="db-card" style={{ alignItems: 'center', padding: '48px 32px', textAlign: 'center' }}>
                     <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🍱</div>
                     <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.15em' }}>
                       Pausa de Almuerzo Activa
                     </div>
                     <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '16px 0', color: 'var(--text-primary)' }}>
                       Hora de comer y descansar: {lunchStart} - {lunchEnd}
                     </div>
                     <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', marginInline: 'auto', lineHeight: '1.4' }}>
                       Disfruta de tu almuerzo. El temporizador de snacks de movimiento se encuentra congelado y se reanudará automáticamente una vez finalizado este período para evitar interrumpir tus comidas.
                     </p>
                   </div>
                 );
               }

               const { routine, completedCount, totalCount } = getCurrentRoutine(currentUser);
               return (
                 <div className="db-card" style={{ alignItems: 'center', padding: '48px 32px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                      Siguiente: {routine?.routineName || categoryLabels[activeCategory]?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', marginTop: '4px' }}>
                      {completedCount} de {totalCount} rutinas completadas hoy
                    </div>
                    <div className="timer-countdown" style={{ margin: '24px 0', fontSize: '5.5rem' }}>
                      {formatTime(secondsToNextSnack)}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px', textAlign: 'center' }}>
                      Concéntrate en tu trabajo. Cuando el contador llegue a cero, te avisaremos para activar el cuerpo.
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button className="db-btn db-btn-accent" onClick={triggerSnackAlert}>
                        Comenzar Snack Ya
                      </button>
                      <button className="db-btn db-btn-secondary" onClick={() => handleSnooze(10)}>
                        Posponer 10 min
                      </button>
                    </div>
                  </div>
               );
             })()}

          </div>

          {/* PANEL DERECHO: COMPETICIÓN (LEADERBOARD Y FEED) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Marcador en Tiempo Real */}
            <div className="db-card">
              <div className="db-card-header">
                <h2 className="db-card-title">Marcador Diario 🏆</h2>
              </div>
              <div className="leaderboard-list">
                {usersList.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Esperando participantes...</p>
                ) : (
                  usersList.map((user, idx) => (
                    <div key={user.id} className="leaderboard-item">
                      <div className="leaderboard-rank">{idx + 1}</div>
                      <div className="leaderboard-user">
                        <div className={`monogram ${user.avatar_url || 'm-grad-1'}`} style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                          {getMonogram(user.username)}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.username} {user.id === currentUser?.id ? '(Tú)' : ''}</span>
                      </div>
                      <div className="leaderboard-points">{user.points} pts</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calendario Histórico de Campeones */}
            <CalendarWidget dailyWinners={dailyWinners} getMonogram={getMonogram} />

            {/* Feed de Actividad */}
            <div className="db-card">
              <div className="db-card-header">
                <h2 className="db-card-title">Actividad Reciente 💬</h2>
              </div>
              <div className="activity-feed">
                {activityFeed.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ningún registro hoy.</p>
                ) : (
                  activityFeed.map((log) => {
                    const date = new Date(log.created_at);
                    const isCompleted = log.status === 'completed';
                    const userObj = log.users || currentUser;
                    return (
                      <div key={log.id} className="activity-item" style={{ borderLeftColor: isCompleted ? 'var(--accent)' : '#ef4444' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className={`monogram ${userObj?.avatar_url || 'm-grad-1'}`} style={{ width: '22px', height: '22px', fontSize: '0.6rem' }}>
                            {getMonogram(userObj?.username || '')}
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            {userObj?.username}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {isCompleted 
                            ? (log.category === 'finalizado'
                              ? `Finalizó su jornada de trabajo por hoy 🏁`
                              : `Completó Snack de ${categoryLabels[log.category] || log.category} (+${log.points_earned} pts)`)
                            : `Se saltó el Snack de ${categoryLabels[log.category] || log.category}`}
                        </span>
                        <span className="activity-time">
                          {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODAL DEL PLAN DE RUTINAS */}
      {showCatalog && (
        <div className="catalog-modal-overlay" onClick={() => setShowCatalog(false)}>
          <div className="catalog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="catalog-header">
              <h2 className="catalog-header-title">Plan diario de {DAILY_ROUTINES_LIST.length} rutinas</h2>
              <button className="catalog-close-btn" onClick={() => setShowCatalog(false)}>✕</button>
            </div>
            
            <div className="catalog-content" style={{ paddingTop: '16px' }}>
              <div className="catalog-grid">
                {DAILY_ROUTINES_LIST.map((routine, index) => (
                  <div key={routine.id} className="exercise-catalog-card">
                    <div className="exercise-video-thumbnail-container">
                      <ExerciseDemo phase={routine.phases[0]} compact />
                    </div>
                    <div className="exercise-card-info">
                      <h3 className="exercise-card-title">{routine.routineName}</h3>
                      <p className="exercise-card-desc">
                        {index < 6 ? 'Antes del almuerzo' : 'Después del almuerzo'} · {categoryLabels[routine.category]}
                      </p>
                      <div className="exercise-badge-row">
                        {routine.phases.slice(0, 4).map((phase) => (
                          <span key={phase.name} className="exercise-badge">{phase.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Indicador de versión para control de caché */}
      <footer style={{ marginTop: 'auto', paddingTop: '32px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span>v1.3.1 - Filtro de Limpieza de Registros de Prueba ⏱️</span>
      </footer>
    </div>
  );
}

// Componente del Calendario de Campeones Diarios (Histórico)
function CalendarWidget({ dailyWinners, getMonogram }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDaysInMonth = (y, m) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (y, m) => {
    let day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1; // Ajustado: Lunes=0, Domingo=6
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarCells = [];

  // Rellenar días vacíos del mes anterior
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push({ key: `blank-${i}`, day: null, dateStr: null });
  }

  // Rellenar días del mes actual
  for (let d = 1; d <= daysInMonth; d++) {
    const pad = (num) => num.toString().padStart(2, '0');
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    calendarCells.push({ key: `day-${d}`, day: d, dateStr });
  }

  const daysOfWeek = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  return (
    <div className="db-card" style={{ gap: '16px', padding: '24px 20px' }}>
      <div className="db-card-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '4px' }}>
        <h2 className="db-card-title" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Campeones Diarios 🏆
        </h2>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button 
            type="button"
            className="db-btn db-btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '0.65rem', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }} 
            onClick={handlePrevMonth}
          >
            ◀
          </button>
          <span style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', minWidth: '85px', textAlign: 'center', color: 'var(--text-primary)' }}>
            {monthNames[month]} {year}
          </span>
          <button 
            type="button"
            className="db-btn db-btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '0.65rem', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }} 
            onClick={handleNextMonth}
          >
            ▶
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
        {/* Encabezados de días */}
        {daysOfWeek.map(d => (
          <div key={d} style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
            {d}
          </div>
        ))}

        {/* Celdas del calendario */}
        {calendarCells.map((cell, idx) => {
          const winnerData = cell.dateStr ? dailyWinners[cell.dateStr] : null;
          const isToday = cell.dateStr === new Date().toLocaleDateString('sv-SE');
          
          return (
            <div
              key={cell.key}
              style={{
                aspectRatio: '1',
                background: isToday ? 'var(--accent-light)' : 'var(--bg-card)',
                border: isToday ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                padding: '4px',
                minHeight: '44px',
                opacity: cell.day ? 1 : 0.25
              }}
              className={winnerData ? 'tooltip-trigger' : ''}
            >
              {cell.day && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: isToday ? 900 : 700,
                  color: isToday ? 'var(--accent)' : 'var(--text-primary)',
                  position: 'absolute',
                  top: '3px',
                  left: '4px',
                  lineHeight: '1'
                }}>
                  {cell.day}
                </span>
              )}
              
              {winnerData && (
                <div 
                  className={`monogram ${winnerData.winner.avatar_url || 'm-grad-1'}`}
                  style={{
                    width: '24px',
                    height: '24px',
                    fontSize: '0.6rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '10px',
                    border: '1.5px solid var(--bg-card)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {getMonogram(winnerData.winner.username)}
                  
                  {/* Tooltip CSS elegante */}
                  <span className="tooltip-content" style={{ zIndex: 9999 }}>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px', marginBottom: '4px' }}>
                      🏆 Campeón del Día ({cell.day} de {monthNames[month]})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                      <div className={`monogram ${winnerData.winner.avatar_url || 'm-grad-1'}`} style={{ width: '18px', height: '18px', fontSize: '0.55rem' }}>
                        {getMonogram(winnerData.winner.username)}
                      </div>
                      <span style={{ fontWeight: 800 }}>{winnerData.winner.username}: {winnerData.points} pts</span>
                    </div>
                    {winnerData.scores.length > 1 && (
                      <div style={{ marginTop: '6px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)' }}>
                        <div style={{ fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase' }}>Clasificación:</div>
                        {winnerData.scores.map((s, sIdx) => (
                          <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                            <span>{sIdx + 1}. {s.user.username}</span>
                            <span style={{ fontWeight: 750 }}>{s.points} pts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
