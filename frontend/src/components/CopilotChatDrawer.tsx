import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { sendCopilotChat } from '../services/api';
import { CopilotMessage, RiskFlag, Merchant } from '../types';

interface CopilotChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFlag: RiskFlag | null;
  merchant: Merchant | null;
}

export const CopilotChatDrawer: React.FC<CopilotChatDrawerProps> = ({
  isOpen,
  onClose,
  selectedFlag,
  merchant
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: 'Hello! I am **Sentinel Copilot**, your AI Risk Assistant. I can explain flagged mule patterns, analyze merchant transaction baselines, and help formulate human review decisions.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Why was this payment flagged?',
        'Explain the false-positive guard',
        'What is a Task-App mule pattern?'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When selected flag changes, add a context prompt
  useEffect(() => {
    if (selectedFlag) {
      setMessages((prev) => [
        ...prev,
        {
          id: `context_${selectedFlag.id}`,
          sender: 'assistant',
          text: `Active context set to **₹${selectedFlag.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}** payment from \`${selectedFlag.payer_vpa}\` (Score: **${selectedFlag.confidence_score}/100**). Ask me anything about this transaction or its risk signals.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: [
            'Explain triggered signals',
            'Check mitigating factors',
            'What action do you recommend?'
          ]
        }
      ]);
    }
  }, [selectedFlag]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;

    const userMsg: CopilotMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await sendCopilotChat(text, selectedFlag?.id, merchant?.id);
      const assistantMsg: CopilotMessage = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: res.suggested_actions
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      const errorMsg: CopilotMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Sorry, I encountered an issue: ${e.message}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-surface border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-surface-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-2xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Sentinel Copilot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-[11px] text-slate-500">
              Gemini AI • Razorpay Risk Assistant
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {isUser ? (
                  <span className="text-[10px] font-semibold text-slate-400">Analyst</span>
                ) : (
                  <span className="text-[10px] font-semibold text-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Sentinel AI
                  </span>
                )}
                <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
              </div>

              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[90%] shadow-2xs whitespace-pre-wrap ${
                  isUser
                    ? 'bg-primary text-white rounded-tr-xs'
                    : 'bg-surface-subtle border border-border text-slate-800 rounded-tl-xs'
                }`}
              >
                {msg.text}
              </div>

              {/* Suggested Follow-up Actions */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.suggestedActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(action)}
                      className="text-[11px] bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 transition-colors flex items-center gap-1 text-left"
                    >
                      <ArrowRight className="w-2.5 h-2.5" />
                      <span>{action}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2 p-3 bg-surface-subtle rounded-2xl border border-border text-xs text-slate-500 max-w-[70%] animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
            <span>Analyzing merchant baseline & signals...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3.5 border-t border-border bg-surface">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about risk patterns, signals, or policies..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow px-3.5 py-2 bg-surface-subtle border border-border rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors disabled:opacity-40 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
