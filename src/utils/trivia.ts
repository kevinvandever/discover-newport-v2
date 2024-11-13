export const processUserInput = (input: string): string => {
  const trimmedInput = input.trim();
  
  // Convert single-letter answers to uppercase
  if (/^[abcd]$/i.test(trimmedInput)) {
    return trimmedInput.toUpperCase();
  }
  
  // Handle special commands
  const lowerInput = trimmedInput.toLowerCase();
  if (['next', 'stop', 'start'].includes(lowerInput)) {
    return lowerInput;
  }
  
  return trimmedInput;
};

export const formatQuestion = (question: string): string => {
  // Extract just the question part, removing any extra text
  const questionMatch = question.match(/Question:.*?\n\n(.*?)\n\nPlease/s);
  if (questionMatch && questionMatch[1]) {
    return questionMatch[1].trim();
  }
  
  // Fallback to simple format if the pattern doesn't match
  const parts = question.split('\n\nCorrect Answer:');
  return parts[0].trim();
};

export const ERROR_MESSAGES: { [key: string]: string } = {
  INVALID_INPUT: 'Please provide a valid input.',
  API_ERROR: 'Unable to connect to the trivia service. Please try again.',
  INVALID_RESPONSE: 'Received an invalid response from the server.',
  NETWORK_ERROR: 'Network connection issue. Please check your internet connection.',
  PARSE_ERROR: 'Unable to process the trivia question. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};