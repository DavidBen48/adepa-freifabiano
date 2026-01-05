import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, UserCheck } from 'lucide-react';
import { ChatMessage } from '../types';
import { initializeChat, sendMessageToGemini } from '../services/geminiService';
import { Member } from '../types';

interface ChatAssistantProps {
  members: Member[];
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ members }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [identifiedUser, setIdentifiedUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting logic
  useEffect(() => {
    if (isOpen && messages.length === 0 && !identifiedUser) {
      setMessages([
        {
          id: 'system-init',
          role: 'model',
          text: 'Olá! Sou o FREI.ai. Para um atendimento personalizado, por favor, identifique-se: Você é a Laryssa ou a Nilda?',
          timestamp: Date.now()
        }
      ]);
    }
  }, [isOpen, messages.length, identifiedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    
    // Create User Message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Identity Check Logic (First Interaction)
    if (!identifiedUser) {
      const lowerText = userText.toLowerCase();
      let detectedName = '';
      
      if (lowerText.includes('laryssa')) detectedName = 'Laryssa';
      else if (lowerText.includes('nilda')) detectedName = 'Nilda';
      else detectedName = 'Administrador';

      setIdentifiedUser(detectedName);
      
      // Initialize Gemini with the detected name context
      initializeChat(members, detectedName);

      // Simulated immediate response for identity confirmation
      setTimeout(() => {
        const responseText = `Olá, ${detectedName}. Identidade confirmada. Como posso auxiliar na análise dos membros ou questões da ADEPA hoje?`;
        
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'model',
          text: responseText,
          timestamp: Date.now()
        }]);
        setIsLoading(false);
      }, 800);
      
      return;
    }

    // Normal Chat Flow
    const responseText = await sendMessageToGemini(userMsg.text);

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-royal-600 hover:bg-royal-500 text-white shadow-lg shadow-royal-900/40 transition-all z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Sparkles size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-royal-900/50 rounded border border-royal-500/30">
                 <Sparkles className="text-royal-500" size={16} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-slate-100 leading-none">FREI.ai</h3>
                <span className="text-[10px] text-slate-400 mt-1">Intelligence System</span>
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
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-royal-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-lg rounded-bl-none border border-slate-700">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={identifiedUser ? "Pergunte ao FREI.ai..." : "Digite seu nome..."}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-royal-500"
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="p-2 bg-royal-600 rounded-lg text-white hover:bg-royal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};