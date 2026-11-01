import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { HUD } from './components/HUD';
import { ControlMode, CameraMode, TimeOfDay, GameStats } from './game/types';
import { soundEngine } from './game/audio';
import { INITIAL_QUESTS } from './game/quests';

export default function App() {
  const [controlMode, setControlMode] = useState<ControlMode>('WALK');
  const [cameraMode, setCameraMode] = useState<CameraMode>('FOLLOW');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('DAY');
  const [isRadioOn, setIsRadioOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [message, setMessage] = useState<string | null>('MR BAAZ 3D • देवभूमि उत्तराखंड में स्वागत है! 🏔️');

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    completedQuests: 0,
    totalQuests: INITIAL_QUESTS.length,
    distanceTraveledKm: 0,
    speedKmh: 0,
    activeQuestId: INITIAL_QUESTS[0].id,
  });

  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });

  // Keyboard input ref for real-time responsiveness without re-renders
  const keyboardInputRef = useRef({
    forward: 0,
    turn: 0,
    jump: false,
    sprint: false,
    handbrake: false,
    horn: false,
  });

  // Timed banner message
  const msgTimerRef = useRef<number | null>(null);
  const showBannerMessage = useCallback((text: string) => {
    setMessage(text);
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = window.setTimeout(() => {
      setMessage(null);
    }, 3200);
  }, []);

  // Enter/Exit Jeep toggle handler
  const handleToggleDrive = useCallback(() => {
    // Canvas handles proximity and mode switch
    const eEvent = new KeyboardEvent('keydown', { key: 'e' });
    window.dispatchEvent(eEvent);
  }, []);

  // Jump handler
  const handleJump = useCallback(() => {
    keyboardInputRef.current.jump = true;
    if (controlMode === 'DRIVE') {
      keyboardInputRef.current.handbrake = true;
      setTimeout(() => {
        keyboardInputRef.current.handbrake = false;
      }, 500);
    }
  }, [controlMode]);

  // Horn handler
  const handleHorn = useCallback(() => {
    soundEngine.playHorn();
  }, []);

  // Lights toggle
  const handleToggleLights = useCallback(() => {
    const lEvent = new KeyboardEvent('keydown', { key: 'l' });
    window.dispatchEvent(lEvent);
  }, []);

  // Cycle Camera Views
  const handleCycleCamera = useCallback(() => {
    const modes: CameraMode[] = ['FOLLOW', 'WIDE', 'CLOSE', 'HOOD'];
    setCameraMode((prev) => {
      const nextIdx = (modes.indexOf(prev) + 1) % modes.length;
      const nextMode = modes[nextIdx];
      showBannerMessage(`Camera: ${nextMode}`);
      return nextMode;
    });
  }, [showBannerMessage]);

  // Cycle Time of Day
  const handleCycleTimeOfDay = useCallback(() => {
    const times: TimeOfDay[] = ['DAY', 'SUNSET', 'NIGHT'];
    setTimeOfDay((prev) => {
      const nextIdx = (times.indexOf(prev) + 1) % times.length;
      const nextTime = times[nextIdx];
      showBannerMessage(`Time of Day: ${nextTime} 🌄`);
      return nextTime;
    });
  }, [showBannerMessage]);

  // Toggle Procedural Pahadi Radio
  const handleToggleRadio = useCallback(() => {
    const active = soundEngine.toggleRadio();
    setIsRadioOn(active);
    showBannerMessage(
      active
        ? '📻 पहाड़ी रेडियो चालू (Pahadi Flute Melodies Playing)'
        : '📻 पहाड़ी रेडियो बंद (Radio Off)'
    );
  }, [showBannerMessage]);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMute(next);
      return next;
    });
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const activeKeys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      activeKeys[key] = true;

      // Prevent scrolling on arrow keys and space
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Enter/Exit Vehicle
      if (key === 'e' || key === 'f') {
        setControlMode((prev) => (prev === 'WALK' ? 'DRIVE' : 'WALK'));
      }

      // Camera switch
      if (key === 'c') {
        handleCycleCamera();
      }

      // Horn
      if (key === 'h') {
        soundEngine.playHorn();
      }

      // Radio
      if (key === 'r') {
        handleToggleRadio();
      }

      // Lights
      if (key === 'l') {
        showBannerMessage('Jeep Headlights Toggled 💡');
      }

      // Sound Mute
      if (key === 'm') {
        handleToggleMute();
      }

      // Update movement
      let f = 0;
      let t = 0;
      if (activeKeys['w'] || activeKeys['arrowup']) f += 1;
      if (activeKeys['s'] || activeKeys['arrowdown']) f -= 1;
      if (activeKeys['a'] || activeKeys['arrowleft']) t += 1;
      if (activeKeys['d'] || activeKeys['arrowright']) t -= 1;

      keyboardInputRef.current.forward = f;
      keyboardInputRef.current.turn = t;
      keyboardInputRef.current.sprint = !!activeKeys['shift'];
      keyboardInputRef.current.handbrake = !!activeKeys[' '];
      if (activeKeys[' ']) {
        keyboardInputRef.current.jump = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      activeKeys[key] = false;

      let f = 0;
      let t = 0;
      if (activeKeys['w'] || activeKeys['arrowup']) f += 1;
      if (activeKeys['s'] || activeKeys['arrowdown']) f -= 1;
      if (activeKeys['a'] || activeKeys['arrowleft']) t += 1;
      if (activeKeys['d'] || activeKeys['arrowright']) t -= 1;

      keyboardInputRef.current.forward = f;
      keyboardInputRef.current.turn = t;
      keyboardInputRef.current.sprint = !!activeKeys['shift'];
      keyboardInputRef.current.handbrake = !!activeKeys[' '];
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleCycleCamera, handleToggleRadio, handleToggleMute, showBannerMessage]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D WebGL Canvas */}
      <GameCanvas
        controlMode={controlMode}
        cameraMode={cameraMode}
        timeOfDay={timeOfDay}
        isRadioOn={isRadioOn}
        isMuted={isMuted}
        activeQuestId={stats.activeQuestId}
        onStatsUpdate={setStats}
        onShowMessage={showBannerMessage}
        onModeChange={setControlMode}
        onQuestCompleted={(id, reward) => {
          setStats((prev) => ({
            ...prev,
            score: prev.score + reward,
            completedQuests: prev.completedQuests + 1,
          }));
        }}
        joystickInput={joystickInput}
        keyboardInputRef={keyboardInputRef}
      />

      {/* Ergonomic HUD Layer */}
      <HUD
        controlMode={controlMode}
        cameraMode={cameraMode}
        timeOfDay={timeOfDay}
        stats={stats}
        message={message}
        isRadioOn={isRadioOn}
        isMuted={isMuted}
        lang={lang}
        onToggleDrive={handleToggleDrive}
        onJump={handleJump}
        onHorn={handleHorn}
        onToggleLights={handleToggleLights}
        onCycleCamera={handleCycleCamera}
        onCycleTimeOfDay={handleCycleTimeOfDay}
        onToggleRadio={handleToggleRadio}
        onToggleMute={handleToggleMute}
        onToggleLang={() => setLang((prev) => (prev === 'hi' ? 'en' : 'hi'))}
        onJoystickMove={(x, y) => setJoystickInput({ x, y })}
        onJoystickEnd={() => setJoystickInput({ x: 0, y: 0 })}
      />
    </div>
  );
}
