import { useState } from 'react';
import { ChevronDown, Loader2, Play } from 'lucide-react';
import AgentProgress from './AgentProgress';

const ROLES = [
  'Backend Developer',
  'Full Stack Developer',
  'Software Engineer',
  'Data Analyst',
  'DevOps Engineer',
];

export default function HiringAgent({ onRun, isRunning, agentSteps }) {
  const [role, setRole] = useState('Backend Developer');

  const handleRun = () => {
    if (!isRunning) onRun(role);
  };

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="pb-4 border-b border-[#E8E6DF]">
        <h2 className="text-base font-semibold text-[#20211F]">AI Hiring Agent</h2>
        <p className="text-xs text-[#6F706B] mt-0.5">Turn candidate information into a structured HR evaluation.</p>
      </div>

      {/* Target Role Selector */}
      <div>
        <label className="block text-xs font-semibold text-[#92928B] uppercase tracking-wider mb-2">
          Target Role
        </label>
        <div className="relative">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isRunning}
            className="input-field pr-10 appearance-none cursor-pointer font-medium"
            id="role-select"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#92928B] pointer-events-none" />
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={handleRun}
        disabled={isRunning}
        className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide"
        id="run-evaluation-btn"
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Executing Agentic Pipeline…</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Evaluation</span>
          </>
        )}
      </button>

      {/* Agent Progress Timeline */}
      {agentSteps.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-semibold text-[#92928B] uppercase tracking-wider mb-2">
            Workflow Execution
          </p>
          <AgentProgress steps={agentSteps} isRunning={isRunning} />
        </div>
      )}
    </div>
  );
}
