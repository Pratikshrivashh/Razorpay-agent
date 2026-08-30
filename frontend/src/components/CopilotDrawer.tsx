import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, ArrowRight } from 'lucide-react';
import { sendCopilotChat } from '../services/api';
import { CopilotMessage, RiskFlag, Merchant } from '../types';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFlag: RiskFlag | null;
  merchant: Merchant | null;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  selectedFlag,
  merchant
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: 'Hello! I am **Sentinel Copilot**, powered by Google Gemini. I check incoming merchant webhooks against Sentinel\'s **12 Distinct Mule Signals** across 4 categories: Fractional Pricing (.99/.98), Rapid USDT P2P Laundering, Orphaned VPAs, and Nocturnal Spikes.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Explain the 12 Mule Signals across 4 categories',
        'How does Fractional .99 pricing detection work?',
        'Explain USDT P2P Crypto Off-Ramp signature'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedFlag) {
      setMessages((prev) => [
        ...prev,
        {
          id: `context_${selectedFlag.id}`,
          sender: 'assistant',
          text: `Context updated: Currently inspecting **₹${selectedFlag.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}** payment from \`${selectedFlag.payer_vpa}\` (Score: **${selectedFlag.confidence_score}/100**). Ask me anything about this transaction or its risk signals.`,
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
        text: `Error connecting to Gemini Copilot: ${e.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-white border-l border-[#E2E8F0] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4648d4] text-white flex items-center justify-center font-bold shadow-2xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1b1b23] flex items-center gap-1.5">
              <span>Sentinel Copilot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-[11px] text-[#464554]">
              Gemini 3.6 Flash • Razorpay Risk Assistant
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
                  <span className="text-[10px] font-semibold text-slate-400">Risk Analyst</span>
                ) : (
                  <span className="text-[10px] font-semibold text-[#4648d4] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini Sentinel
                  </span>
                )}
                <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[92%] shadow-2xs whitespace-pre-wrap ${
                  isUser
                    ? 'bg-[#4648d4] text-white rounded-tr-xs'
                    : 'bg-slate-50 border border-[#E2E8F0] text-[#1b1b23] rounded-tl-xs'
                }`}
              >
                {msg.text}
              </div>

              {/* Action Chips */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[92%]">
                  {msg.suggestedActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(action)}
                      className="text-[11px] bg-white hover:bg-indigo-50 hover:text-[#4648d4] text-slate-600 px-2.5 py-1 rounded-full border border-[#E2E8F0] transition-colors flex items-center gap-1 text-left"
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
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-[#E2E8F0] text-xs text-[#464554] max-w-[75%] animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-[#4648d4] animate-spin" />
            <span>Gemini analyzing merchant ledger & signals...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3.5 border-t border-[#E2E8F0] bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about risk signals, mitigation, or policies..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow px-3.5 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs text-[#1b1b23] placeholder:text-[#767586] focus:outline-none focus:border-[#4648d4] transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2 bg-[#4648d4] hover:bg-[#3739B0] text-white rounded-xl transition-colors disabled:opacity-40 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
