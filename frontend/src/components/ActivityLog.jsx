import { Clock } from 'lucide-react';

export default function ActivityLog({ events = [] }) {
  if (events.length === 0) {
    return (
      <div className="card text-center py-12">
        <Clock className="w-6 h-6 text-[#92928B] mx-auto mb-2" />
        <p className="text-sm font-medium text-[#20211F]">No activity logged yet</p>
        <p className="text-xs text-[#6F706B] mt-0.5">Workspace actions and agent progress will appear chronologically here.</p>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E8E6DF]">
        <div>
          <h2 className="text-base font-semibold text-[#20211F]">Activity Log</h2>
          <p className="text-xs text-[#6F706B]">Chronological record of candidate analysis & AI workflow events</p>
        </div>
        <span className="text-xs font-mono text-[#92928B] px-2 py-0.5 bg-[#FAF9F5] border border-[#E8E6DF] rounded">
          {events.length} event{events.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="relative border-l border-[#DDDCD5] ml-3 pl-4 space-y-4 max-h-[500px] overflow-y-auto pr-2 py-1">
        {[...events].reverse().map((event) => (
          <div key={event.id} className="relative group text-xs animate-slide-in">
            {/* Timeline node */}
            <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#6B705C] border-2 border-white ring-1 ring-[#DDDCD5]" />

            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-[#20211F] text-sm leading-tight">
                {event.description}
              </p>
              <span className="font-mono text-[11px] text-[#92928B] flex-shrink-0">
                {event.timestamp}
              </span>
            </div>

            {event.detail && (
              <p className="text-[#6F706B] mt-0.5 font-mono text-[11px] truncate">
                {event.detail}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
