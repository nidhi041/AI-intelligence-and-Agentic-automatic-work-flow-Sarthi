const SUGGESTIONS = [
  { id: 1, text: 'Does this candidate have experience with cloud deployments?' },
  { id: 2, text: 'Are there any unexplained employment gaps?' },
  { id: 3, text: 'What backend technologies has the candidate used?' },
  { id: 4, text: 'Does the resume mention AWS experience?' },
  { id: 5, text: 'What was the candidate doing during the employment gap?' },
];

export default function SuggestedQuestions({ onSelect, compact = false }) {
  const shown = compact ? SUGGESTIONS.slice(0, 3) : SUGGESTIONS;
  return (
    <div className={compact ? 'mb-3' : 'py-2'}>
      <p className="text-xs font-semibold text-[#92928B] uppercase tracking-wider mb-2.5">
        Suggested Inquiries
      </p>
      <div className="flex flex-col gap-1.5">
        {shown.map((q) => (
          <button
            key={q.id}
            onClick={() => onSelect(q.text)}
            className="text-left px-3.5 py-2.5 rounded-lg border border-[#E8E6DF] bg-[#FAF9F5] hover:bg-white hover:border-[#6B705C] transition-colors duration-150 text-xs sm:text-sm text-[#20211F] flex items-center justify-between group"
            id={`suggestion-${q.id}`}
          >
            <span>{q.text}</span>
            <span className="text-xs text-[#92928B] group-hover:text-[#6B705C] font-mono ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Ask →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
