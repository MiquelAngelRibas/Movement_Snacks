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
        if (parsed && parsed.id && parsed.username) return parsed;
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

  // --- Estado del Catálogo de Rutinas y Vista Previa ---
  const [showCatalog, setShowCatalog] = useState(false);
  const [previewExercise, setPreviewExercise] = useState(null);

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
        let activeUser = null;
        let storedId = localStorage.getItem('movement_snacks_user_id');

        try {
          const cachedProfile = localStorage.getItem('movement_snacks_profile');
          if (cachedProfile) {
            const parsed = JSON.parse(cachedProfile);
            if (parsed && parsed.id && parsed.username) {
              activeUser = parsed;
              storedId = parsed.id;
            }
          }
        } catch (e) {}

        // 1. Intentar obtener contexto de Teams
        try {
          await microsoftTeams.app.initialize();
          const context = await microsoftTeams.app.getContext();
          setInTeams(true);
          const upn = context?.user?.userPrincipalName || context?.user?.loginHint;
          if (upn) storedId = upn;
        } catch (teamsError) {
          setInTeams(false);
        }

        // 2. Sincronizar lista de usuarios con Supabase o Local
        let activeUsers = [];
        if (supabase) {
          try {
            const { data: usersData } = await supabase.from('users').select('*');
            if (usersData && usersData.length > 0) {
              activeUsers = usersData.filter(u => !u.username.startsWith('__deleted__'));
              setUsersList(activeUsers);
            }
          } catch (e) {
            console.error('Error al sincronizar con Supabase:', e);
          }
        } else {
          const localUsers = JSON.parse(localStorage.getItem('movement_snacks_users_local') || '[]');
          activeUsers = localUsers.filter(u => !u.username.startsWith('__deleted__'));
          setUsersList(activeUsers);
        }

        // 3. Si hay storedId, buscar coincidencia exacta
        if (storedId && activeUsers.length > 0) {
          const matched = activeUsers.find(u => u.id.toLowerCase() === storedId.toLowerCase());
          if (matched) {
            activeUser = getLocalPreferences({ ...matched });
          }
        }

        // 4. Si NO hay usuario guardado o identificado, ir a pantalla de selección de usuario
        if (!activeUser) {
          setGameState('user_selection');
          return;
        }

        // 5. Persistir usuario activo
        localStorage.setItem('movement_snacks_user_id', activeUser.id);
        localStorage.setItem('movement_snacks_profile', JSON.stringify(activeUser));
        currentUserRef.current = activeUser;
        setCurrentUser(activeUser);

        // 6. Restaurar estado diario o iniciar cuenta atrás
        const restored = restoreDailyState(activeUser);
        if (!restored) {
          const { routine } = getCurrentRoutine(activeUser);
          if (routine) {
            setActiveRoutineName(routine.routineName);
            setActivePhases(routine.phases || []);
            setActiveCategory(routine.category || 'pierna');
          }
          const minutes = activeUser.reminder_interval || 30;
          const targetTime = new Date(Date.now() + minutes * 60 * 1000);
          setNextSnackTime(targetTime);
          setSecondsToNextSnack(minutes * 60);
          setGameState('idle_countdown');
        }
      } catch (err) {
        console.error('Error en checkExistingUser:', err);
        setGameState('user_selection');
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
    const activeUser = currentUser || currentUserRef.current;
    if (!activeUser && !supabase) return;

    if (!supabase) {
      // Carga de marcador local de respaldo
      const cachedUser = activeUser;
      const localLogs = JSON.parse(localStorage.getItem(getDailyLogStorageKey(cachedUser.id)) || '[]');
      const myPoints = localLogs.filter(l => l.status === 'completed').reduce((sum, l) => sum + (l.points_earned ?? 10), 0);

      const localUsers = [
        { id: cachedUser.id, username: cachedUser.username, avatar_url: cachedUser.avatar_url, points: myPoints },
        { id: 'user_w3qke466k', username: 'Joan Payeras', avatar_url: 'm-grad-6', points: 30 }
      ].sort((a, b) => b.points - a.points);
      setUsersList(localUsers);

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

    // Refresco periódico automático cada 15 segundos para sincronización garantizada
    const pollInterval = setInterval(() => {
      fetchLeaderboard();
      fetchActivityFeed();
    }, 15000);

    return () => {
      supabase.removeChannel(logSubscription);
      clearInterval(pollInterval);
    };
  }, [gameState, currentUser, fetchLeaderboard, fetchActivityFeed, meetingMode]);

  // --- Lógica del Temporizador Principal y Soporte en Segundo Plano ---
  useEffect(() => {
    if (gameState !== 'idle_countdown' || !nextSnackTime) {
      document.title = 'Snacks de Movimiento';
      return;
    }

    const checkAndTick = () => {
      const now = new Date();
      const lunchStart = currentUser?.lunch_start || '14:00';
      const lunchEnd = currentUser?.lunch_end || '16:00';
      
      const inLunch = isTimeInWindow(lunchStart, lunchEnd);
      
      if (inLunch) {
        const toMins = (str) => {
          const [h, m] = str.split(':').map(Number);
          return h * 60 + m;
        };
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const endMins = toMins(lunchEnd);
        let minsToWait = endMins - currentMins;
        if (minsToWait < 0) minsToWait += 24 * 60;
        
        const resumeTime = new Date(Date.now() + (minsToWait + 5) * 60 * 1000);
        setNextSnackTime(resumeTime);
        return;
      }

      const remaining = Math.max(0, Math.floor((nextSnackTime.getTime() - Date.now()) / 1000));
      setSecondsToNextSnack(remaining);
      document.title = `(${formatTime(remaining)}) Snacks de Movimiento`;

      if (remaining <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        document.title = '⏰ ¡Hora de tu Snack!';
        triggerSnackAlert();
      }
    };

    // 1. Tick periódico
    checkAndTick();
    countdownTimerRef.current = setInterval(checkAndTick, 1000);

    // 2. Sincronización instantánea al volver a la pestaña o enfocar ventana
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        checkAndTick();
      }
    };

    // 3. Timeout exacto para disparo en segundo plano
    const msRemaining = nextSnackTime.getTime() - Date.now();
    let exactTimeoutId = null;
    if (msRemaining > 0) {
      exactTimeoutId = setTimeout(() => {
        checkAndTick();
      }, msRemaining);
    }

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (exactTimeoutId) clearTimeout(exactTimeoutId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
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
    if (!activeUser) return;
    const userId = activeUser.id;

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
    const localLogs = JSON.parse(localStorage.getItem(getDailyLogStorageKey(userId)) || '[]');
    localLogs.push(logPayload);
    localStorage.setItem(getDailyLogStorageKey(userId), JSON.stringify(localLogs));

    // 2. Avanzar el índice de la rutina
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
    if (supabase) {
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

    const intervalChanged = currentUser?.reminder_interval !== reminderInterval;

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
    currentUserRef.current = updatedUser;
    setCurrentUser(updatedUser);

    if (gameState === 'settings') {
      if (nextSnackTime) {
        // Solo recalculamos el temporizador si el usuario cambió explícitamente el intervalo de tiempo
        if (intervalChanged) {
          const targetTime = new Date(Date.now() + reminderInterval * 60 * 1000);
          setNextSnackTime(targetTime);
          setSecondsToNextSnack(reminderInterval * 60);
        }
        setGameState('idle_countdown');
      } else {
        setGameState('waiting_start');
      }
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
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              padding: '6px 14px',
              borderRadius: '25px',
              border: '1.5px solid var(--border-color)',
              background: '#f8fafc',
              transition: 'all 0.2s ease'
            }} 
            title="Haz clic para cambiar de usuario"
          >
            <div className={`monogram ${currentUser?.avatar_url || 'm-grad-1'}`} style={{ width: '28px', height: '28px', fontSize: '0.85rem' }}>
              {getMonogram(currentUser?.username || '?')}
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              {currentUser?.username || 'Elegir usuario'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 800, background: 'var(--accent-light)', padding: '2px 8px', borderRadius: '12px' }}>
              Cambiar 🔄
            </span>
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
            <div className="db-card" style={{ gap: '24px', padding: '28px' }}>
              
              {/* 1. Encabezado de la Rutina */}
              <div className="db-card-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '0' }}>
                <div>
                  <h2 className="db-card-title" style={{ fontSize: '1.4rem' }}>
                    {activeRoutineName || 'Snack de Movimiento'}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginTop: '3px' }}>
                    Categoría: {categoryLabels[activeCategory]?.toUpperCase()} • 2 minutos
                  </div>
                </div>
                <div>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    background: inTransition ? '#fef3c7' : 'var(--accent-light)', 
                    color: inTransition ? '#d97706' : 'var(--accent)', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontWeight: 800,
                    border: `1.5px solid ${inTransition ? '#fde68a' : 'var(--accent)'}`
                  }}>
                    {inTransition ? '⏸️ DESCANSO / PREPÁRATE' : `FASE ${currentPhaseIndex + 1} DE ${activePhases.length}`}
                  </span>
                </div>
              </div>

              {/* 2. Las 5 Miniaturas de los Ejercicios Visibles Arriba con mayor tamaño */}
              <div className="filmstrip-container" style={{ padding: '6px 0', gap: '14px', overflowX: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
                {activePhases.map((phase, idx) => {
                  const isCurrent = idx === currentPhaseIndex;
                  const isCompleted = idx < currentPhaseIndex;

                  let cardBorder = '1.5px solid var(--border-color)';
                  let cardBg = 'var(--bg-card)';
                  let opacity = 1;
                  let cardShadow = 'var(--shadow-sm)';

                  if (isCurrent) {
                    cardBorder = inTransition ? '2.5px solid #f59e0b' : '2.5px solid var(--accent)';
                    cardBg = inTransition ? '#fffbeb' : 'var(--accent-light)';
                    cardShadow = inTransition ? '0 4px 14px rgba(245, 158, 11, 0.25)' : '0 4px 14px var(--accent-glow)';
                  } else if (isCompleted) {
                    cardBorder = '1.5px solid #86efac';
                    cardBg = '#f0fdf4';
                    opacity = 0.7;
                  }

                  return (
                    <div 
                      key={idx} 
                      className="filmstrip-card"
                      style={{ 
                        border: cardBorder, 
                        background: cardBg, 
                        opacity,
                        padding: '14px',
                        gap: '8px',
                        boxShadow: cardShadow,
                        position: 'relative'
                      }}
                    >
                      {/* Estado superior */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span className="filmstrip-card-title" style={{ fontSize: '0.75rem' }}>Fase {idx + 1}</span>
                        {isCompleted && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                            ✓ Hecho
                          </span>
                        )}
                        {isCurrent && !inTransition && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', background: 'white', padding: '2px 8px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                            ▶ Activo
                          </span>
                        )}
                        {isCurrent && inTransition && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d97706', background: 'white', padding: '2px 8px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                            ⏸️ Siguiente
                          </span>
                        )}
                      </div>

                      {/* Demo animada perfectamente centrada y nítida */}
                      <div className="filmstrip-video-container" style={{ height: '145px', borderRadius: '8px', background: '#ffffff', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ExerciseDemo phase={phase} compact />
                      </div>

                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <span className="filmstrip-card-desc" style={{ fontSize: '0.9rem', fontWeight: 800, display: 'block' }}>{phase.name}</span>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <span className="filmstrip-card-duration" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{phase.duration}s</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700 }}>🎯 {phase.muscles}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. Panel de Temporizador Compacto y Equilibrado */}
              <div style={{ 
                background: inTransition ? '#fffbeb' : '#f8fafc', 
                border: `1.5px solid ${inTransition ? '#f59e0b' : 'var(--border-color)'}`,
                borderRadius: '14px', 
                padding: '20px 24px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center',
                gap: '12px',
                boxShadow: inTransition ? '0 4px 16px rgba(245, 158, 11, 0.12)' : 'var(--shadow-sm)'
              }}>
                
                {/* LÍNEA SUPERIOR: Nombre del ejercicio actual y contador horizontal compacto */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '750px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.1em', 
                      color: inTransition ? '#d97706' : 'var(--accent)' 
                    }}>
                      {inTransition ? '⏸️ DESCANSO / PREPÁRATE' : `EJERCICIO ${currentPhaseIndex + 1} DE ${activePhases.length}`}
                    </span>
                    <h3 style={{ 
                      fontSize: '1.6rem', 
                      fontWeight: 900, 
                      margin: '2px 0 0 0', 
                      color: inTransition ? '#92400e' : 'var(--text-primary)',
                      letterSpacing: '-0.01em'
                    }}>
                      {inTransition 
                        ? `Prepárate: ${activePhases[currentPhaseIndex]?.name}` 
                        : activePhases[currentPhaseIndex]?.name}
                    </h3>
                  </div>

                  {/* CONTADOR DE SEGUNDOS COMPACTO */}
                  <div style={{ 
                    fontSize: '3.4rem', 
                    fontWeight: 950, 
                    lineHeight: 1, 
                    fontVariantNumeric: 'tabular-nums',
                    color: inTransition ? '#d97706' : 'var(--text-primary)',
                    background: inTransition ? '#fef3c7' : 'white',
                    padding: '6px 20px',
                    borderRadius: '12px',
                    border: `1.5px solid ${inTransition ? '#fde68a' : 'var(--border-color)'}`,
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {inTransition ? `${secondsInPhase}s` : formatTime(secondsInPhase)}
                  </div>
                </div>

                {/* LÍNEA INFERIOR: Siguiente Ejercicio en la Secuencia */}
                <div style={{ 
                  width: '100%', 
                  maxWidth: '750px',
                  background: 'white', 
                  border: '1.5px solid var(--border-color)', 
                  borderRadius: '10px', 
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                    <span style={{ fontSize: '1.2rem' }}>⏭️</span>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginRight: '6px' }}>
                        {inTransition ? 'Comenzando en breve:' : 'Siguiente:'}
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {inTransition 
                          ? activePhases[currentPhaseIndex]?.name 
                          : (currentPhaseIndex + 1 < activePhases.length 
                              ? activePhases[currentPhaseIndex + 1]?.name 
                              : '🏁 ¡Último ejercicio! Fin de rutina (+10 pts)')
                        }
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {inTransition 
                      ? `Duración: ${activePhases[currentPhaseIndex]?.duration}s` 
                      : (currentPhaseIndex + 1 < activePhases.length 
                          ? `Duración: ${activePhases[currentPhaseIndex + 1]?.duration}s` 
                          : '🏆 +10 puntos')
                    }
                  </div>
                </div>

              </div>

              {/* 4. Barra de Progreso Visual */}
              <div className="phases-timeline" style={{ margin: '0' }}>
                {activePhases.map((phase, idx) => {
                  let cls = 'phase-step';
                  if (idx === currentPhaseIndex) cls += ' active';
                  else if (idx < currentPhaseIndex) cls += ' completed';
                  return (
                    <div key={idx} className={cls} style={{ fontSize: '0.75rem', padding: '8px' }}>
                      {phase.name.split(' ')[0]}
                    </div>
                  );
                })}
              </div>

              {/* 5. Controles de Emergencia / Posponer / Saltar */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  className="db-btn db-btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={() => handleSnooze(5)}
                  disabled={snoozeCount >= 3}
                >
                  Posponer 5 min ({snoozeCount}/3)
                </button>
                <button className="db-btn db-btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={() => handleSkipSnack('skipped')}>
                  Saltar este snack
                </button>
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
          <div className="catalog-modal" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
            <div className="catalog-header">
              <div>
                <h2 className="catalog-header-title">Plan Diario de {DAILY_ROUTINES_LIST.length} Snacks de Movimiento</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                  Haz clic en cualquier ejercicio para ver su animación GIF, postura y técnica recomendada.
                </div>
              </div>
              <button className="catalog-close-btn" onClick={() => setShowCatalog(false)}>✕</button>
            </div>
            
            <div className="catalog-content" style={{ paddingTop: '16px' }}>
              <div className="catalog-grid">
                {DAILY_ROUTINES_LIST.map((routine, index) => (
                  <div key={routine.id} className="routine-catalog-card">
                    
                    {/* Cabecera de la Rutina */}
                    <div className="routine-card-top">
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Snack {index + 1} • {index < 6 ? 'Mañana' : 'Tarde'}
                        </div>
                        <h3 className="routine-card-title">{routine.routineName}</h3>
                      </div>
                      <span className="routine-card-category">
                        {categoryLabels[routine.category]}
                      </span>
                    </div>

                    {/* Lista de Fases de la Rutina */}
                    <div className="routine-phases-list">
                      {routine.phases.map((phase, pIdx) => (
                        <div 
                          key={pIdx} 
                          className="routine-phase-item"
                          onClick={() => setPreviewExercise(phase)}
                          title={`Ver animación de ${phase.name}`}
                        >
                          <span className="routine-phase-num">{pIdx + 1}</span>
                          <div className="routine-phase-info">
                            <span className="routine-phase-name">{phase.name}</span>
                            <span className="routine-phase-meta">{phase.duration}s • 🎯 {phase.muscles}</span>
                          </div>
                          <span className="routine-phase-view-btn">
                            👁️ Ver GIF
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP / MODAL DE VISTA PREVIA DE UN EJERCICIO INDIVIDUAL */}
      {previewExercise && (
        <div className="exercise-preview-modal-overlay" onClick={() => setPreviewExercise(null)}>
          <div className="exercise-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="exercise-preview-header">
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Demostración Técnica
                </span>
                <h3 className="exercise-preview-title">{previewExercise.name}</h3>
              </div>
              <button 
                className="catalog-close-btn" 
                style={{ width: '32px', height: '32px', fontSize: '1rem' }} 
                onClick={() => setPreviewExercise(null)}
              >
                ✕
              </button>
            </div>

            <div className="exercise-preview-body">
              {/* Animación GIF perfectamente centrada */}
              <div className="exercise-preview-video">
                <ExerciseDemo phase={previewExercise} compact />
              </div>

              {/* Foco muscular */}
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🎯</span>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Músculos implicados</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{previewExercise.muscles}</div>
                </div>
              </div>

              {/* Instrucciones de ejecución */}
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Técnica recomendada</div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.45' }}>
                  {previewExercise.desc}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  ⏱️ Duración habitual: <strong style={{ color: 'var(--accent)' }}>{previewExercise.duration}s</strong>
                </span>
                <button 
                  className="db-btn db-btn-accent" 
                  style={{ padding: '8px 18px', fontSize: '0.8rem' }}
                  onClick={() => setPreviewExercise(null)}
                >
                  Entendido ✓
                </button>
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
