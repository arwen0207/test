import { FingerStates } from '../types/quiz';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

// MediaPipe Hand Connection Pairs
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17]
];

function distSq(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

export function analyzeHandFingers(landmarks: NormalizedLandmark[]): FingerStates {
  if (!landmarks || landmarks.length < 21) {
    return {
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false,
      count: 0,
      detectedChoice: null
    };
  }

  const wrist = landmarks[0];

  // Helper: Is finger extended?
  // We check two complementary factors:
  // 1. Tip distance from wrist is noticeably greater than PIP distance from wrist
  // 2. Tip is higher (lower y in screen space) than PIP/DIP
  const isExtended = (tipIdx: number, dipIdx: number, pipIdx: number, mcpIdx: number): boolean => {
    const tip = landmarks[tipIdx];
    const dip = landmarks[dipIdx];
    const pip = landmarks[pipIdx];
    const mcp = landmarks[mcpIdx];

    const dTipWrist = distSq(tip, wrist);
    const dPipWrist = distSq(pip, wrist);
    const dMcpWrist = distSq(mcp, wrist);

    // Tip should be further from wrist than PIP
    const isFurther = dTipWrist > dPipWrist * 1.15 && dTipWrist > dMcpWrist * 1.2;
    // Tip higher than DIP and PIP (y is smaller when higher)
    const isHigher = tip.y < pip.y || tip.y < dip.y;

    return isFurther && (isHigher || dTipWrist > dPipWrist * 1.35);
  };

  const isIndexExtended = isExtended(8, 7, 6, 5);
  const isMiddleExtended = isExtended(12, 11, 10, 9);
  const isRingExtended = isExtended(16, 15, 14, 13);
  const isPinkyExtended = isExtended(20, 19, 18, 17);

  // Thumb detection:
  // When thumb is extended outward, thumb tip (4) is far from the base of the pinky (17) and index MCP (5)
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const pinkyMcp = landmarks[17];
  const indexMcp = landmarks[5];

  const dThumbPinky = distSq(thumbTip, pinkyMcp);
  const dThumbIpPinky = distSq(thumbIp, pinkyMcp);
  const dThumbIndexMcp = distSq(thumbTip, indexMcp);

  const isThumbExtended = dThumbPinky > dThumbIpPinky * 1.2 && dThumbIndexMcp > 0.02;

  // Primary 4-finger gestures (Option 1 to 4):
  // 1 finger: Index alone (or only 1 finger raised)
  // 2 fingers: Index + Middle (or any 2 fingers)
  // 3 fingers: Index + Middle + Ring (or any 3 fingers)
  // 4 fingers: Index + Middle + Ring + Pinky (4 fingers)
  const fingers = [
    { name: 'thumb', extended: isThumbExtended },
    { name: 'index', extended: isIndexExtended },
    { name: 'middle', extended: isMiddleExtended },
    { name: 'ring', extended: isRingExtended },
    { name: 'pinky', extended: isPinkyExtended }
  ];

  const extendedCount = fingers.filter(f => f.extended).length;

  let detectedChoice: number | null = null;

  // Prioritize standard human gestures:
  if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    detectedChoice = 1;
  } else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    detectedChoice = 2;
  } else if (isIndexExtended && isMiddleExtended && isRingExtended && !isPinkyExtended) {
    detectedChoice = 3;
  } else if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended && !isThumbExtended) {
    detectedChoice = 4;
  } else if (extendedCount >= 1 && extendedCount <= 4) {
    // Robust fallback: if user raises count fingers
    detectedChoice = extendedCount;
  }

  return {
    thumb: isThumbExtended,
    index: isIndexExtended,
    middle: isMiddleExtended,
    ring: isRingExtended,
    pinky: isPinkyExtended,
    count: extendedCount,
    detectedChoice
  };
}

export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  isActiveHold: boolean
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Connection lines
  ctx.lineWidth = isActiveHold ? 4 : 2.5;
  ctx.strokeStyle = isActiveHold ? 'rgba(56, 189, 248, 0.95)' : 'rgba(148, 163, 184, 0.75)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];

    ctx.beginPath();
    // Video is mirrored horizontally for natural selfie view
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  }

  // Draw landmark points
  const tips = [4, 8, 12, 16, 20];
  for (let i = 0; i < landmarks.length; i++) {
    const p = landmarks[i];
    const x = p.x * width;
    const y = p.y * height;
    const isTip = tips.includes(i);

    ctx.beginPath();
    ctx.arc(x, y, isTip ? (isActiveHold ? 6 : 5) : 3.5, 0, Math.PI * 2);

    if (isTip) {
      ctx.fillStyle = isActiveHold ? '#38bdf8' : '#22c55e';
      ctx.shadowColor = isActiveHold ? '#38bdf8' : '#22c55e';
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
    }

    ctx.fill();
  }

  ctx.restore();
}
