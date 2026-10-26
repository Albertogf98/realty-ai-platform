'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircleMore, SendHorizontal, Sparkles, X } from 'lucide-react';
import { useOllamaChat } from '@/app/hooks/useOllamaChat';

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { messages, isLoading, error, sendMessage, clearError } = useOllamaChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    setInput('');
    await sendMessage(trimmed);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[360px] rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Asistente inmobiliario</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                clearError();
              }}
              className="rounded-full p-1 hover:bg-white/10"
              aria-label="Cerrar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex max-h-[420px] min-h-[320px] flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                  message.role === 'user' ? 'ml-auto bg-slate-900 text-white' : 'mr-auto bg-white text-slate-700 ring-1 ring-slate-200'
                }`}
              >
                {message.content}
              </div>
            ))}

            {isLoading && <div className="mr-auto rounded-2xl bg-white px-3 py-2 text-sm text-slate-500 ring-1 ring-slate-200">Pensando...</div>}
          </div>

          {error && <div className="border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
            <input
              type="text"
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder="Busca una vivienda por ciudad, precio o habitaciones..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-0 transition focus:border-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 p-2 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              aria-label="Enviar mensaje"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-slate-300 transition hover:bg-slate-700"
        >
          <MessageCircleMore className="h-4 w-4" />
          Chat bot
        </button>
      )}
    </div>
  );
}
