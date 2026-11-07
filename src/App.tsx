import React, { useState, useEffect, useRef } from 'react';
import { TopNav } from './components/TopNav';
import { CameraHandTracker } from './components/CameraHandTracker';
import { QuestionCard } from './components/QuestionCard';
import { QuizSummary } from './components/QuizSummary';
import { GestureTutorialModal } from './components/GestureTutorialModal';
import { PrivacyInfoModal } from './components/PrivacyInfoModal';
import { SCIENCE_QUESTIONS } from './data/scienceQuestions';
import { Question, UserAnswerRecord, InputMode } from './types/quiz';
import { sound } from './utils/audio';
import { Sparkles, Atom, ShieldCheck, HelpCircle } from 'lucide-react';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>(SCIENCE_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswerRecord[]>([]);

  // Selection states
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [confirmedChoice, setConfirmedChoice] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Gesture hover states
  const [activeGestureChoice, setActiveGestureChoice] = useState<number | null>(null);
  const [gestureProgress, setGestureProgress] = useState<number>(0);

  // Mode and Modals
  const [inputMode, setInputMode] = useState<InputMode>('gesture');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);

  // Question timer
  const questionStartTimeRef = useRef<number>(Date.now());

  const currentQuestion = questions[currentIndex] || questions[0];
  const currentScore = userAnswers.filter(a => a.isCorrect).length * 10;

  // Reset timer on index change
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    setSelectedChoice(null);
    setConfirmedChoice(null);
    setIsAnswerRevealed(false);
    setActiveGestureChoice(null);
    setGestureProgress(0);
  }, [currentIndex]);

  // Handle gesture option hover (1..4)
  const handleGestureSelect = (choice: number) => {
    if (isAnswerRevealed) return;
    setActiveGestureChoice(choice);
  };

  // Handle choice confirmation (from 1.5s gesture hold or mouse click)
  const handleConfirmChoice = (choice: number, method: 'gesture' | 'mouse') => {
    if (isAnswerRevealed) return;

    const timeSpentSec = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    const isCorrect = choice - 1 === currentQuestion.correctIndex;

    setSelectedChoice(choice);
    setConfirmedChoice(choice);
    setIsAnswerRevealed(true);

    if (isCorrect) {
      sound.playCorrect();
    } else {
      sound.playIncorrect();
    }

    const newRecord: UserAnswerRecord = {
      questionId: currentQuestion.id,
      selectedOption: choice - 1,
      isCorrect,
      method,
      timeSpentSec
    };

    setUserAnswers(prev => [...prev.filter(a => a.questionId !== currentQuestion.id), newRecord]);
  };

  // Move to next question or final result
  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Restart Quiz
  const handleRestart = () => {
    setQuestions(SCIENCE_QUESTIONS);
    setCurrentIndex(0);
    setUserAnswers([]);
    setSelectedChoice(null);
    setConfirmedChoice(null);
    setIsAnswerRevealed(false);
    setIsCompleted(false);
  };

  // Retry missed questions
  const handleRetryIncorrect = (incorrectIds: number[]) => {
    const missed = SCIENCE_QUESTIONS.filter(q => incorrectIds.includes(q.id));
    if (missed.length > 0) {
      setQuestions(missed);
      setCurrentIndex(0);
      setUserAnswers([]);
      setSelectedChoice(null);
      setConfirmedChoice(null);
      setIsAnswerRevealed(false);
      setIsCompleted(false);
    }
  };

  const toggleMode = () => {
    setInputMode(prev => (prev === 'gesture' ? 'mouse' : 'gesture'));
  };

  const toggleMute = () => {
    const nextMuted = sound.toggleMuted();
    setIsMuted(nextMuted);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Contract (1-line Brand, Links, Primary Action) */}
      <TopNav
        currentMode={inputMode}
        onToggleMode={toggleMode}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        currentQuestionIndex={currentIndex}
        totalQuestions={questions.length}
        currentScore={currentScore}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col">
        {isCompleted ? (
          <QuizSummary
            questions={questions}
            userAnswers={userAnswers}
            onRestart={handleRestart}
            onRetryIncorrect={handleRetryIncorrect}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Interactive Stage & Deck: Two-Zone Educational Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Zone: Camera & Hand Landmarker Stage (5 cols on lg) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <CameraHandTracker
                  isEnabled={inputMode === 'gesture'}
                  onChoiceSelect={handleGestureSelect}
                  onChoiceConfirm={(choice) => handleConfirmChoice(choice, 'gesture')}
                  onNextTrigger={handleNextQuestion}
                  isAnswerRevealed={isAnswerRevealed}
                  onSwitchToMouse={() => setInputMode('mouse')}
                />

                {/* Quick Info Callout */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-300">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <Atom className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">손 제스처 조작 팁</strong>
                    <p className="text-slate-400 leading-relaxed">
                      • <strong>문제 풀이</strong>: 손가락 1~4개를 펴고 1.5초간 유지 시 답안 확정<br />
                      • <strong>다음 문제</strong>: 해설 확인 후 손을 <span className="text-sky-300 font-semibold">오른쪽(👉)에서 왼쪽(👈)</span>으로 휙 쓸어넘기면 이동 (마우스 스와이프 / 클릭 가능)
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Zone: Question Deck & Explanation (7 cols on lg) */}
              <div className="lg:col-span-7">
                <QuestionCard
                  question={currentQuestion}
                  currentIndex={currentIndex}
                  totalQuestions={questions.length}
                  selectedChoice={selectedChoice}
                  confirmedChoice={confirmedChoice}
                  isAnswerRevealed={isAnswerRevealed}
                  activeGestureChoice={activeGestureChoice}
                  gestureProgress={gestureProgress}
                  onSelectOption={(optionNumber) => handleConfirmChoice(optionNumber, 'mouse')}
                  onNextQuestion={handleNextQuestion}
                />
              </div>
            </div>

            {/* Bottom Proof & Privacy Strip */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-bold">2026 중학교 교육과정</span>
                <span>·</span>
                <span>물리 · 화학 · 생명과학 · 지구과학 종합 10문항</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPrivacyOpen(true)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-emerald-400/90"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>On-Device 브라우저 프라이버시 보장</span>
                </button>
                <button
                  onClick={() => setIsTutorialOpen(true)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>제스처 가이드</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <GestureTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      <PrivacyInfoModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
