import { X, Mail, Paperclip, CheckCircle2, Send } from 'lucide-react';

export default function DispatchModal({ dispatch, candidateName, onConfirm, onClose }) {
  const recipient = 'hr-admissions@company.mock';
  const subject = `Candidate Evaluation — ${candidateName || 'Candidate'}`;
  const attachment = 'candidate_evaluation.pdf';
  const alreadySent = dispatch?.status === 'simulated';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-none animate-fade-in">
      <div className="bg-white rounded-lg border border-[#DDDCD5] shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E8E6DF] bg-[#FAF9F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#F2F3EE] border border-[#DDDCD5] flex items-center justify-center text-[#6B705C]">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#20211F] text-sm">HR Dispatch</h3>
              <p className="text-[11px] text-[#6F706B]">Simulate internal routing of hiring evaluation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#92928B] hover:text-[#20211F] p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <EmailField label="To" value={recipient} />
          <EmailField label="Subject" value={subject} />
          <div className="flex items-center gap-2 p-2.5 bg-[#FAF9F5] rounded border border-[#E8E6DF] text-xs">
            <Paperclip className="w-3.5 h-3.5 text-[#92928B] flex-shrink-0" />
            <span className="text-[#20211F] font-mono">{attachment}</span>
          </div>

          {/* Status */}
          {alreadySent ? (
            <div className="flex items-center gap-2 p-2.5 bg-[#F1F5F0] border border-[#E1EADF] rounded text-xs text-[#657A63]">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Dispatch simulated successfully in workspace log.</span>
            </div>
          ) : (
            <div className="p-2.5 bg-[#FAF6EE] border border-[#F0E4D2] rounded text-[11px] text-[#A4773D]">
              This is a workflow simulation. Records are registered in the activity stream.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 pt-0">
          <button onClick={onClose} className="btn-secondary text-xs">
            Close
          </button>
          {!alreadySent && (
            <button
              onClick={onConfirm}
              className="btn-primary text-xs flex items-center gap-1.5"
              id="confirm-dispatch-btn"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to HR</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmailField({ label, value }) {
  return (
    <div className="flex gap-2 items-center p-2.5 bg-[#FAF9F5] rounded border border-[#E8E6DF] text-xs">
      <span className="font-semibold text-[#92928B] uppercase tracking-wider w-14 flex-shrink-0 text-[10px]">{label}</span>
      <span className="text-[#20211F] truncate">{value}</span>
    </div>
  );
}
