export type ScienceCategory = '물리' | '화학' | '생명과학' | '지구과학';

export interface Question {
  id: number;
  category: ScienceCategory;
  grade: string;
  topic: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0, 1, 2, 3 corresponds to Option 1, 2, 3, 4
  explanation: string;
  keyConcept: string;
}

export interface UserAnswerRecord {
  questionId: number;
  selectedOption: number; // 0, 1, 2, 3
  isCorrect: boolean;
  method: 'gesture' | 'mouse';
  timeSpentSec: number;
}

export type InputMode = 'gesture' | 'mouse';

export interface FingerStates {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  count: number;
  detectedChoice: number | null; // 1, 2, 3, 4 or null
}
