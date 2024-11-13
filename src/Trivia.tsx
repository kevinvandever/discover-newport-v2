import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Loader, AlertCircle, Brain, Trash2 } from 'lucide-react';
import { useTheme } from './ThemeContext';
import DOMPurify from 'dompurify';
import { makeTriviaChatRequest, TriviaError } from './api/trivia';
import { processUserInput, formatQuestion, ERROR_MESSAGES } from './utils/trivia';
import { Message, TriviaProps, TriviaState } from './types/trivia';

const Trivia = ({ onClose }: TriviaProps) => {
  const [messages, setMessages] = useState<Message[]>([{
    text: "Welcome to Newport Trivia! Let's test your knowledge about our beautiful city. Loading your first question...",
    isUser: false
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState<TriviaState>({
    correctAnswers: 0,
    totalQuestions: 0,
    currentAnswer: undefined,
    questionsAnswered: 0,
    isGameActive: true,
    waitingForNext: false
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const initializeRef = useRef(false);

  useEffect(() => {
    if (!initializeRef.current) {
      initializeRef.current = true;
      startTrivia();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!isLoading && messages.length > 0 && !messages[messages.length - 1].isUser) {
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

  const handleError = (error: unknown) => {
    console.error('Trivia Error:', error);
    if (error instanceof TriviaError) {
      return {
        text: ERROR_MESSAGES[error.code] || ERROR_MESSAGES.UNKNOWN_ERROR,
        isUser: false,
        isError: true,
        errorCode: error.code
      };
    }
    return {
      text: ERROR_MESSAGES.UNKNOWN_ERROR,
      isUser: false,
      isError: true,
      errorCode: 'UNKNOWN_ERROR'
    };
  };

  const startTrivia = async () => {
    setIsLoading(true);
    try {
      const response = await makeTriviaChatRequest("All things Newport");
      const question = formatQuestion(response.question);
      setMessages(prev => [...prev, { 
        text: question, 
        isUser: false 
      }]);
      setGameState(prev => ({
        ...prev,
        currentAnswer: response.answer,
        totalQuestions: prev.totalQuestions + 1,
        isGameActive: true,
        waitingForNext: false
      }));
    } catch (error) {
      setMessages(prev => [...prev, handleError(error)]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = (userAnswer: string, correctAnswer?: string): boolean => {
    if (!correctAnswer) return false;
    return userAnswer.toUpperCase() === correctAnswer.toUpperCase();
  };

  const getNextQuestion = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { 
      text: "🎲 Here comes another Newport brain teaser...", 
      isUser: false 
    }]);
    
    try {
      const response = await makeTriviaChatRequest("next");
      const question = formatQuestion(response.question);
      setMessages(prev => [...prev.slice(0, -1), { 
        text: question, 
        isUser: false 
      }]);
      setGameState(prev => ({
        ...prev,
        currentAnswer: response.answer,
        totalQuestions: prev.totalQuestions + 1,
        waitingForNext: false
      }));
    } catch (error) {
      setMessages(prev => [...prev.slice(0, -1), handleError(error)]);
    } finally {
      setIsLoading(false);
    }
  };

  const endGame = () => {
    const finalScore = `🏁 Game Over! Final Score: ${gameState.correctAnswers}/${gameState.questionsAnswered}`;
    setMessages(prev => [...prev, { text: finalScore, isUser: false }]);
    setGameState(prev => ({ ...prev, isGameActive: false }));
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const processedInput = processUserInput(input);
    const userMessage = { text: processedInput, isUser: true };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (!gameState.isGameActive) {
      if (processedInput.toLowerCase() === 'start') {
        clearChat();
      }
      return;
    }

    if (gameState.waitingForNext) {
      if (processedInput.toLowerCase() === 'next') {
        await getNextQuestion();
      } else if (processedInput.toLowerCase() === 'stop') {
        endGame();
      } else {
        setMessages(prev => [...prev, {
          text: "Please type 'next' for another question or 'stop' to end the game.",
          isUser: false
        }]);
      }
      return;
    }

    if (/^[A-D]$/i.test(processedInput)) {
      const isCorrect = checkAnswer(processedInput, gameState.currentAnswer);
      setGameState(prev => ({
        ...prev,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        questionsAnswered: prev.questionsAnswered + 1,
        waitingForNext: true
      }));

      const feedbackMessage = {
        text: isCorrect 
          ? `✅ Correct! Your score: ${gameState.correctAnswers + 1}/${gameState.questionsAnswered + 1}\nType "next" for another question or "stop" to end the game.`
          : `❌ Sorry, that's incorrect. The correct answer was ${gameState.currentAnswer}. Score: ${gameState.correctAnswers}/${gameState.questionsAnswered + 1}\nType "next" for another question or "stop" to end the game.`,
        isUser: false
      };

      setMessages(prev => [...prev, feedbackMessage]);
    } else {
      setMessages(prev => [...prev, {
        text: "Please enter A, B, C, or D to answer the question.",
        isUser: false
      }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      text: "Welcome back to Newport Trivia! Loading a new question...",
      isUser: false
    }]);
    setGameState({
      correctAnswers: 0,
      totalQuestions: 0,
      currentAnswer: undefined,
      questionsAnswered: 0,
      isGameActive: true,
      waitingForNext: false
    });
    startTrivia();
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-newport-600 text-white' : 'bg-newport-100 text-newport-600'}`}>
      <div className="flex justify-between items-center p-3 md:p-4 bg-newport-accent text-white">
        <div className="flex flex-col">
          <h2 className="text-lg md:text-xl font-bold flex items-center">
            <Brain size={20} className="mr-2" />
            Newport Trivia Challenge
          </h2>
          <p className="text-sm mt-1">
            Score: {gameState.correctAnswers}/{gameState.questionsAnswered}
          </p>
        </div>
        <div className="flex items-center">
          <button 
            onClick={clearChat} 
            className="text-white hover:text-newport-100 mr-2 p-2 rounded-full bg-newport-500 hover:bg-newport-600 transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={onClose} 
            className="text-white hover:text-newport-100 p-1 rounded transition-colors"
            title="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-3 md:p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-3 md:mb-4 ${
              message.isUser ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                message.isUser
                  ? 'bg-newport-accent text-white'
                  : message.isError
                  ? 'bg-red-100 text-red-700'
                  : theme === 'dark'
                  ? 'bg-newport-500 text-white'
                  : 'bg-newport-200 text-newport-600'
              }`}
            >
              {message.isError && (
                <AlertCircle size={14} className="inline-block mr-1" />
              )}
              {message.isUser ? (
                message.text
              ) : (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.text) }} />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className={`p-3 md:p-4 border-t ${theme === 'dark' ? 'border-newport-500' : 'border-newport-200'}`}>
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              gameState.isGameActive 
                ? gameState.waitingForNext
                  ? "Type 'next' for another question or 'stop' to end..."
                  : "Type A, B, C, or D to answer..."
                : "Type 'start' to play again..."
            }
            className={`flex-grow mr-2 p-2 border rounded ${
              theme === 'dark' ? 'bg-newport-500 text-white border-newport-400' : 'bg-white text-newport-600 border-newport-300'
            }`}
            disabled={isLoading}
            ref={inputRef}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="bg-newport-accent text-white p-2 rounded hover:bg-newport-500 transition-colors"
          >
            {isLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Trivia;