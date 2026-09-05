'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-store';
import { useSendChatMessage, type ChatMessage } from '@/lib/hooks/useChatbot';

function welcomeMessage(isLoggedIn: boolean, username?: string): ChatMessage {
  if (isLoggedIn) {
    return {
      role: 'assistant',
      content: `¡Hola${username ? ` ${username}` : ''}! Puedo contarte sobre tus predicciones activas, mercados y probabilidades. ¿En qué te ayudo?`,
    };
  }
  return {
    role: 'assistant',
    content:
      'Hola, soy el asistente de PredictaX. Puedo contarte qué es la plataforma y cómo se calculan las probabilidades. Iniciá sesión para preguntarme por tus propias predicciones.',
  };
}

export function ChatWidget() {
  const { isLoggedIn, user } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendChatMessage();

  useEffect(() => {
    setMessages([welcomeMessage(isLoggedIn, user?.username)]);
  }, [isLoggedIn, user?.username]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sendMessage.isPending]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;

    const history = messages;
    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    sendMessage.mutate(
      { message: trimmed, history },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        },
        onError: (error) => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: error.message || 'No pude responder ahora. Probá de nuevo en un momento.',
            },
          ]);
        },
      }
    );
  };

  return (
    <div className="fixed bottom-20 right-4 z-[60] md:bottom-6 md:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 right-0 flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
              <span className="text-sm font-semibold">Asistente PredictaX</span>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'ml-auto bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="max-w-[85%] rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-400 dark:bg-gray-800">
                  Escribiendo…
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-gray-200 p-3 dark:border-gray-800">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribí tu pregunta..."
                aria-label="Mensaje para el asistente"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800"
              />
              <button
                onClick={handleSend}
                disabled={sendMessage.isPending || !input.trim()}
                aria-label="Enviar mensaje"
                className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat de ayuda'}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
