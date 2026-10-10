import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  FileText,
  User,
  Bot,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { ChatMessage, MedicalDocument } from '../types/medical.ts';
import { sendChatMessage } from '../services/api.ts';
import { FormattedAIExplanation } from '../components/FormattedAIExplanation.tsx';

interface AskLockMyHealthViewProps {
  documents: MedicalDocument[];
  onSelectDocument: (doc: MedicalDocument) => void;
}

export const AskLockMyHealthView: React.FC<AskLockMyHealthViewProps> = ({
  documents,
  onSelectDocument
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello, I'm **Ask LockMyHealth**, your grounded medical record assistant.\n\nI can help you review and understand your uploaded prescriptions, compare lab trends over time, and identify questions to ask your doctor.\n\n*Note: I explain documented medical records in your vault; I do not diagnose conditions or prescribe medications.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const suggestedPrompts = [
    'What did my last prescription say?',
    'Which medicines appear in my uploaded records?',
    'Compare my last two recorded HbA1c results.',
    'When is my next recorded follow-up?',
    'What questions could I ask my doctor about this report?'
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsSending(true);

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.sender as 'user' | 'assistant',
        text: m.text
      }));

      const res = await sendChatMessage(text, historyPayload);

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referencedDocuments: res.referencedDocuments
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 2}`,
          sender: 'assistant',
          text: 'I encountered an error retrieving your records. Please ensure your server connection is active.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'msg-reset',
        sender: 'assistant',
        text: `Conversation cleared. What would you like to review from your medical records today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs shadow-teal-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900">Ask LockMyHealth</h1>
              <span className="text-[10px] font-bold uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                Grounded Gemini RAG
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Source-grounded answers citing your uploaded documents and dates
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Session</span>
        </button>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser ? 'bg-slate-800 text-white' : 'bg-teal-600 text-white shadow-2xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-teal-600 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {isUser ? msg.text : <FormattedAIExplanation content={msg.text} />}
                </div>

                {/* Cited documents pills */}
                {msg.referencedDocuments && msg.referencedDocuments.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                      Referenced Vault Records
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.referencedDocuments.map((rd, i) => {
                        const matched = documents.find(d => d.id === rd.id);
                        return (
                          <button
                            key={i}
                            onClick={() => matched && onSelectDocument(matched)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-teal-300 text-teal-800 text-[11px] font-semibold hover:bg-teal-100 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-teal-600" />
                            <span>{rd.title} ({rd.date})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className={`text-[10px] text-slate-400 ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center space-x-2 text-xs text-teal-700 bg-teal-50 p-3 rounded-xl border border-teal-200 max-w-sm">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Consulting your uploaded records & synthesizing grounded response...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompts row */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          Suggestions:
        </span>
        {suggestedPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-full text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 text-slate-600 whitespace-nowrap transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-2">
        <input
          type="text"
          placeholder="Ask a question about your prescriptions, lab results, or next doctor visit..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={isSending}
          className="flex-1 px-3 py-2 text-xs sm:text-sm focus:outline-none text-slate-900 bg-transparent"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isSending}
          className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Safety Notice */}
      <div className="text-center text-[11px] text-slate-400">
        LockMyHealth explanations reflect documented vault records. For medical emergencies, call 911 immediately.
      </div>
    </div>
  );
};
