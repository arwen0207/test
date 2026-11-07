import React from 'react';
import { X, ShieldCheck, Lock, Cpu, Globe } from 'lucide-react';

interface PrivacyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyInfoModal: React.FC<PrivacyInfoModalProps> = ({ isOpen, onClose }) => {
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
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">영상 데이터 외부 서버 미전송 안내</h3>
            <p className="text-xs text-slate-400">On-Device Edge AI 실시간 보안 정책</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 my-5 text-xs sm:text-sm text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">100% 브라우저 로컬 연산</strong>
              <span>웹캠으로부터 수신된 비디오 프레임은 사용자의 웹 브라우저 메모리 안에서만 MediaPipe WebAssembly(WASM) 및 WebGL 가속을 통해 처리됩니다.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
            <Globe className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">외부 네트워크 전송 제로</strong>
              <span>카메라 영상, 사진 캡처본 또는 사용자의 생체 정보는 어떠한 외부 서버, 클라우드, 데이터베이스로도 전송되거나 저장되지 않습니다.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">즉시 휘발성 프레임 분석</strong>
              <span>손가락 관절 랜드마크 분석이 완료된 프레임은 즉시 메모리에서 폐기되며, 사용자가 브라우저를 닫거나 카메라를 끄는 즉시 모든 스트림이 완전 종료됩니다.</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors cursor-pointer"
        >
          안심하고 사용하기
        </button>
      </div>
    </div>
  );
};
