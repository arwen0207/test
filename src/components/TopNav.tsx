import React from 'react';
import { Volume2, VolumeX, Hand, MousePointer, Info, ShieldCheck } from 'lucide-react';
import { InputMode } from '../types/quiz';

interface TopNavProps {
  currentMode: InputMode;
  onToggleMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenTutorial: () => void;
  onOpenPrivacy: () => void;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentScore: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentMode,
  onToggleMode,
  isMuted,
  onToggleMute,
  onOpenTutorial,
  onOpenPrivacy,
  currentQuestionIndex,
  totalQuestions,
  currentScore
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
            ⚡
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              중학교 과학 손 제스처 퀴즈
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block whitespace-nowrap">
              MediaPipe On-Device Hand Landmarker
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Metric Zone */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
          <div className="hidden lg:flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-slate-400">진행도:</span>
            <span className="text-indigo-400 font-semibold tabular-nums">
              {currentQuestionIndex + 1} / {totalQuestions}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">현재 점수:</span>
            <span className="text-emerald-400 font-semibold tabular-nums">
              {currentScore}점
            </span>
          </div>

          <button
            onClick={onOpenTutorial}
            className="hidden sm:inline-flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap text-slate-400 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>제스처 안내</span>
          </button>

          <button
            onClick={onOpenPrivacy}
            className="hidden md:inline-flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap text-slate-400 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>서버 미전송 원칙</span>
          </button>
        </div>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleMute}
            title={isMuted ? '음소거 해제' : '음소거'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            aria-label="Sound Toggle"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onToggleMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              currentMode === 'gesture'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 hover:bg-indigo-600/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {currentMode === 'gesture' ? (
              <>
                <Hand className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="whitespace-nowrap">손 제스처 모드</span>
              </>
            ) : (
              <>
                <MousePointer className="w-3.5 h-3.5 text-amber-400" />
                <span className="whitespace-nowrap">마우스 모드</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
