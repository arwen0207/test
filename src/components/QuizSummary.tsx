import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, CheckCircle2, XCircle, ChevronDown, ChevronUp, Hand, MousePointer, BookOpen } from 'lucide-react';
import { Question, UserAnswerRecord } from '../types/quiz';
import { sound } from '../utils/audio';

interface QuizSummaryProps {
  questions: Question[];
  userAnswers: UserAnswerRecord[];
  onRestart: () => void;
  onRetryIncorrect?: (incorrectIds: number[]) => void;
}

export const QuizSummary: React.FC<QuizSummaryProps> = ({
  questions,
  userAnswers,
  onRestart,
  onRetryIncorrect
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const totalQuestions = questions.length;
  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const totalScore = correctCount * 10;
  const gestureCount = userAnswers.filter(a => a.method === 'gesture').length;
  const mouseCount = userAnswers.filter(a => a.method === 'mouse').length;
  const incorrectIds = userAnswers.filter(a => !a.isCorrect).map(a => a.questionId);

  useEffect(() => {
    sound.playFanfare();
    if (totalScore >= 70) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [totalScore]);

  const getGradeInfo = (score: number) => {
    if (score >= 90) {
      return {
        title: '과학 마스터 등급 🏆',
        desc: '중학교 과학의 핵심 개념을 완벽하게 이해하고 있습니다! 훌륭합니다.',
        color: 'text-emerald-400'
      };
    }
    if (score >= 70) {
      return {
        title: '과학 탐구 우등생 등급 🔬',
        desc: '전반적인 과학 개념이 매우 우수합니다. 오답 해설을 통해 100점에 도전해보세요!',
        color: 'text-indigo-400'
      };
    }
    if (score >= 50) {
      return {
        title: '개념 완성 도전 등급 🔭',
        desc: '기초적인 개념을 잘 알고 계십니다. 헷갈렸던 보기를 해설과 함께 복습해보세요.',
        color: 'text-amber-400'
      };
    }
    return {
      title: '개념 재도전 등급 💡',
      desc: '틀린 문제의 해설을 차근차근 읽어보고 다시 한번 도전해보세요!',
      color: 'text-rose-400'
    };
  };

  const grade = getGradeInfo(totalScore);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Score Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          과학 퀴즈 최종 결과
        </h2>
        <div className={`text-sm sm:text-base font-semibold ${grade.color} mb-4`}>
          {grade.title}
        </div>

        <div className="flex items-baseline justify-center gap-2 my-4">
          <span className="text-5xl sm:text-6xl font-black text-white tracking-tight tabular-nums">
            {totalScore}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-500">
            / 100점
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-6">
          {grade.desc}
        </p>

        {/* 4 KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-6 border-t border-slate-800 text-left">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <span className="text-[11px] text-slate-400">정답 수</span>
            <div className="text-lg font-bold text-emerald-400 tabular-nums">
              {correctCount} / {totalQuestions}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <span className="text-[11px] text-slate-400">정답률</span>
            <div className="text-lg font-bold text-white tabular-nums">
              {Math.round((correctCount / totalQuestions) * 100)}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <span className="text-[11px] text-slate-400">손 제스처 풀이</span>
            <div className="text-lg font-bold text-indigo-400 flex items-center gap-1.5 tabular-nums">
              <Hand className="w-4 h-4 text-indigo-400" />
              <span>{gestureCount}개</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <span className="text-[11px] text-slate-400">마우스 클릭</span>
            <div className="text-lg font-bold text-amber-400 flex items-center gap-1.5 tabular-nums">
              <MousePointer className="w-4 h-4 text-amber-400" />
              <span>{mouseCount}개</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>처음부터 다시 풀기</span>
          </button>

          {incorrectIds.length > 0 && onRetryIncorrect && (
            <button
              onClick={() => onRetryIncorrect(incorrectIds)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
            >
              <span>틀린 {incorrectIds.length}문제만 다시 풀기</span>
            </button>
          )}
        </div>
      </div>

      {/* 10-Question Review Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">문제별 정답 및 상세 해설</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              각 문제를 클릭하면 내가 선택한 답과 정답, 상세한 과학 해설을 볼 수 있습니다.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {questions.map((q, idx) => {
            const answerRecord = userAnswers.find(a => a.questionId === q.id);
            const isCorrect = answerRecord?.isCorrect ?? false;
            const userChoice = answerRecord ? answerRecord.selectedOption + 1 : null;
            const correctChoice = q.correctIndex + 1;
            const isExpanded = expandedId === q.id;

            return (
              <div
                key={q.id}
                className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-850/50 transition-colors hover:border-slate-700"
              >
                <button
                  onClick={() => toggleExpand(q.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                        <span className="font-mono font-semibold text-slate-300">Q{idx + 1}</span>
                        <span>·</span>
                        <span>{q.category}</span>
                        <span>·</span>
                        <span>{q.topic}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-200 line-clamp-2">
                        {q.question}
                      </p>
                      <div className="flex items-center gap-3 text-xs mt-2 text-slate-400">
                        <span>내 선택: <strong className={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>{userChoice}번</strong></span>
                        <span>정답: <strong className="text-emerald-400">{correctChoice}번</strong></span>
                        {answerRecord && (
                          <span className="text-[11px] text-slate-500">
                            ({answerRecord.method === 'gesture' ? '손 제스처' : '마우스 클릭'})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-slate-400 p-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-900/60 text-xs sm:text-sm">
                    {/* Options list */}
                    <div className="grid grid-cols-1 gap-1.5 my-3">
                      {q.options.map((opt, optIdx) => {
                        const optNum = optIdx + 1;
                        const isOptCorrect = optIdx === q.correctIndex;
                        const isOptUser = userChoice === optNum;

                        let style = 'bg-slate-800/40 text-slate-400 border-slate-800';
                        if (isOptCorrect) {
                          style = 'bg-emerald-950/40 text-emerald-200 border-emerald-500/50 font-semibold';
                        } else if (isOptUser && !isOptCorrect) {
                          style = 'bg-rose-950/40 text-rose-300 border-rose-500/50 line-through';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${style}`}
                          >
                            <span>{optNum}. {opt}</span>
                            {isOptCorrect && <span className="text-emerald-400 font-bold">정답</span>}
                            {isOptUser && !isOptCorrect && <span className="text-rose-400">내 선택</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Scientific Explanation */}
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 mt-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 mb-1.5">
                        <BookOpen className="w-4 h-4" />
                        <span>핵심 개념 및 해설</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 mb-1">
                        {q.keyConcept}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
