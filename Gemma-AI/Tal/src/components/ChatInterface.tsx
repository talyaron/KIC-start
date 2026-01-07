'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, StopCircle } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    // Add placeholder for assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch');
      if (!response.body) throw new Error('No body');

      const reader = response.body.getReader();

      setMessages(prev => {
        const newMessages = [...prev];
        return newMessages;
      });
      
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        accumulatedContent += chunk;
        
        setMessages(prev => {
           const newMessages = [...prev];
           const lastMsg = newMessages[newMessages.length - 1];
           if (lastMsg.role === 'assistant') {
             lastMsg.content = accumulatedContent;
           }
           return newMessages;
        });
      }

    } catch (error) {
      console.error('Error:', error);
      // Simplify error handling for now - maybe remove the empty bubble if failed?
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-slate-900/50 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-700/50 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Bot className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-lg">Gemma 3n</h1>
          <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </p>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
            <Bot size={64} className="mb-4" />
            <p className="text-lg">How can I help you today?</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} role={msg.role} content={msg.content} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 ml-4 animate-pulse">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-0" />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-700/50">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[3rem] shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {isLoading ? <StopCircle size={20} /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}
