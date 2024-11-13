import { TriviaResponse } from '../types/trivia';

const API_ENDPOINT = 'https://api.mindstudio.ai/developer/v2/apps/run';
const API_KEY = 'sk524a79fde4e773176fe3371d40e9e4e7e23e25f0577babcb0e5a2ec9fee3b3172bb9719f835af28f886ef9bf9a02327786308d63704449ca43d9c88a9fb91a03';

export class TriviaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'TriviaError';
  }
}

const parseTriviaParts = (result: any): TriviaResponse => {
  try {
    // Handle case where result is already the correct format
    if (typeof result === 'object' && result.question && result.answer) {
      return {
        question: result.question,
        answer: result.answer
      };
    }

    // Handle string format
    const text = typeof result === 'string' ? result : JSON.stringify(result);
    const parts = text.split('\n\nCorrect Answer: ');
    if (parts.length === 2) {
      return {
        question: parts[0].trim(),
        answer: parts[1].trim()
      };
    }

    throw new Error('Invalid response format');
  } catch (error) {
    throw new TriviaError(
      'Failed to parse trivia response',
      'PARSE_ERROR',
      { result, error }
    );
  }
};

export const makeTriviaChatRequest = async (input: string): Promise<TriviaResponse> => {
  if (!input) {
    throw new TriviaError('Input is required', 'INVALID_INPUT');
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        appId: "4798ddd6-78b6-4bca-a3fd-6bed016016f6",
        variables: {
          input
        },
        workflow: "NewportTrivia.flow"
      }),
    });

    if (!response.ok) {
      throw new TriviaError(
        `API request failed with status ${response.status}`,
        'API_ERROR',
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data?.success || !data?.result) {
      throw new TriviaError(
        'Invalid response format from API',
        'INVALID_RESPONSE',
        data
      );
    }

    return parseTriviaParts(data.result);
  } catch (error) {
    if (error instanceof TriviaError) {
      throw error;
    }
    
    if (error instanceof TypeError) {
      throw new TriviaError(
        'Network error occurred',
        'NETWORK_ERROR',
        { message: error.message }
      );
    }

    throw new TriviaError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      { error }
    );
  }
};