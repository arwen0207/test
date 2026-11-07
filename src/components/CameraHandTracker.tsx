import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { CameraOff, RefreshCw, AlertCircle, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react';
import { analyzeHandFingers, drawHandSkeleton, NormalizedLandmark } from '../utils/fingerDetection';
import { sound } from '../utils/audio';

interface CameraHandTrackerProps {
  isEnabled: boolean;
  onChoiceSelect: (choice: number) => void;
  onChoiceConfirm: (choice: number) => void;
  onNextTrigger?: () => void;
  isAnswerRevealed: boolean;
  onSwitchToMouse: () => void;
}

interface HandHistoryPoint {
  x: number; // 0 to 1 (screen space, where 0 is left, 1 is right)
  y: number;
  time: number;
}

export const CameraHandTracker: React.FC<CameraHandTrackerProps> = ({
  isEnabled,
  onChoiceSelect,
  onChoiceConfirm,
  onNextTrigger,
  isAnswerRevealed,
  onSwitchToMouse
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Gesture states
  const [detectedChoice, setDetectedChoice] = useState<number | null>(null);
  const [fingerCount, setFingerCount] = useState<number>(0);
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100
  const [confirmedChoice, setConfirmedChoice] = useState<number | null>(null);

  // Swipe states for right-to-left navigation
  const [swipeProgress, setSwipeProgress] = useState<number>(0);
  const [isSwipeTriggered, setIsSwipeTriggered] = useState<boolean>(false);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hold tracking refs
  const holdStartRef = useRef<{ choice: number; time: number } | null>(null);
  const confirmedLockRef = useRef<boolean>(false);
  const lastTickTimeRef = useRef<number>(0);

  // Swipe tracking refs (right-to-left detection)
  const handHistoryRef = useRef<HandHistoryPoint[]>([]);
  const lastSwipeTimeRef = useRef<number>(0);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isCancelled = false;

    const initHandLandmarker = async () => {
      try {
        setIsLoadingModel(true);
        setModelError(null);

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );

        if (isCancelled) return;

        let landmarker: HandLandmarker;
        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numHands: 1
          });
        } catch {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numHands: 1
          });
        }

        if (isCancelled) return;

        handLandmarkerRef.current = landmarker;
        setIsLoadingModel(false);
      } catch (err) {
        if (!isCancelled) {
          console.error('MediaPipe initialization failed:', err);
          setModelError('MediaPipe AI 모델 로딩에 실패했습니다. 네트워크 연결을 확인해 주세요.');
          setIsLoadingModel(false);
        }
      }
    };

    initHandLandmarker();

    return () => {
      isCancelled = true;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, []);

  // Reset states when answer revelation changes
  useEffect(() => {
    confirmedLockRef.current = false;
    holdStartRef.current = null;
    handHistoryRef.current = [];
    setHoldProgress(0);
    setSwipeProgress(0);
    setIsSwipeTriggered(false);
    setConfirmedChoice(null);
  }, [isAnswerRevealed]);

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or failed:', err);
      const error = err as { name?: string; message?: string };
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setCameraError('카메라 접근 권한이 거부되었습니다. 브라우저 주소창 설정에서 카메라를 허용해 주세요.');
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        setCameraError('연결된 카메라 장치를 찾을 수 없습니다.');
      } else {
        setCameraError('카메라를 시작할 수 없습니다. 다른 앱에서 카메라를 사용 중인지 확인해 주세요.');
      }
      setIsCameraActive(false);
    }
  }, []);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Handle isEnabled prop
  useEffect(() => {
    if (isEnabled && !isLoadingModel && !modelError) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isEnabled, isLoadingModel, modelError, startCamera, stopCamera]);

  // Frame processing loop
  useEffect(() => {
    if (!isCameraActive) return;

    let lastVideoTime = -1;

    const processLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = handLandmarkerRef.current;

      if (video && video.readyState >= 2 && canvas && landmarker) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const currentTime = video.currentTime;
        if (currentTime !== lastVideoTime) {
          lastVideoTime = currentTime;
          const timestamp = performance.now();
          const results = landmarker.detectForVideo(video, timestamp);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (results.landmarks && results.landmarks.length > 0) {
              const rawLandmarks = results.landmarks[0] as NormalizedLandmark[];
              const analysis = analyzeHandFingers(rawLandmarks);

              setFingerCount(analysis.count);
              const choice = analysis.detectedChoice;
              setDetectedChoice(choice);

              const now = Date.now();

              // Screen X coordinate (accounting for CSS transform -scale-x-100 mirroring)
              // User on screen's right has rawLandmark x near 0 => screenX near 1.
              // User moving to screen's left has rawLandmark x near 1 => screenX near 0.
              const handX = 1 - rawLandmarks[9].x;
              const handY = rawLandmarks[9].y;

              // === ANSWER REVEALED: RIGHT-TO-LEFT SWIPE DETECTION ===
              if (isAnswerRevealed) {
                // Record position history
                handHistoryRef.current.push({ x: handX, y: handY, time: now });

                // Retain points within the last 550ms
                const cutoff = now - 550;
                handHistoryRef.current = handHistoryRef.current.filter(p => p.time >= cutoff);

                const history = handHistoryRef.current;
                if (history.length >= 3 && now - lastSwipeTimeRef.current > 1200) {
                  // Find the point from ~200ms-450ms ago
                  const candidate = history.find(p => now - p.time >= 150 && now - p.time <= 450) || history[0];
                  const deltaX = handX - candidate.x; // Negative means moved from Right to Left!
                  const deltaY = Math.abs(handY - candidate.y);

                  // If moving right to left
                  if (deltaX < 0) {
                    const prog = Math.min(100, Math.round(Math.abs(deltaX) / 0.18 * 100));
                    setSwipeProgress(prog);

                    // Threshold: moved left by at least 18% of screen width with horizontal dominance
                    if (deltaX <= -0.18 && deltaY <= Math.abs(deltaX) * 1.5) {
                      lastSwipeTimeRef.current = now;
                      setIsSwipeTriggered(true);
                      sound.playSwipe();
                      onNextTrigger?.();
                      handHistoryRef.current = [];
                      setSwipeProgress(100);
                    }
                  } else {
                    setSwipeProgress(0);
                  }
                }

                // Draw skeleton on canvas
                drawHandSkeleton(ctx, rawLandmarks, canvas.width, canvas.height, false);

                // Draw swipe trail on canvas
                if (history.length > 2) {
                  ctx.save();
                  ctx.beginPath();
                  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
                  ctx.lineWidth = 4;
                  ctx.lineCap = 'round';
                  history.forEach((pt, i) => {
                    // Convert screenX back to canvas coordinate (canvas has -scale-x-100 in CSS)
                    const canvasX = (1 - pt.x) * canvas.width;
                    const canvasY = pt.y * canvas.height;
                    if (i === 0) ctx.moveTo(canvasX, canvasY);
                    else ctx.lineTo(canvasX, canvasY);
                  });
                  ctx.stroke();
                  ctx.restore();
                }
              } else {
                // === QUESTION ANSWERING MODE: 1.5s HOLD ===
                if (choice !== null && choice >= 1 && choice <= 4 && !confirmedLockRef.current) {
                  onChoiceSelect(choice);

                  if (!holdStartRef.current || holdStartRef.current.choice !== choice) {
                    holdStartRef.current = { choice, time: now };
                    setHoldProgress(0);
                  } else {
                    const elapsed = now - holdStartRef.current.time;
                    const prog = Math.min(100, Math.round((elapsed / 1500) * 100));
                    setHoldProgress(prog);

                    // Soft audio tick every 400ms during hold
                    if (now - lastTickTimeRef.current > 400 && prog < 100) {
                      sound.playTick();
                      lastTickTimeRef.current = now;
                    }

                    if (elapsed >= 1500) {
                      confirmedLockRef.current = true;
                      setConfirmedChoice(choice);
                      sound.playConfirm();
                      onChoiceConfirm(choice);
                      holdStartRef.current = null;
                    }
                  }
                } else {
                  holdStartRef.current = null;
                  setHoldProgress(0);
                }

                drawHandSkeleton(
                  ctx,
                  rawLandmarks,
                  canvas.width,
                  canvas.height,
                  holdProgress > 20
                );
              }
            } else {
              // No hand detected
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              setDetectedChoice(null);
              setFingerCount(0);
              holdStartRef.current = null;
              setHoldProgress(0);
              setSwipeProgress(0);
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(processLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isCameraActive, isAnswerRevealed, onChoiceSelect, onChoiceConfirm, onNextTrigger, holdProgress]);

  // Label text for gesture recognition
  const getGestureStatusText = () => {
    if (isLoadingModel) return 'MediaPipe AI 모델 초기화 중...';
    if (!isCameraActive) return '카메라 비활성화됨';
    if (isAnswerRevealed) {
      if (isSwipeTriggered) {
        return '✨ 오른쪽➔왼쪽 스와이프 감지! 다음 문제로 이동합니다';
      }
      if (swipeProgress > 20) {
        return `👈 왼쪽으로 스와이프 중... (${swipeProgress}%)`;
      }
      return '손을 오른쪽에서 왼쪽으로 휙 넘기면 다음 문제로 이동 (Swipe Left)';
    }
    if (confirmedChoice !== null) {
      return `✅ ${confirmedChoice}번 선택 확정!`;
    }
    if (detectedChoice !== null && detectedChoice >= 1 && detectedChoice <= 4) {
      return `👉 [${detectedChoice}번] 인식됨: 1.5초간 유지하세요 (${holdProgress}%)`;
    }
    if (fingerCount > 4) {
      return `🖐️ 손가락 ${fingerCount}개 감지됨 (1~4번 중 선택해 주세요)`;
    }
    return '카메라에 손을 비추고 1~4개의 손가락을 펴주세요';
  };

  return (
    <div className="flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
      {/* Video & Canvas Container */}
      <div className="relative aspect-4/3 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Hidden/Mirrored Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
            isCameraActive ? 'opacity-85' : 'opacity-0'
          }`}
        />

        {/* Skeleton Canvas Overlay (Mirrored) */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none z-10 ${
            isCameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Hold Meter Overlay Ring for Answering */}
        {isCameraActive && !isAnswerRevealed && holdProgress > 0 && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-500/40 shadow-lg">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2.5"
                  fill="transparent"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray={62.8}
                  strokeDashoffset={62.8 - (62.8 * holdProgress) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-75"
                />
              </svg>
            </div>
            <span className="text-xs font-mono font-bold text-sky-300 tabular-nums">
              {holdProgress}%
            </span>
          </div>
        )}

        {/* Swipe Left Guidance Animation Overlay (When Answer is Revealed) */}
        {isCameraActive && isAnswerRevealed && (
          <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
            <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-xl border border-indigo-500/40 flex items-center gap-3 shadow-xl">
              <div className="flex items-center gap-1 text-indigo-400 animate-pulse">
                <span className="text-xs font-bold">오른쪽</span>
                <span className="text-slate-500 font-mono">───➔</span>
                <ArrowLeft className="w-4 h-4 text-sky-400 animate-bounce" />
                <span className="text-xs font-bold text-sky-400">왼쪽으로 넘기기</span>
              </div>
              {swipeProgress > 0 && (
                <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all duration-75"
                    style={{ width: `${swipeProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingModel && (
          <div className="flex flex-col items-center justify-center p-6 text-center z-20">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
            <p className="text-sm font-medium text-white">MediaPipe Hand Landmarker 준비 중</p>
            <p className="text-xs text-slate-400 mt-1">온디바이스 WASM 모델을 브라우저에 로드하고 있습니다.</p>
          </div>
        )}

        {/* Camera Permission / Device Error Card */}
        {cameraError && !isLoadingModel && (
          <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center z-30">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3 text-rose-400">
              <CameraOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">카메라를 켤 수 없습니다</h3>
            <p className="text-xs text-slate-300 max-w-xs mb-4 leading-relaxed">
              {cameraError}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={startCamera}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>카메라 재시도</span>
              </button>
              <button
                onClick={onSwitchToMouse}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer shadow-md"
              >
                <span>마우스 모드로 문제 풀기</span>
              </button>
            </div>
          </div>
        )}

        {/* Model Load Error */}
        {modelError && !isLoadingModel && (
          <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center z-30">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
            <p className="text-xs text-slate-300 mb-4">{modelError}</p>
            <button
              onClick={onSwitchToMouse}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
            >
              마우스 모드로 전환
            </button>
          </div>
        )}

        {/* Camera Disabled State */}
        {!isEnabled && (
          <div className="flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2 text-slate-400">
              <CameraOff className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-200">마우스 클릭 모드 작동 중</p>
            <p className="text-xs text-slate-400 mt-1">보기 버튼을 마우스로 직접 클릭하여 정답을 선택하세요.</p>
          </div>
        )}
      </div>

      {/* Recognition Status Bar */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            {isAnswerRevealed ? (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 shrink-0 border border-indigo-500/40">
                <ArrowLeft className="w-3.5 h-3.5" />
              </span>
            ) : detectedChoice ? (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs shrink-0 border border-sky-500/40">
                {detectedChoice}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
            )}
            <span className="text-slate-200 font-medium truncate">
              {getGestureStatusText()}
            </span>
          </div>

          {!isAnswerRevealed && detectedChoice && (
            <span className="text-slate-400 text-[11px] font-mono shrink-0">
              손가락 {fingerCount}개
            </span>
          )}
        </div>

        {/* Progress Bar (Hold or Swipe) */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${
              isAnswerRevealed
                ? swipeProgress >= 100
                  ? 'bg-emerald-400'
                  : 'bg-indigo-400'
                : holdProgress >= 100
                ? 'bg-emerald-400'
                : holdProgress > 0
                ? 'bg-sky-400'
                : 'bg-transparent'
            }`}
            style={{ width: `${isAnswerRevealed ? swipeProgress : holdProgress}%` }}
          />
        </div>

        {/* Gesture Shortcut Guide Pill */}
        {isAnswerRevealed ? (
          <div className="flex items-center justify-between py-1.5 px-3 rounded-lg border border-indigo-500/30 bg-indigo-950/30 text-xs text-indigo-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>다음 문제 넘기기:</span>
            </span>
            <span className="font-semibold text-white">오른쪽(👉)에서 왼쪽(👈)으로 손 휙 젓기</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1 pt-1 text-center text-[11px] text-slate-400">
            <div className={`py-1 px-1 rounded border transition-colors ${detectedChoice === 1 ? 'border-sky-500 bg-sky-950/40 text-sky-300 font-semibold' : 'border-slate-800 bg-slate-800/40'}`}>
              ☝️ 1번
            </div>
            <div className={`py-1 px-1 rounded border transition-colors ${detectedChoice === 2 ? 'border-sky-500 bg-sky-950/40 text-sky-300 font-semibold' : 'border-slate-800 bg-slate-800/40'}`}>
              ✌️ 2번
            </div>
            <div className={`py-1 px-1 rounded border transition-colors ${detectedChoice === 3 ? 'border-sky-500 bg-sky-950/40 text-sky-300 font-semibold' : 'border-slate-800 bg-slate-800/40'}`}>
              🤟 3번
            </div>
            <div className={`py-1 px-1 rounded border transition-colors ${detectedChoice === 4 ? 'border-sky-500 bg-sky-950/40 text-sky-300 font-semibold' : 'border-slate-800 bg-slate-800/40'}`}>
              🖐️ 4번
            </div>
          </div>
        )}

        {/* Privacy Note Banner */}
        <div className="mt-1 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400/90">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">100% On-Device 브라우저 처리</span>
          </div>
          <span className="text-slate-500 text-[10px]">외부 서버 영상 전송 안 함</span>
        </div>
      </div>
    </div>
  );
};
