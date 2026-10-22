import React, { useEffect, useState } from 'react';
import { sfx } from '../../utils/soundEffects.ts';

interface AnimatedIntroScreenProps {
  onFinish: () => void;
}

export const AnimatedIntroScreen: React.FC<AnimatedIntroScreenProps> = ({ onFinish }) => {
  const [stage, setStage] = useState<'start' | 'flying' | 'looping' | 'center' | 'fadeout'>('start');

  useEffect(() => {
    // Play the custom intro sound effect
    sfx.playIntro();

    // Keyframe sequence timed with intro SFX
    const timer1 = setTimeout(() => setStage('flying'), 150);
    const timer2 = setTimeout(() => setStage('looping'), 1100);
    const timer3 = setTimeout(() => setStage('center'), 2200);
    const timer4 = setTimeout(() => setStage('fadeout'), 3600);
    const timer5 = setTimeout(() => onFinish(), 4200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-opacity duration-700 select-none ${
      stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}
    style={{
      // Pulsing warm sunset gradient background as requested
      animation: 'pulsingWarmSunset 4s ease-in-out infinite alternate',
      background: 'linear-gradient(135deg, #F97316 0%, #FB923C 30%, #F59E0B 70%, #EA580C 100%)'
    }}
    >
      <style>{`
        @keyframes pulsingWarmSunset {
          0% {
            filter: brightness(1) contrast(1.05);
          }
          50% {
            filter: brightness(1.22) contrast(1.15) saturate(1.1);
          }
          100% {
            filter: brightness(0.92) contrast(1.02);
          }
        }

        @keyframes swoopInAndOrbit {
          0% {
            transform: translate(-45vw, -45vh) scale(0.3) rotate(-90deg);
            opacity: 0;
          }
          25% {
            transform: translate(35vw, -30vh) scale(0.65) rotate(45deg);
            opacity: 1;
          }
          50% {
            transform: translate(0vw, 25vh) scale(0.85) rotate(220deg);
          }
          75% {
            transform: translate(-20vw, -10vh) scale(1) rotate(340deg);
          }
          100% {
            transform: translate(0, 0) scale(1.15) rotate(360deg);
          }
        }

        @keyframes energeticWobble {
          0%, 100% { transform: scale(1.1) rotate(0deg); }
          25% { transform: scale(1.14) rotate(-3deg); }
          75% { transform: scale(1.14) rotate(3deg); }
        }
      `}</style>

      {/* Decorative stars / doodle dust */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/5 text-amber-200 text-3xl animate-bounce">✦</div>
        <div className="absolute top-1/3 right-1/4 text-amber-100 text-2xl animate-pulse">★</div>
        <div className="absolute bottom-1/4 left-1/3 text-orange-200 text-4xl animate-bounce">✦</div>
        <div className="absolute bottom-1/3 right-1/5 text-yellow-100 text-2xl animate-pulse">★</div>
      </div>

      {/* Animated Logo Container */}
      <div className="relative flex flex-col items-center justify-center p-6 text-center">
        <div
          className="relative transition-all duration-700 ease-out"
          style={{
            animation: stage === 'center' || stage === 'fadeout'
              ? 'energeticWobble 1.5s ease-in-out infinite'
              : 'swoopInAndOrbit 2.4s cubic-bezier(0.25, 1, 0.5, 1) forwards'
          }}
        >
          {/* Logo Card with Doodle 3D shadow */}
          <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-3xl bg-white/95 p-4 border-4 border-slate-900 shadow-[8px_8px_0px_#1E293B] flex items-center justify-center backdrop-blur-xs">
            <img
              src="/logo/Kelas_Gueh_Logo_Static.svg"
              alt="Kelas Gueh Logo"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>
        </div>

        {/* Brand Text Reveal */}
        <div className={`mt-8 transition-all duration-500 transform ${
          stage === 'center' || stage === 'fadeout' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
        }`}>
          <div className="inline-block bg-white border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] px-6 py-2 rounded-xl">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              KELAS GUE!
            </h1>
            <p className="text-xs sm:text-sm font-bold text-amber-900 uppercase tracking-widest mt-0.5">
              Transparansi Kas Kelas Tanpa Drama
            </p>
          </div>
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={() => {
          sfx.playClick();
          onFinish();
        }}
        className="absolute bottom-6 right-6 btn-doodle px-4 py-1.5 bg-white/90 hover:bg-white text-slate-900 text-xs font-black rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]"
      >
        Lewati Intro →
      </button>
    </div>
  );
};
