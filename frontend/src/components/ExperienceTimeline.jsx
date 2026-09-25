import { Building2, AlertCircle } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return month ? `${months[parseInt(month) - 1]} ${year}` : year;
}

export default function ExperienceTimeline({ experience = [], gaps = [] }) {
  // Build a merged timeline of experience + gaps
  const allEvents = [];

  const sorted = [...experience].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  sorted.forEach((exp, i) => {
    allEvents.push({ type: 'job', data: exp });
    // Check if there's a gap after this job
    if (i < sorted.length - 1) {
      const relevantGap = gaps.find(g => {
        const gapStart = g.start;
        const expEnd = exp.end;
        return gapStart >= expEnd.slice(0, 7) && gapStart <= sorted[i + 1].start.slice(0, 7);
      });
      if (relevantGap) {
        allEvents.push({ type: 'gap', data: relevantGap });
      }
    }
  });

  if (allEvents.length === 0) {
    return <p className="text-sm text-[#6F706B] py-4">No experience entries found in resume.</p>;
  }

  return (
    <div className="py-2">
      <div className="relative border-l border-[#DDDCD5] ml-3.5 pl-6 space-y-6">
        {allEvents.map((event, i) => (
          <div key={i} className="relative group animate-fade-in">
            {event.type === 'job' ? (
              <JobEntry exp={event.data} />
            ) : (
              <GapEntry gap={event.data} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function JobEntry({ exp }) {
  return (
    <div>
      {/* Node on vertical timeline */}
      <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#6B705C] border-2 border-white ring-1 ring-[#DDDCD5]" />

      <div className="bg-white p-4 rounded-lg border border-[#E8E6DF] transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h3 className="text-sm font-bold text-[#20211F]">{exp.title}</h3>
            <p className="text-xs font-medium text-[#6F706B]">{exp.company}</p>
          </div>
          <span className="text-xs font-mono text-[#92928B] flex-shrink-0">
            {formatDate(exp.start)} — {formatDate(exp.end)}
          </span>
        </div>

        {exp.responsibilities?.length > 0 && (
          <ul className="mt-3 space-y-1.5 pt-3 border-t border-[#F2F0EB]">
            {exp.responsibilities.map((r, i) => (
              <li key={i} className="text-xs text-[#20211F] leading-relaxed flex items-start gap-2">
                <span className="text-[#92928B] mt-1">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function GapEntry({ gap }) {
  return (
    <div>
      {/* Node on vertical timeline for gap */}
      <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#A4773D] border-2 border-white ring-1 ring-[#F0E4D2]" />

      <div className="p-4 rounded-lg bg-[#FAF6EE] border border-[#F0E4D2]">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#A4773D]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A4773D]">
              Review Required
            </span>
          </div>
          <span className="text-xs font-mono font-medium text-[#A4773D]">
            {formatDate(gap.start)} — {formatDate(gap.end)}
          </span>
        </div>
        <p className="text-xs text-[#6F706B] leading-relaxed">
          {gap.description || 'The resume does not explain this period.'}
        </p>
      </div>
    </div>
  );
}
