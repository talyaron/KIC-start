import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessageToGemma } from './api';
import type { Message } from './api';
import './App.css';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I am Gemma 3n, your intelligent AI companion running locally. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Add an empty assistant message that we'll fill with chunks
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let fullContent = '';
      await sendMessageToGemma(
        [...messages, userMessage],
        (chunk) => {
          fullContent += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: fullContent };
            return updated;
          });
        }
      );
    } catch (err: any) {
      setError(err.message || "Failed to connect to Ollama. Make sure it's running with 'ollama run llama3.2:1b'");
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar/Info Overlay */}
      <div className="header glass">
        <div className="logo">
          <Sparkles className="neon-text" size={24} />
          <h1 className="neon-text">Llama 3.2 <span className="version-tag">Local AI</span></h1>
        </div>
        <div className="status-indicator">
          <div className={`dot ${isLoading ? 'pulse' : 'active'}`}></div>
          <span className="status-text">{isLoading ? 'Generating...' : 'Ollama Ready'}</span>
        </div>
      </div>

      <main className="chat-interface">
        <div className="messages-container">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`message-wrapper ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className={`avatar ${msg.role === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`message-content glass ${msg.role === 'user' ? 'user-bg' : 'assistant-bg'}`}>
                  {msg.role === 'assistant' && msg.content === '' ? (
                    <div className="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* No separate isLoading block here anymore; handled by assistant message + isLoading status elsewhere or typing dots inside the bubble if needed */}

          {error && (
            <div className="error-banner glass">
              <Terminal size={16} />
              <p>{error}</p>
              <div className="setup-guide">
                Try running: <code>ollama run llama3.2:1b</code>
                <br />
                <span className="cors-tip">Note: If you see CORS errors, run with <code>$env:OLLAMA_ORIGINS="*"; ollama serve</code></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="input-area glass">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message for Gemma..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="send-btn">
            {isLoading ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
          </button>
        </form>
      </main>

      <div className="background-decoration">
        <div className="blob"></div>
        <div className="blob secondary"></div>
      </div>
    </div>
  );
}

export default App;
