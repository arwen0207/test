import React from 'react';
import { X, Hand, MousePointer, ShieldCheck, Timer } from 'lucide-react';

interface GestureTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureTutorialModal: React.FC<GestureTutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">손 제스처 조작 방법</h3>
            <p className="text-xs text-slate-400">MediaPipe Hand Landmarker 인식 안내</p>
          </div>
        </div>

        {/* 4 Gestures Grid */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col items-center text-center">
            <div className="text-3xl mb-1.5">☝️</div>
            <div className="text-xs font-bold text-sky-400">1번 선택</div>
            <p className="text-[11px] text-slate-300 mt-0.5">검지 손가락 1개</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col items-center text-center">
            <div className="text-3xl mb-1.5">✌️</div>
            <div className="text-xs font-bold text-sky-400">2번 선택</div>
            <p className="text-[11px] text-slate-300 mt-0.5">검지와 중지 2개 (V)</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col items-center text-center">
            <div className="text-3xl mb-1.5">🤟</div>
            <div className="text-xs font-bold text-sky-400">3번 선택</div>
            <p className="text-[11px] text-slate-300 mt-0.5">검지·중지·약지 3개</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col items-center text-center">
            <div className="text-3xl mb-1.5">🖐️</div>
            <div className="text-xs font-bold text-sky-400">4번 선택</div>
            <p className="text-[11px] text-slate-300 mt-0.5">엄지를 접고 4개</p>
          </div>
        </div>

        {/* Key rules */}
        <div className="flex flex-col gap-2.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 mb-6">
          <div className="flex items-start gap-2.5">
            <Timer className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span><strong>1.5초 유지 확정</strong>: 손가락 모양을 1.5초 동안 유지하면 진행률 게이지가 채워지며 답안이 자동 확정됩니다.</span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="text-sm shrink-0">👈</span>
            <span><strong>다음 문제 넘기기 (오른쪽 ➔ 왼쪽)</strong>: 정답과 해설을 확인한 후, 손을 오른쪽에서 왼쪽으로 휙 쓸어넘기면(Swipe) 다음 문제로 넘어갑니다. 화면을 마우스나 터치로 왼쪽으로 드래그해도 동일하게 작동합니다.</span>
          </div>

          <div className="flex items-start gap-2.5">
            <MousePointer className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>마우스 클릭 병행</strong>: 제스처 인식 외에도 언제든 보기를 직접 마우스로 클릭하여 즉시 선택할 수 있습니다.</span>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>안전한 로컬 처리</strong>: 웹캠 영상은 브라우저 안에서만 분석되며 외부 서버로 절대 전송되지 않습니다.</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors cursor-pointer"
        >
          확인했습니다
        </button>
      </div>
    </div>
  );
};
