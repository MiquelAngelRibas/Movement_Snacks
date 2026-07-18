import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import * as microsoftTeams from '@microsoft/teams-js';
import confetti from 'canvas-confetti';
import { exercisesData, EXERCISE_CATEGORIES, categoryLabels, categoryIcons } from './exercisesData';
import AnatomicalModel from './AnatomicalModel';

// Utilidad para reproducir tonos audibles mediante la Web Audio API (evita depender de mp3 externos)
const playAudioTone = (frequency = 440, duration = 0.15) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
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
    
    dailyPoints[dateStr][log.user_id] = (dailyPoints[dateStr][log.user_id] || 0) + (log.points_earned || 10);
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Estados del Juego / Flujo ---
  // gameState: 'onboarding' | 'waiting_start' | 'idle_countdown' | 'preview_card' | 'active_timer'
  const [gameState, setGameState] = useState('onboarding');
  const [nextSnackTime, setNextSnackTime] = useState(null);
  const [secondsToNextSnack, setSecondsToNextSnack] = useState(0);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [usernameInput, setUsernameInput] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('m-grad-1');

  // --- Estados del Catálogo/Galería de Ejercicios ---
  const [showCatalog, setShowCatalog] = useState(false);
  const [activeCatalogTab, setActiveCatalogTab] = useState('pierna');
  const [hoveredExercise, setHoveredExercise] = useState(null);

  // --- Estados del Temporizador del Ejercicio ---
  const [activeCategory, setActiveCategory] = useState('pierna');
  const [activePhases, setActivePhases] = useState([]);
  const [activeRoutineName, setActiveRoutineName] = useState('');
  const [startCountdown, setStartCountdown] = useState(-1);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [secondsInPhase, setSecondsInPhase] = useState(0);

  // --- Estados del Tablero Social (Supabase) ---
  const [usersList, setUsersList] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [dailyWinners, setDailyWinners] = useState({});

  // --- Estado de Permisos ---
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  // --- Referencias ---
  const countdownTimerRef = useRef(null);
  const activeSnackTimerRef = useRef(null);

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

    const checkExistingUser = async () => {
      setLoading(true);
      try {
        // 1. Intentar iniciar Microsoft Teams SDK
        try {
          await microsoftTeams.app.initialize();
          const context = await microsoftTeams.app.getContext();
          if (context?.user?.userPrincipalName) {
            const teamsId = context.user.userPrincipalName; // Usamos email de Teams como ID único
            if (supabase) {
              const { data, error } = await supabase.from('users').select('*').eq('id', teamsId).maybeSingle();
              if (data) {
                setCurrentUser(data);
                setGameState('waiting_start');
                setLoading(false);
                return;
              }
            }
            // Si no existe pero estamos en Teams, rellenamos el onboarding con el nombre de Teams
            setCurrentUser({ id: teamsId, username: context.user.displayName || '', avatar_url: 'm-grad-1', reminder_interval: 45, has_equipment: false });
            setUsernameInput(context.user.displayName || '');
            setGameState('onboarding');
            setLoading(false);
            return;
          }
        } catch (teamsError) {
          console.log('No se detectó el entorno de MS Teams, usando almacenamiento local.');
        }

        // 2. Fallback a LocalStorage en navegador estándar
        const localUserId = localStorage.getItem('movement_snacks_user_id');
        if (localUserId) {
          if (supabase) {
            const { data, error } = await supabase.from('users').select('*').eq('id', localUserId).maybeSingle();
            if (data) {
              setCurrentUser(data);
              setGameState('waiting_start');
              setLoading(false);
              return;
            }
          }
          
          // Si no hay Supabase o no se encontró en DB, recuperamos el perfil local guardado
          const cachedUser = localStorage.getItem('movement_snacks_profile');
          if (cachedUser) {
            const parsed = JSON.parse(cachedUser);
            setCurrentUser(parsed);
            setGameState('waiting_start');
          } else {
            setGameState('onboarding');
          }
        } else {
          setGameState('onboarding');
        }
      } catch (err) {
        console.error('Error al comprobar usuario existente:', err);
        setGameState('onboarding');
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

  // --- Carga de Marcador y Feed ---
  useEffect(() => {
    if (gameState === 'onboarding' || !currentUser) return;

    const fetchLeaderboard = async () => {
      if (!supabase) {
        // Inicializar historial local si no existe para hacer la demostración vistosa
        if (!localStorage.getItem('movement_snacks_logs_history')) {
          const mockHistory = [];
          const today = new Date();
          const users = [
            { id: 'local_user', username: currentUser?.username || 'Miquel Ángel', avatar_url: currentUser?.avatar_url || 'm-grad-1' },
            { id: 'compañero_demo', username: 'Carlos R.', avatar_url: 'm-grad-2' }
          ];
          
          // Generar datos para los últimos 20 días
          for (let i = 1; i <= 20; i++) {
            const logDate = new Date();
            logDate.setDate(today.getDate() - i);
            
            // Alternar ganadores entre los dos usuarios
            const winnerIdx = i % 2 === 0 ? 0 : 1;
            const loserIdx = winnerIdx === 0 ? 1 : 0;
            
            // Ganador del día hace 3-4 snacks
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
            
            // El otro hace 1-2 snacks
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
        const localLogs = JSON.parse(localStorage.getItem('movement_snacks_logs_today') || '[]');
        const myPoints = localLogs.filter(l => l.status === 'completed').reduce((sum, l) => sum + (l.points_earned || 10), 0);

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
        // Obtener usuarios
        const { data: usersData } = await supabase.from('users').select('*');
        
        // Obtener TODOS los logs completados para calcular el histórico y el de hoy
        const { data: allLogsData } = await supabase
          .from('snacks_log')
          .select('user_id, points_earned, status, created_at')
          .eq('status', 'completed');

        // Filtrar para el marcador de hoy
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const pointsMap = {};
        allLogsData?.forEach((log) => {
          const logDateStr = new Date(log.created_at).toLocaleDateString('sv-SE');
          if (logDateStr === todayStr) {
            pointsMap[log.user_id] = (pointsMap[log.user_id] || 0) + log.points_earned;
          }
        });

        const sortedUsers = (usersData || []).map((u) => ({
          ...u,
          points: pointsMap[u.id] || 0
        })).sort((a, b) => b.points - a.points);

        setUsersList(sortedUsers);

        // Calcular mapa de ganadores diarios para el calendario
        const winners = calculateWinnersMap(allLogsData || [], usersData || []);
        setDailyWinners(winners);
      } catch (err) {
        console.error('Error al cargar marcador/historial de Supabase:', err);
      }
    };

    const fetchActivityFeed = async () => {
      if (!supabase) {
        // Carga de feed local de respaldo
        const localLogs = JSON.parse(localStorage.getItem('movement_snacks_logs_today') || '[]');
        setActivityFeed(
          localLogs.map((l) => ({
            ...l,
            users: currentUser
          })).reverse()
        );
        return;
      }

      try {
        const { data: logsData } = await supabase
          .from('snacks_log')
          .select('*, users(username, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(10);

        setActivityFeed(logsData || []);
      } catch (err) {
        console.error('Error al cargar feed de actividad:', err);
      }
    };

    fetchLeaderboard();
    fetchActivityFeed();

    if (!supabase) return;

    // Suscripción Realtime a Supabase para notificaciones instantáneas
    const logSubscription = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { event: 'INSERT', table: 'snacks_log' }, (payload) => {
        fetchLeaderboard();
        fetchActivityFeed();
        // Disparar un efecto de sonido / notificación si el log es del compañero
        if (payload.new && payload.new.user_id !== currentUser?.id && payload.new.status === 'completed') {
          playAudioTone(660, 0.4);
          showDesktopNotification('¡Compañero Activo!', `¡Tu compañero ha completado un snack de ${payload.new.category}!`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(logSubscription);
    };
  }, [gameState, currentUser]);

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
      });
    }
  };

  const showDesktopNotification = (title, body) => {
    if (notificationsGranted && 'Notification' in window) {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico'
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
      has_equipment: equipment
    };

    // Guardado local inmediato
    localStorage.setItem('movement_snacks_user_id', id);
    localStorage.setItem('movement_snacks_profile', JSON.stringify(userPayload));

    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').upsert(dbPayload).select().single();
        if (error) throw error;
        setCurrentUser({ ...data, lunch_start: lunchStart, lunch_end: lunchEnd });
      } catch (err) {
        console.error('Error al guardar perfil en Supabase, usando local:', err);
        setCurrentUser(userPayload);
      }
    } else {
      setCurrentUser(userPayload);
    }
    setGameState('waiting_start');
  };

  // Iniciar Jornada ("¡Ya estoy aquí!")
  const handleStartDay = () => {
    playAudioTone(880, 0.2);
    setSnoozeCount(0);
    const minutes = currentUser?.reminder_interval || 45;
    const targetTime = new Date(Date.now() + minutes * 60 * 1000);
    
    // Decidir la categoría inicial de forma circadiana
    const now = new Date();
    const currentHour = now.getHours();
    let initialCategory;
    if (currentHour >= 15) {
      initialCategory = 'movilidad';
    } else {
      const morningCats = ['pierna', 'empuje', 'tiron'];
      initialCategory = morningCats[Math.floor(Math.random() * morningCats.length)];
    }
    setActiveCategory(initialCategory);

    setNextSnackTime(targetTime);
    setSecondsToNextSnack(minutes * 60);
    setGameState('idle_countdown');
  };

  // Alerta de Snack Activada (Se cumplió el tiempo)
  const triggerSnackAlert = () => {
    playAudioTone(523.25, 0.4); // Nota DO5
    setTimeout(() => playAudioTone(659.25, 0.4), 150); // Nota MI5
    
    showDesktopNotification('¡Hora del Snack de Movimiento!', 'Tómate 2 minutos para mover el cuerpo. ¡Haga clic aquí para comenzar!');
    
    // Cargar la lista de rutinas de la categoría activa
    const routines = exercisesData[activeCategory];
    
    // Rotar de forma secuencial y determinista entre las 3 rutinas disponibles usando localStorage
    const lastRoutineIndexKey = `last_routine_idx_${activeCategory}`;
    const lastIdx = parseInt(localStorage.getItem(lastRoutineIndexKey) || '-1');
    const nextIdx = (lastIdx + 1) % routines.length;
    localStorage.setItem(lastRoutineIndexKey, nextIdx.toString());

    const selectedRoutine = routines[nextIdx];
    setActiveRoutineName(selectedRoutine.routineName);
    setActivePhases(selectedRoutine.phases);
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

  // Cronómetro del ejercicio activo
  const runWorkoutTimer = () => {
    setCurrentPhaseIndex(0);
    setSecondsInPhase(activePhases[0].duration);

    let phaseIdx = 0;
    let secLeft = activePhases[0].duration;

    activeSnackTimerRef.current = setInterval(() => {
      secLeft--;
      setSecondsInPhase(secLeft);

      // Pitidos cortos tipo Garmin en los últimos 5 segundos de la fase
      if (secLeft <= 5 && secLeft > 0) {
        playAudioTone(1000, 0.05); // Pitido corto y agudo
      }

      if (secLeft <= 0) {
        // Avanzar de fase
        phaseIdx++;
        if (phaseIdx < activePhases.length) {
          playAudioTone(520, 0.25); // Pitido de aviso de cambio de ejercicio
          setCurrentPhaseIndex(phaseIdx);
          secLeft = activePhases[phaseIdx].duration;
          setSecondsInPhase(secLeft);
        } else {
          // Snack completado!
          clearInterval(activeSnackTimerRef.current);
          handleSnackCompleted();
        }
      }
    }, 1000);
  };

  // Completado con Éxito
  const handleSnackCompleted = async () => {
    playAudioTone(880, 0.15);
    setTimeout(() => playAudioTone(1046.5, 0.4), 100); // Tono de victoria
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    const logPayload = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: currentUser.id,
      category: activeCategory,
      exercises_performed: activePhases.map(p => p.name),
      status: 'completed',
      points_earned: 10,
      created_at: new Date().toISOString()
    };

    // Guardar localmente
    const localLogs = JSON.parse(localStorage.getItem('movement_snacks_logs_today') || '[]');
    localLogs.push(logPayload);
    localStorage.setItem('movement_snacks_logs_today', JSON.stringify(localLogs));

    if (supabase) {
      try {
        await supabase.from('snacks_log').insert({
          user_id: logPayload.user_id,
          category: logPayload.category,
          exercises_performed: logPayload.exercises_performed,
          status: logPayload.status,
          points_earned: logPayload.points_earned
        });
      } catch (err) {
        console.error('Error al guardar log en Supabase:', err);
      }
    } else {
      // Forzar actualización inmediata en UI si estamos en modo local
      setActivityFeed(localLogs.map(l => ({ ...l, users: currentUser })).reverse());
      setUsersList(prev => prev.map(u => u.id === currentUser.id ? { ...u, points: u.points + 10 } : u));
    }

    // Rotar categoría de forma circadiana e inteligente
    const now = new Date();
    const currentHour = now.getHours();
    let nextCategory;
    if (currentHour >= 15) {
      nextCategory = 'movilidad';
    } else {
      const morningCats = ['pierna', 'empuje', 'tiron', 'potencia'];
      const currentIdx = morningCats.indexOf(activeCategory);
      const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % morningCats.length;
      nextCategory = morningCats[nextIdx];
    }
    setActiveCategory(nextCategory);

    // Programar el siguiente
    setSnoozeCount(0);
    const minutes = currentUser?.reminder_interval || 45;
    setNextSnackTime(new Date(Date.now() + minutes * 60 * 1000));
    setSecondsToNextSnack(minutes * 60);
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

    const logPayload = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: currentUser.id,
      category: activeCategory,
      exercises_performed: [],
      status: reason === 'snooze_limit' ? 'snoozed_limit' : 'skipped',
      points_earned: 0,
      created_at: new Date().toISOString()
    };

    // Guardar localmente
    const localLogs = JSON.parse(localStorage.getItem('movement_snacks_logs_today') || '[]');
    localLogs.push(logPayload);
    localStorage.setItem('movement_snacks_logs_today', JSON.stringify(localLogs));

    if (supabase) {
      try {
        await supabase.from('snacks_log').insert({
          user_id: logPayload.user_id,
          category: logPayload.category,
          exercises_performed: logPayload.exercises_performed,
          status: logPayload.status,
          points_earned: logPayload.points_earned
        });
      } catch (err) {
        console.error('Error al guardar log de salto en Supabase:', err);
      }
    } else {
      setActivityFeed(localLogs.map(l => ({ ...l, users: currentUser })).reverse());
    }

    // Rotar categoría de forma circadiana e inteligente
    const now = new Date();
    const currentHour = now.getHours();
    let nextCategory;
    if (currentHour >= 15) {
      nextCategory = 'movilidad';
    } else {
      const morningCats = ['pierna', 'empuje', 'tiron', 'potencia'];
      const currentIdx = morningCats.indexOf(activeCategory);
      const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % morningCats.length;
      nextCategory = morningCats[nextIdx];
    }
    setActiveCategory(nextCategory);

    // Programar el siguiente
    setSnoozeCount(0);
    const minutes = currentUser?.reminder_interval || 45;
    setNextSnackTime(new Date(Date.now() + minutes * 60 * 1000));
    setSecondsToNextSnack(minutes * 60);
    setGameState('idle_countdown');
  };

  // Modificar perfil desde el panel
  const handleEditProfile = () => {
    setGameState('onboarding');
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

  const isWorkoutMode = gameState === 'preview_card' || gameState === 'active_timer';

  return (
    <div className={`app-container ${isWorkoutMode ? 'workout-focus' : ''}`}>
      {/* Banner de Notificación */}
      {!notificationsGranted && (
        <div className="notification-banner">
          <span>Habilita las notificaciones flotantes para recibir alertas de escritorio con auto-enfoque.</span>
          <button className="db-btn db-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.75rem' }} onClick={requestNotificationPermission}>
            Activar
          </button>
        </div>
      )}

      {/* Cabecera */}
      <header>
        <h1>Snacks de Movimiento</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="user-tag">
            <div className={`monogram ${currentUser.avatar_url || 'm-grad-1'}`}>
              {getMonogram(currentUser.username)}
            </div>
            <span>{currentUser.username}</span>
          </div>
          <button className="db-btn db-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.75rem', borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => setShowCatalog(true)}>
            Ver Ejercicios 🎥
          </button>
          <button className="db-btn db-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.75rem' }} onClick={handleEditProfile}>
            Ajustes de Perfil
          </button>
        </div>
      </header>

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
                {/* Carrusel de fotogramas del plan de ejercicio con video de YouTube sin cookies */}
                <div className="filmstrip-container">
                  {activePhases.map((phase, idx) => (
                    <div key={idx} className="filmstrip-card">
                      <span className="filmstrip-card-title">Fase {idx + 1}</span>
                      
                      <div className="filmstrip-video-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                        {!phase.youtubeId ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '2.5rem' }}>🌬️</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Respiración</span>
                          </div>
                        ) : (
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube-nocookie.com/embed/${phase.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${phase.youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
                            title={`Previo ${idx + 1}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            style={{ borderRadius: '8px', width: '100%', height: '100%', pointerEvents: 'none' }}
                          />
                        )}
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
                      Vídeos demostrativos optimizados con privacidad integrada (sin cookies de rastreo).
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

                <div style={{ textAlign: 'center', borderTop: '1.5px solid var(--border-color)', paddingTop: '20px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                    Levántate, separa el teclado y colócate en posición.
                  </p>
                  <button className="db-btn db-btn-accent" style={{ width: '100%', fontSize: '1.05rem', padding: '16px' }} onClick={handleStartSnack}>
                    Comenzar Snack de 2 Minutos
                  </button>
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
                    <h2 className="db-card-title" style={{ fontSize: '1.25rem' }}>{activePhases[currentPhaseIndex]?.name}</h2>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                      {activeRoutineName}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.05em' }}>
                    FASE {currentPhaseIndex + 1} DE 5
                  </span>
                </div>

                <div className="active-video-widget">
                  <div className="active-video-label">Demostración en Vídeo</div>
                  <div className="active-video-container" style={{ position: 'relative', width: '100%', height: '460px' }}>
                    {currentPhaseIndex === 4 ? (
                      <BreathingPacer />
                    ) : (
                      <iframe
                        key={activePhases[currentPhaseIndex]?.youtubeId}
                        width="100%"
                        height="100%"
                        src={`https://www.youtube-nocookie.com/embed/${activePhases[currentPhaseIndex]?.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${activePhases[currentPhaseIndex]?.youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
                        title="Guía del Ejercicio"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        style={{ borderRadius: '8px', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      />
                    )}
                  </div>
                </div>

                <div className="timer-display" style={{ marginTop: '10px' }}>
                  <div className="timer-countdown" style={{ fontSize: '4.5rem', lineHeight: '1.1' }}>{formatTime(secondsInPhase)}</div>
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

                {/* Controles de Emergencia / Posponer */}
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
                  ¡Hola de nuevo, {currentUser.username}!
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

               return (
                 <div className="db-card" style={{ alignItems: 'center', padding: '48px 32px' }}>
                   <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                     Siguiente Snack: {categoryLabels[activeCategory].toUpperCase()}
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
                            ? `Completó Snack de ${categoryLabels[log.category]} (+${log.points_earned} pts)`
                            : `Se saltó el Snack de ${categoryLabels[log.category]}`}
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

      {/* MODAL DE CATÁLOGO / GALERÍA DE EJERCICIOS */}
      {showCatalog && (
        <div className="catalog-modal-overlay" onClick={() => setShowCatalog(false)}>
          <div className="catalog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="catalog-header">
              <h2 className="catalog-header-title">Catálogo y Galería de Ejercicios 🎥</h2>
              <button className="catalog-close-btn" onClick={() => setShowCatalog(false)}>✕</button>
            </div>
            
            {/* Selector de pestañas por categoría */}
            <div className="catalog-tab-bar" style={{ padding: '20px 32px 12px 32px', borderBottom: '1px solid var(--border-color)', background: '#ffffff', flexShrink: 0 }}>
              {EXERCISE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`catalog-tab-btn ${activeCatalogTab === cat ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCatalogTab(cat);
                    setHoveredExercise(null); // Resetear reproducción activa
                  }}
                >
                  {categoryIcons[cat]} {categoryLabels[cat].split(' ')[0]}
                </button>
              ))}
            </div>
            
            <div className="catalog-content" style={{ paddingTop: '16px' }}>
              {/* Grid de ejercicios únicos de la categoría activa */}
              <div className="catalog-grid">
                {(() => {
                  const uniqueExercises = [];
                  const seenNames = new Set();
                  const routines = exercisesData[activeCatalogTab] || [];
                  
                  routines.forEach(r => {
                    r.phases.forEach(p => {
                      // Filtrar fase de enfriamiento sin vídeo y nombres duplicados
                      if (p.phase === 5 || !p.youtubeId) return;
                      if (!seenNames.has(p.name)) {
                        seenNames.add(p.name);
                        uniqueExercises.push(p);
                      }
                    });
                  });

                  return uniqueExercises.map((ex) => {
                    const isHovered = hoveredExercise === ex.name;
                    return (
                      <div 
                        key={ex.name} 
                        className="exercise-catalog-card"
                        onMouseEnter={() => setHoveredExercise(ex.name)}
                        onMouseLeave={() => setHoveredExercise(null)}
                      >
                        <div className="exercise-video-thumbnail-container">
                          {isHovered ? (
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube-nocookie.com/embed/${ex.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${ex.youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
                              title={ex.name}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                            />
                          ) : (
                            <>
                              <img 
                                src={`https://img.youtube.com/vi/${ex.youtubeId}/0.jpg`} 
                                alt={ex.name}
                                className="exercise-video-thumbnail-img"
                                loading="lazy"
                              />
                              <div className="exercise-play-overlay">
                                <div className="exercise-play-btn">▶</div>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="exercise-card-info">
                          <h3 className="exercise-card-title">{ex.name}</h3>
                          <p className="exercise-card-desc">{ex.desc}</p>
                          <div className="exercise-badge-row">
                            {ex.muscles.split(',').map((mus, mIdx) => (
                              <span key={mIdx} className="exercise-badge">
                                {mus.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Respiración Guiada para la fase final del Snack (Cooldown)
function BreathingPacer() {
  const [breathState, setBreathState] = useState('inhale'); // 'inhale' | 'hold' | 'exhale'
  const [seconds, setSeconds] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          if (breathState === 'inhale') {
            setBreathState('hold');
            return 2; // Mantener el aire por 2 segundos
          } else if (breathState === 'hold') {
            setBreathState('exhale');
            return 4; // Exhalar por 4 segundos
          } else {
            setBreathState('inhale');
            return 4; // Inhalar por 4 segundos
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [breathState]);

  return (
    <div className="breathing-pacer-container">
      <div className={`breathing-circle ${breathState}`} />
      <div className="breathing-text">
        {breathState === 'inhale' && 'Inhala Despacio...'}
        {breathState === 'hold' && 'Mantén el Aire...'}
        {breathState === 'exhale' && 'Exhala Suavemente...'}
      </div>
      <div className="breathing-subtext">Sigue el ritmo para bajar pulsaciones</div>
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
