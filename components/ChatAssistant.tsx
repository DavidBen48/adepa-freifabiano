import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, AlertTriangle } from 'lucide-react';
import { ChatMessage, Member } from '../types';

interface ChatAssistantProps {
  members: Member[];
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ members }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lógica da mensagem de manutenção
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'system-maint',
          role: 'model',
          text: '🚧 SISTEMA EM MANUTENÇÃO 🚧\n\nEsta parte do site, que é a Inteligência Artificial (FREI.ai), está em manutenção e passando por testes finais.\n\nEm breve, numa futura atualização, estará funcionando plenamente para auxiliá-lo.',
          timestamp: Date.now()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-royal-600 hover:bg-royal-500 text-white shadow-lg shadow-royal-900/40 transition-all z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Sparkles size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[500px] max-h-[80vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-yellow-900/50 rounded border border-yellow-500/30">
                 <AlertTriangle className="text-yellow-500" size={16} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-slate-100 leading-none">FREI.ai</h3>
                <span className="text-[10px] text-yellow-500 mt-1">Em Manutenção</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex justify-start`}
              >
                <div
                  className={`max-w-[90%] p-4 rounded-lg text-sm shadow-sm bg-slate-800 text-slate-300 border border-slate-700 rounded-bl-none whitespace-pre-wrap leading-relaxed`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input (Disabled) */}
          <div className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              disabled
              placeholder="Recurso indisponível..."
              className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-600 cursor-not-allowed focus:outline-none"
            />
            <button
              disabled
              className="p-2 bg-slate-800 rounded-lg text-slate-600 cursor-not-allowed border border-slate-700"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};