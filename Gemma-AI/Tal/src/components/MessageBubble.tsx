import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content }) => {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[80%] md:max-w-[70%] items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser ? 'bg-indigo-600' : 'bg-emerald-600'}
          shadow-lg backdrop-blur-md
        `}>
          {isUser ? <User size={16} className="text-white" /> : <Sparkles size={16} className="text-white" />}
        </div>

        {/* Bubble */}
        <div className={`
          p-4 rounded-2xl shadow-xl backdrop-blur-sm border
          ${isUser 
            ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-50 rounded-tr-none' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-50 rounded-tl-none'}
        `}>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
