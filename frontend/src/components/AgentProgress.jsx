import { Check, Loader2 } from 'lucide-react';

const WORKFLOW_STEPS = [
  { id: '01', label: 'Resume analyzed' },
  { id: '02', label: 'Candidate information extracted' },
  { id: '03', label: 'Experience calculated' },
  { id: '04', label: 'Employment gaps checked' },
  { id: '05', label: 'Skills mapped to role' },
  { id: '06', label: 'Evaluation generated' },
  { id: '07', label: 'PDF created' },
  { id: '08', label: 'HR dispatch prepared' },
];

export default function AgentProgress({ steps = [], isRunning = false }) {
  // Normalize count to steps length
  const completedCount = Math.min(steps.length, WORKFLOW_STEPS.length);

  return (
    <div className="bg-[#FAF9F5] rounded-lg border border-[#E8E6DF] p-4 space-y-2">
      {WORKFLOW_STEPS.map((step, i) => {
        const done = i < completedCount;
        const active = isRunning && i === completedCount;
        const pending = !done && !active;

        return (
          <div
            key={step.id}
            className={`flex items-center justify-between py-1 px-2 rounded transition-colors duration-150 text-xs ${
              done
                ? 'text-[#20211F]'
                : active
                ? 'bg-white text-[#20211F] font-medium border border-[#DDDCD5]'
                : 'text-[#92928B]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] text-[#92928B]">{step.id}</span>
              <span>{step.label}</span>
            </div>

            <div className="flex-shrink-0">
              {done ? (
                <Check className="w-3.5 h-3.5 text-[#657A63]" />
              ) : active ? (
                <Loader2 className="w-3.5 h-3.5 text-[#6B705C] animate-spin" />
              ) : (
                <span className="w-3.5 h-3.5 block text-center text-[#DDDCD5]">•</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
