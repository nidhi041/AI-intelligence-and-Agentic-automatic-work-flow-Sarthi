import { Quote, FileText } from 'lucide-react';

export default function EvidenceCard({ evidence, source }) {
  const noEvidence = evidence?.includes('No supporting') || !evidence;

  return (
    <div className="mt-3 pt-3 border-t border-[#E8E6DF] space-y-2">
      {/* Evidence section */}
      <div>
        <p className="text-[11px] font-semibold text-[#92928B] uppercase tracking-wider mb-1">
          Evidence
        </p>
        <p className={`text-xs leading-relaxed italic ${noEvidence ? 'text-[#92928B]' : 'text-[#20211F] bg-[#FAF9F5] p-2.5 rounded border border-[#E8E6DF]'}`}>
          {evidence || 'No supporting citation found in the supplied resume.'}
        </p>
      </div>

      {/* Source citation */}
      {source && source !== 'N/A' && (
        <div className="pt-2 border-t border-[#F2F0EB] flex items-center gap-1.5 text-xs text-[#6F706B]">
          <span className="text-[11px] font-semibold text-[#92928B] uppercase tracking-wider">Source:</span>
          <span className="font-medium text-[#20211F]">{source}</span>
        </div>
      )}
    </div>
  );
}
