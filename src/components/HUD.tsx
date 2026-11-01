import React, { useState } from 'react';
import {
  Compass,
  Volume2,
  VolumeX,
  Radio,
  Sun,
  Sunset,
  Moon,
  Camera,
  Car,
  User,
  Zap,
  Award,
  ChevronDown,
  ChevronUp,
  MapPin,
  HelpCircle,
  X,
  Volume1,
} from 'lucide-react';
import { ControlMode, CameraMode, TimeOfDay, GameStats, Landmark } from '../game/types';
import { WORLD_LANDMARKS } from '../game/world';

interface HUDProps {
  controlMode: ControlMode;
  cameraMode: CameraMode;
  timeOfDay: TimeOfDay;
  stats: GameStats;
  message: string | null;
  isRadioOn: boolean;
  isMuted: boolean;
  lang: 'hi' | 'en';
  onToggleDrive: () => void;
  onJump: () => void;
  onHorn: () => void;
  onToggleLights: () => void;
  onCycleCamera: () => void;
  onCycleTimeOfDay: () => void;
  onToggleRadio: () => void;
  onToggleMute: () => void;
  onToggleLang: () => void;
  // Virtual joystick callbacks for touch devices
  onJoystickMove: (x: number, y: number) => void;
  onJoystickEnd: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  controlMode,
  cameraMode,
  timeOfDay,
  stats,
  message,
  isRadioOn,
  isMuted,
  lang,
  onToggleDrive,
  onJump,
  onHorn,
  onToggleLights,
  onCycleCamera,
  onCycleTimeOfDay,
  onToggleRadio,
  onToggleMute,
  onToggleLang,
  onJoystickMove,
  onJoystickEnd,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Virtual Joystick pointer tracking
  const [joystickActive, setJoystickActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setJoystickActive(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!joystickActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const maxRadius = rect.width * 0.35;
    const dist = Math.hypot(deltaX, deltaY);

    let normX = deltaX / maxRadius;
    let normY = deltaY / maxRadius;

    if (dist > maxRadius) {
      normX = (deltaX / dist);
      normY = (deltaY / dist);
    }

    setKnobPos({
      x: normX * maxRadius,
      y: normY * maxRadius,
    });

    onJoystickMove(normX, normY);
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    setKnobPos({ x: 0, y: 0 });
    onJoystickEnd();
  };

  const t = {
    title: lang === 'hi' ? 'MR BAAZ 3D • देवभूमि उत्तराखंड' : 'MR BAAZ 3D • UTTARAKHAND OPEN WORLD',
    subtitle: lang === 'hi' ? 'पहाड़ी ओपन वर्ल्ड गेम' : 'Himalayan Open World Exploration',
    driveBtn: controlMode === 'DRIVE' ? (lang === 'hi' ? 'बाहर निकलो' : 'EXIT JEEP') : (lang === 'hi' ? 'गाड़ी चलाओ' : 'DRIVE JEEP'),
    jumpBtn: lang === 'hi' ? 'कूद (JUMP)' : 'JUMP',
    hornBtn: lang === 'hi' ? 'हॉर्न (HORN)' : 'HORN',
    cameraBtn: lang === 'hi' ? `कैमरा: ${cameraMode}` : `CAM: ${cameraMode}`,
    radioBtn: isRadioOn ? (lang === 'hi' ? 'रेडियो चालू 🎶' : 'RADIO ON 🎶') : (lang === 'hi' ? 'पहाड़ी धुन 📻' : 'PAHADI TUNE 📻'),
    lightsBtn: lang === 'hi' ? 'हेडलाइट्स' : 'LIGHTS',
    timeBtn: timeOfDay === 'DAY' ? 'DAY ☀️' : timeOfDay === 'SUNSET' ? 'SUNSET 🌅' : 'NIGHT 🌙',
    speed: lang === 'hi' ? 'गति' : 'Speed',
    points: lang === 'hi' ? 'अंक' : 'Score',
    distance: lang === 'hi' ? 'दूरी' : 'Distance',
    collapse: lang === 'hi' ? 'कंट्रोल्स छुपाएं' : 'Hide Controls',
    expand: lang === 'hi' ? 'कंट्रोल्स दिखाएं' : 'Show Controls',
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between select-none">
      {/* Top Header Bar */}
      <div className="p-3 sm:p-4 flex items-start justify-between w-full pointer-events-auto">
        {/* Left: Brand Badge */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-2.5 sm:p-3 text-white shadow-xl max-w-xs sm:max-w-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏔️</span>
            <div>
              <h1 className="text-xs sm:text-sm font-extrabold tracking-wider text-emerald-400 uppercase">
                {t.title}
              </h1>
              <p className="text-[10px] text-slate-300 font-medium">
                {t.subtitle} • <span className="text-amber-400 font-semibold">{controlMode} MODE</span>
              </p>
            </div>
          </div>
        </div>

        {/* Center: Interactive Announcement Message */}
        {message && (
          <div className="absolute left-1/2 top-4 -translate-x-1/2 bg-slate-950/95 border-2 border-amber-400/80 text-amber-200 px-4 py-2 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold text-center tracking-wide animate-in fade-in zoom-in duration-150">
            {message}
          </div>
        )}

        {/* Right: Stats, Speedometer & Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Speedometer & Score Badge */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 sm:p-2.5 text-white shadow-xl flex items-center gap-3 text-right">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">{t.speed}</div>
              <div className="text-base sm:text-lg font-black text-emerald-400 tabular-nums">
                {stats.speedKmh} <span className="text-[10px] font-normal text-slate-300">km/h</span>
              </div>
            </div>
            <div className="w-px h-7 bg-slate-700" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">{t.points}</div>
              <div className="text-base sm:text-lg font-black text-amber-400 tabular-nums">
                {stats.score}
              </div>
            </div>
          </div>

          {/* Quick Utility Icon Buttons */}
          <button
            onClick={() => setShowMap(!showMap)}
            className="p-2 sm:p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-white shadow-lg transition active:scale-95"
            title="Pahadi Map & Landmarks"
          >
            <Compass className="w-5 h-5 text-emerald-400" />
          </button>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="p-2 sm:p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-white shadow-lg transition active:scale-95"
            title="Controls & Instructions"
          >
            <HelpCircle className="w-5 h-5 text-amber-400" />
          </button>
          <button
            onClick={onToggleMute}
            className="p-2 sm:p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-white shadow-lg transition active:scale-95"
            title="Sound Mute"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
          </button>
          <button
            onClick={onToggleLang}
            className="px-2.5 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 shadow-lg transition active:scale-95"
          >
            {lang === 'hi' ? 'EN' : 'हिन्दी'}
          </button>
        </div>
      </div>

      {/* Guide & Controls Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 text-white shadow-2xl relative">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏔️</span>
              <h2 className="text-base font-bold text-emerald-400">
                {lang === 'hi' ? 'गेम कैसे खेलें (Controls & Guide)' : 'How to Play MR BAAZ 3D'}
              </h2>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed max-h-80 overflow-y-auto pr-1">
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-amber-400">🕹️ PC Controls:</span>
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li><kbd className="px-1 py-0.5 bg-slate-700 rounded">W A S D</kbd> or <kbd className="px-1 py-0.5 bg-slate-700 rounded">Arrow Keys</kbd>: Move / Steer</li>
                  <li><kbd className="px-1 py-0.5 bg-slate-700 rounded">Space</kbd>: Jump (Walk mode) / Handbrake (Jeep)</li>
                  <li><kbd className="px-1 py-0.5 bg-slate-700 rounded">E</kbd> or <kbd className="px-1 py-0.5 bg-slate-700 rounded">F</kbd>: Enter / Exit 4x4 Jeep</li>
                  <li><kbd className="px-1 py-0.5 bg-slate-700 rounded">H</kbd>: Car Horn (Peep-Peep)</li>
                  <li><kbd className="px-1 py-0.5 bg-slate-700 rounded">C</kbd>: Switch Camera (Follow / Wide / Close / Hood)</li>
                  <li><kbd className="px-1 py-0.5 bg-slate-700 rounded">L</kbd>: Headlights toggle</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-emerald-400">📱 Mobile Touch:</span>
                <p className="mt-1">
                  Use the virtual joystick on the left to walk & steer! Tap the right action buttons to Jump, Drive Jeep, Horn, or Switch views.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-amber-400">✨ Open World Activities:</span>
                <p className="mt-1">
                  • 🛕 Visit the high Summit Mandir and ring the sacred brass bell for blessings!<br />
                  • ☕ Stop by the Chai Tapri for hot tea delivery missions.<br />
                  • 🌉 Cross the thrilling suspension rope bridge over the river gorge.<br />
                  • 📻 Turn on the Pahadi Radio to hear authentic Himalayan flute tunes.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg"
            >
              {lang === 'hi' ? 'समझ गया (Start Exploring)' : 'Got it! Explore Now'}
            </button>
          </div>
        </div>
      )}

      {/* Landmarks Radar Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 text-white shadow-2xl relative">
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-emerald-400">
                {lang === 'hi' ? 'देवभूमि उत्तराखंड के मुख्य स्थल' : 'Uttarakhand Landmarks Guide'}
              </h2>
            </div>
            <div className="space-y-2 text-xs">
              {WORLD_LANDMARKS.map((lm) => (
                <div
                  key={lm.id}
                  className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">
                      {lm.type === 'temple' ? '🛕' : lm.type === 'chai' ? '☕' : lm.type === 'bridge' ? '🌉' : lm.type === 'viewpoint' ? '🔭' : '🏡'}
                    </span>
                    <div>
                      <div className="font-bold text-white">
                        {lang === 'hi' ? lm.nameHi : lm.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Coords: ({lm.pos[0]}, {lm.pos[2]})
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {lm.type.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Middle touch area - Joystick & Action Buttons for Mobile */}
      <div className="flex-1 relative flex items-end justify-between p-4 sm:p-6 pointer-events-none">
        {/* Left: Virtual Touch Joystick */}
        <div
          onPointerDown={handleTouchStart}
          onPointerMove={handleTouchMove}
          onPointerUp={handleTouchEnd}
          onPointerCancel={handleTouchEnd}
          className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-slate-950/70 border-2 border-emerald-500/40 shadow-2xl pointer-events-auto touch-none flex items-center justify-center cursor-pointer select-none"
        >
          <div className="w-12 h-12 rounded-full border border-dashed border-emerald-500/40 pointer-events-none absolute" />
          <div
            style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-400 shadow-xl border-2 border-white pointer-events-none transition-transform duration-75 flex items-center justify-center text-slate-900 font-bold text-xs"
          >
            🕹️
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex flex-col items-end gap-2.5 pointer-events-auto">
          {/* Main Enter/Exit Drive Button */}
          <button
            onClick={onToggleDrive}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm tracking-wider uppercase shadow-2xl transition active:scale-95 flex items-center gap-2 border ${
              controlMode === 'DRIVE'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300'
            }`}
          >
            {controlMode === 'DRIVE' ? <User className="w-4 h-4" /> : <Car className="w-4 h-4" />}
            {t.driveBtn}
          </button>

          {/* Jump Button (Walk mode) / Handbrake (Drive mode) */}
          <button
            onClick={onJump}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-600 text-white font-black text-xs shadow-xl transition active:scale-90 flex flex-col items-center justify-center gap-0.5"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[10px]">{controlMode === 'DRIVE' ? 'BRAKE' : 'JUMP'}</span>
          </button>

          {/* Car Horn Button */}
          {controlMode === 'DRIVE' && (
            <button
              onClick={onHorn}
              className="w-12 h-12 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-600 text-white font-bold text-xs shadow-xl transition active:scale-90 flex flex-col items-center justify-center"
            >
              <span className="text-sm">📢</span>
              <span className="text-[9px] text-amber-300">HORN</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Sleek Consolidated Control Dock (Zero Viewport Occlusion) */}
      <div className="w-full flex flex-col items-center pb-2 sm:pb-3 pointer-events-auto">
        {/* Collapse / Expand Toggle Tab */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1 px-3 py-1 bg-slate-900/90 border border-slate-700 rounded-t-xl text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 shadow-md transition active:scale-95"
        >
          {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {isDockCollapsed ? t.expand : t.collapse}
        </button>

        {/* Horizontal Dock Body */}
        {!isDockCollapsed && (
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2 sm:p-2.5 max-w-[94vw] w-auto shadow-2xl flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {/* Camera View Switcher */}
            <button
              onClick={onCycleCamera}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.cameraBtn}</span>
            </button>

            {/* Time of Day Cycle (Day / Sunset / Night) */}
            <button
              onClick={onCycleTimeOfDay}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition active:scale-95"
            >
              {timeOfDay === 'DAY' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : timeOfDay === 'SUNSET' ? (
                <Sunset className="w-3.5 h-3.5 text-orange-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>{t.timeBtn}</span>
            </button>

            {/* Headlights Toggle */}
            <button
              onClick={onToggleLights}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition active:scale-95"
            >
              <span className="text-xs">💡</span>
              <span>{t.lightsBtn}</span>
            </button>

            {/* Pahadi Radio */}
            <button
              onClick={onToggleRadio}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition active:scale-95 ${
                isRadioOn
                  ? 'bg-emerald-600 border-emerald-400 text-white font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.radioBtn}</span>
            </button>

            {/* Quests Overview */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {stats.completedQuests}/{stats.totalQuests} {lang === 'hi' ? 'मिशन पूरे' : 'Missions'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
