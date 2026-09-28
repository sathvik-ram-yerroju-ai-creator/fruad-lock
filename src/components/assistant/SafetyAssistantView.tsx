'use client';

import React, { useState, useEffect } from 'react';
import { Send, Shield, Sparkles, AlertCircle, RefreshCw, Bot, User } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { generateSafetyAssistantResponse, ChatMessage } from '@/lib/ai/safetyAssistant';
import { getOrCreateChatConversation, saveChatMessage, getChatMessages } from '@/lib/supabase';

interface SafetyAssistantViewProps {
  initialPrompt?: string;
}

export function SafetyAssistantView({ initialPrompt = '' }: SafetyAssistantViewProps) {
  const { t, locale } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your Fraud Lock Safety Assistant.\n\nAsk me about any suspicious SMS, payment request, phone call, or emergency recovery step.\n\n🛡️ Notice: I will never ask for your passwords, PINs, or OTPs. Please do not share them here or with anyone else.`,
      timestamp: 'Just now',
    },
  ]);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputQuery, setInputQuery] = useState(initialPrompt);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    async function initChat() {
      try {
        const convId = await getOrCreateChatConversation('Safety Guidance Session');
        setConversationId(convId);
        const history = await getChatMessages(convId);
        if (history && history.length > 0) {
          const loaded: ChatMessage[] = history.map((m) => ({
            id: m.id,
            sender: m.sender as any,
            text: m.text,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            riskWarning: m.risk_warning,
          }));
          setMessages((prev) => [prev[0], ...loaded]);
        }
      } catch (e) {
        console.warn('Chat init note:', e);
      }
    }
    initChat();
  }, []);

  const handleSend = async (queryToSend?: string) => {
    const query = queryToSend || inputQuery;
    if (!query.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    if (conversationId) {
      saveChatMessage(conversationId, { sender: 'user', text: query }).catch(() => {});
    }

    try {
      const response = await generateSafetyAssistantResponse(query, locale);
      const assistantMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        riskWarning: response.riskWarning,
        suggestedActions: response.suggestedActions,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (conversationId) {
        saveChatMessage(conversationId, {
          sender: 'assistant',
          text: response.text,
          riskWarning: response.riskWarning,
        }).catch(() => {});
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `msg_fallback_${Date.now()}`,
        sender: 'assistant',
        text: t.assistant.uncertaintyResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto flex flex-col h-[75vh]">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <span>{t.assistant.title}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {t.assistant.subtitle}
        </p>
      </div>

      {/* Sensitive Credentials Warning */}
      <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center gap-2">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>{t.assistant.warningSensitive}</span>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-2xl border border-cyan-500/20 bg-[#0F1A30]/60">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-start gap-2 max-w-[88%]">
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
                  <Shield className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Warning if present */}
                {m.riskWarning && (
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{m.riskWarning}</span>
                  </div>
                )}

                <p className="whitespace-pre-line">{m.text}</p>

                {/* Suggested actions list */}
                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px] text-cyan-300">
                    <span className="font-semibold text-slate-400 block">Recommended Safe Actions:</span>
                    {m.suggestedActions.map((act, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[9px] font-mono text-right ${
                    m.sender === 'user' ? 'text-cyan-200' : 'text-slate-500'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Consulting safety knowledge base...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
        <button
          onClick={() => handleSend(t.assistant.suggested1)}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 whitespace-nowrap transition-colors"
        >
          📦 Courier fee parcel?
        </button>
        <button
          onClick={() => handleSend(t.assistant.suggested2)}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 whitespace-nowrap transition-colors"
        >
          ⚡ Electricity cut tonight?
        </button>
        <button
          onClick={() => handleSend(t.assistant.suggested3)}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 whitespace-nowrap transition-colors"
        >
          📱 AnyDesk for banking?
        </button>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-[#0F1A30] border border-cyan-500/30 rounded-2xl p-2 focus-within:border-cyan-400/80 transition-all shadow-lg"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={t.assistant.placeholder}
          className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isTyping}
          className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-colors shadow-[0_0_12px_rgba(0,240,255,0.3)] shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
