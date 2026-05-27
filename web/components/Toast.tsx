'use client';

import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

let toastListeners: ((msg: ToastMessage) => void)[] = [];

export function showToast(type: ToastMessage['type'], text: string) {
  const msg: ToastMessage = { id: Date.now().toString(), type, text };
  toastListeners.forEach((fn) => fn(msg));
}

export default function Toast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }, 4000);
    };
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((h) => h !== handler);
    };
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`animate-slide-up rounded-lg px-4 py-3 shadow-lg text-sm font-medium transition-all duration-300 ${
            msg.type === 'success'
              ? 'bg-green-600 text-white'
              : msg.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-indigo-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>
              {msg.type === 'success' ? '✓' : msg.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span>{msg.text}</span>
            <button
              onClick={() =>
                setMessages((prev) => prev.filter((m) => m.id !== msg.id))
              }
              className="ml-2 opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
