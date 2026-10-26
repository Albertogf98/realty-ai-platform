'use client';

import { useState } from 'react';
import { api } from '@/app/lib/client';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function useOllamaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hola, soy tu asistente inmobiliario. ¿Qué vivienda estás buscando?',
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
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<{ answer: string; filters?: any; properties?: any[] }>('ollama/search-properties', {
        question: trimmed,
      });

      const answer = response.data.answer || 'No tengo respuesta disponible ahora mismo.';

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: answer,
        },
      ]);

      return answer;
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message || 'No he podido contactar con el asistente en este momento.';

      setError(backendMessage);

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
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
