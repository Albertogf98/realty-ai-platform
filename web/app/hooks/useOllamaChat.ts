'use client';

import { useState } from 'react';
import { api } from '@/app/lib/client';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type OllamaResponse = {
  answer: string;
  filters?: Record<string, unknown>;
  properties?: Array<Record<string, unknown>>;
};

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function useOllamaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hola, soy tu asistente inmobiliario. ¿Qué estás buscando?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (question: string) => {
    const trimmed = question.trim();

    if (!trimmed || isLoading) {
      return '';
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmed,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Historial reciente (sin el mensaje nuevo ni el saludo inicial)
    const history = messages
      .filter(message => message.id !== 'welcome')
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    try {
      const response = await api.post<OllamaResponse>('ollama/search-properties', {
        question: trimmed,
        history,
      });

      const answer = response.data.answer || 'No tengo respuesta disponible ahora mismo.';

      setMessages(prev => [
        ...prev,
        {
          id: createMessageId(),
          role: 'assistant',
          content: answer,
        },
      ]);

      return answer;
    } catch (err: unknown) {
      const backendMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No he podido contactar con el asistente en este momento.';

      setError(backendMessage);

      setMessages(prev => [
        ...prev,
        {
          id: createMessageId(),
          role: 'assistant',
          content: 'No he podido contactar con el asistente. Inténtalo otra vez.',
        },
      ]);

      return '';
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError: () => setError(null),
  };
}
