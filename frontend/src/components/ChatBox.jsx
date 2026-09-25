import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2, FileText, User } from 'lucide-react';
import EvidenceCard from './EvidenceCard';
import SuggestedQuestions from './SuggestedQuestions';

export default function ChatBox({ onAsk, isLoading, messages }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onAsk(input.trim());
    setInput('');
  };

  const handleSuggestion = (q) => {
    if (!isLoading) onAsk(q);
  };

  return (
    <div className="card flex flex-col min-h-[560px]">
      {/* Editorial Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8E6DF]">
        <div>
          <h2 className="text-base font-semibold text-[#20211F]">Ask about this candidate</h2>
          <p className="text-xs text-[#6F706B] mt-0.5">Answers are grounded only in the supplied resume.</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#F2F3EE] border border-[#E3E6DC]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6B705C]" />
          <span className="text-[11px] font-medium text-[#6B705C]">Grounded Assistant</span>
        </div>
      </div>

      {/* Main Document / Interaction Log */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 mb-4">
        {messages.length === 0 ? (
          <SuggestedQuestions onSelect={handleSuggestion} />
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="bg-white rounded-lg border border-[#DDDCD5] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4 animate-fade-in">
              {/* Recruiter Question Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E8E6DF]">
                <div>
                  <p className="text-[11px] font-semibold text-[#92928B] uppercase tracking-wider mb-0.5">Recruiter Inquiry</p>
                  <p className="text-sm font-semibold text-[#20211F]">{msg.question}</p>
                </div>
                <span className="text-[11px] text-[#92928B] font-mono">Q{i + 1}</span>
              </div>

              {/* Document-style Answer */}
              <div>
                <p className="text-[11px] font-semibold text-[#92928B] uppercase tracking-wider mb-1.5">Answer</p>
                <p className="text-sm text-[#20211F] leading-relaxed">
                  {msg.answer}
                </p>
              </div>

              {/* Evidence Section with dividers */}
              {msg.evidence && (
                <EvidenceCard evidence={msg.evidence} source={msg.source} />
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="p-4 rounded-lg border border-[#DDDCD5] bg-[#FAF9F5] flex items-center gap-3 animate-fade-in">
            <Loader2 className="w-4 h-4 text-[#6B705C] animate-spin flex-shrink-0" />
            <p className="text-xs font-medium text-[#6F706B]">Cross-referencing resume text and preparing grounded response…</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions compact if conversation ongoing */}
      {messages.length > 0 && messages.length < 3 && (
        <SuggestedQuestions onSelect={handleSuggestion} compact />
      )}

      {/* Inquire Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-[#E8E6DF]">
        <input
          id="qa-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question grounded in this resume…"
          className="input-field flex-1 text-sm py-2.5"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="btn-primary px-4 py-2 flex items-center gap-1.5 text-xs font-semibold"
          id="qa-submit-btn"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <span>Inquire</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
