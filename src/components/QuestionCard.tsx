import React, { useRef, useState } from 'react';
import { Check, X, ArrowRight, Lightbulb, BookOpen, Sparkles, ArrowLeft } from 'lucide-react';
import { Question } from '../types/quiz';
import { sound } from '../utils/audio';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedChoice: number | null; // 1, 2, 3, 4
  confirmedChoice: number | null; // 1, 2, 3, 4
  isAnswerRevealed: boolean;
  activeGestureChoice: number | null; // 1, 2, 3, 4 currently hovered by gesture
  gestureProgress: number; // 0 to 100
  onSelectOption: (optionNumber: number) => void;
  onNextQuestion: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  selectedChoice,
  confirmedChoice,
  isAnswerRevealed,
  activeGestureChoice,
  gestureProgress,
  onSelectOption,
  onNextQuestion
}) => {
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isCorrect = confirmedChoice !== null && confirmedChoice - 1 === question.correctIndex;

  // Touch & Mouse Drag (Swipe Left) tracking
  const dragStartXRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isAnswerRevealed) return;
    dragStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isAnswerRevealed || dragStartXRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - dragStartXRef.current;
    if (diff < 0) {
      setDragOffset(Math.max(-120, diff));
    }
  };

  const handleTouchEnd = () => {
    if (!isAnswerRevealed || dragStartXRef.current === null) return;
    if (dragOffset < -60) {
      sound.playSwipe();
      onNextQuestion();
    }
    dragStartXRef.current = null;
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAnswerRevealed) return;
    dragStartXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isAnswerRevealed || dragStartXRef.current === null) return;
    const diff = e.clientX - dragStartXRef.current;
    if (diff < 0) {
      setDragOffset(Math.max(-120, diff));
    }
  };

  const handleMouseUp = () => {
    if (!isAnswerRevealed || dragStartXRef.current === null) return;
    if (dragOffset < -60) {
      sound.playSwipe();
      onNextQuestion();
    }
    dragStartXRef.current = null;
    setDragOffset(0);
  };

  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    생명과학: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    물리: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
    화학: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    지구과학: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' }
  };

  const currentCategoryStyle = categoryColors[question.category] || categoryColors['물리'];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        transform: dragOffset < 0 ? `translateX(${dragOffset * 0.3}px)` : undefined,
        transition: dragStartXRef.current === null ? 'transform 0.2s ease-out' : 'none'
      }}
      className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative select-none"
    >
      {/* Question Header Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${currentCategoryStyle.bg} ${currentCategoryStyle.text} ${currentCategoryStyle.border}`}>
            {question.category}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {question.grade} · {question.topic}
          </span>
        </div>

        <div className="text-xs text-slate-400 font-mono font-medium">
          QUESTION <span className="text-white font-bold">{String(currentIndex + 1).padStart(2, '0')}</span> / {totalQuestions}
        </div>
      </div>

      {/* Question Statement */}
      <div className="my-6">
        <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
          {question.question}
        </h2>
      </div>

      {/* 4 Multiple Choice Options */}
      <div className="flex flex-col gap-3">
        {question.options.map((optionText, idx) => {
          const optionNumber = idx + 1;
          const isThisCorrect = idx === question.correctIndex;
          const isUserSelection = confirmedChoice === optionNumber || selectedChoice === optionNumber;
          const isGestureHovered = activeGestureChoice === optionNumber && !isAnswerRevealed;

          let buttonStyle = 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600';
          let badgeStyle = 'bg-slate-700 text-slate-300';

          if (isAnswerRevealed) {
            if (isThisCorrect) {
              buttonStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50';
              badgeStyle = 'bg-emerald-500 text-slate-950 font-bold';
            } else if (isUserSelection && !isThisCorrect) {
              buttonStyle = 'bg-rose-950/40 border-rose-500/80 text-rose-200 line-through opacity-80';
              badgeStyle = 'bg-rose-500 text-white font-bold';
            } else {
              buttonStyle = 'bg-slate-850/40 border-slate-800 text-slate-400 opacity-60';
              badgeStyle = 'bg-slate-800 text-slate-500';
            }
          } else {
            if (isGestureHovered) {
              buttonStyle = 'bg-sky-950/40 border-sky-400 text-sky-100 shadow-md ring-2 ring-sky-500/40';
              badgeStyle = 'bg-sky-500 text-slate-950 font-bold';
            } else if (isUserSelection) {
              buttonStyle = 'bg-indigo-950/40 border-indigo-500 text-indigo-100 ring-1 ring-indigo-500/50';
              badgeStyle = 'bg-indigo-500 text-white font-bold';
            }
          }

          return (
            <button
              key={idx}
              disabled={isAnswerRevealed}
              onClick={() => onSelectOption(optionNumber)}
              className={`relative overflow-hidden w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer group ${buttonStyle}`}
            >
              {/* Active Gesture 1.5s Progress Fill */}
              {isGestureHovered && gestureProgress > 0 && (
                <div
                  className="absolute left-0 top-0 bottom-0 bg-sky-500/20 border-r-2 border-sky-400 transition-all duration-75 pointer-events-none"
                  style={{ width: `${gestureProgress}%` }}
                />
              )}

              <div className="flex items-center gap-3.5 z-10">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${badgeStyle}`}>
                  {optionNumber}
                </span>
                <span className="text-sm sm:text-base font-medium leading-snug">
                  {optionText}
                </span>
              </div>

              {/* Status Icons */}
              <div className="z-10 shrink-0">
                {isAnswerRevealed ? (
                  isThisCorrect ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span className="hidden sm:inline">정답</span>
                    </div>
                  ) : isUserSelection ? (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                      <X className="w-5 h-5 text-rose-400" />
                      <span className="hidden sm:inline">오답</span>
                    </div>
                  ) : null
                ) : isGestureHovered && gestureProgress > 0 ? (
                  <span className="text-xs font-mono font-bold text-sky-400 tabular-nums">
                    {gestureProgress}%
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Answer & Scientific Explanation Card */}
      {isAnswerRevealed && (
        <div className="mt-6 pt-6 border-t border-slate-800 animate-in fade-in duration-300">
          {/* Result Alert Banner */}
          <div className={`p-4 rounded-xl border mb-5 flex items-start gap-3.5 ${
            isCorrect
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}>
            <div className={`p-2 rounded-lg shrink-0 ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isCorrect ? <Sparkles className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-base font-bold flex items-center gap-2">
                <span>{isCorrect ? '정답입니다! (+10점)' : `아쉽네요! 정답은 ${question.correctIndex + 1}번입니다.`}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {question.keyConcept}
              </p>
            </div>
          </div>

          {/* Detailed Scientific Reasoning */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>상세 과학 해설</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {question.explanation}
            </p>
          </div>

          {/* Right-to-Left Swipe Navigation Banner & Action Row */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-indigo-200">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-sky-400">
                <ArrowLeft className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <strong className="text-white block font-semibold">오른쪽 ➔ 왼쪽으로 쓸어넘겨 다음 문제</strong>
                <span className="text-slate-400 text-[11px]">카메라 앞에서 손을 오른쪽에서 왼쪽으로 휙 젓거나 화면을 왼쪽으로 스와이프하세요</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 font-mono text-xs text-sky-400 shrink-0">
              <span>👉</span>
              <span>────➔</span>
              <span>👈</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400 hidden sm:inline">
              화면을 왼쪽으로 드래그하거나 버튼을 클릭해도 넘어갑니다
            </span>

            <button
              onClick={onNextQuestion}
              className="w-full sm:w-auto ml-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-98"
            >
              <span>{isLastQuestion ? '최종 결과 확인하기' : '다음 문제'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
