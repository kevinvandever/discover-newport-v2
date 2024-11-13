export interface Message {
  text: string;
  isUser: boolean;
  isError?: boolean;
  errorCode?: string;
}

export interface TriviaResponse {
  question: string;
  answer: string;
}

export interface TriviaProps {
  onClose: () => void;
}

export interface TriviaState {
  correctAnswers: number;
  totalQuestions: number;
  currentAnswer?: string;
  questionsAnswered: number;
  isGameActive: boolean;
  waitingForNext: boolean;
}