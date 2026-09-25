import { useState } from 'react';
import { Download, FileText, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import DispatchModal from './DispatchModal';

export default function EvaluationCard({ evaluation, pdfFile, dispatch, onDownloadJson, onSendToHR, candidateName }) {
  const [showModal, setShowModal] = useState(false);

  if (!evaluation) return null;

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DDDCD5]">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#92928B] uppercase block">Official Assessment</span>
          <h2 className="text-base font-bold tracking-wider uppercase text-[#20211F] mt-0.5">
            Corporate Hiring Evaluation
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6F706B]">Confidence:</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F2F3EE] text-[#6B705C] border border-[#E3E6DC]">
            {evaluation.confidence || 'Verified'}
          </span>
        </div>
      </div>

      {/* Structured HR Document Rows */}
      <div className="border border-[#DDDCD5] rounded-lg divide-y divide-[#E8E6DF] text-xs bg-white">
        {/* Candidate */}
        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 bg-[#FAF9F5]">
          <span className="font-semibold text-[#92928B] uppercase tracking-wider">Candidate</span>
          <span className="sm:col-span-2 font-bold text-[#20211F] text-sm">{candidateName || 'Assessed Candidate'}</span>
        </div>

        {/* Recommended Role */}
        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
          <span className="font-semibold text-[#92928B] uppercase tracking-wider">Recommended Role</span>
          <span className="sm:col-span-2 font-semibold text-[#20211F]">{evaluation.recommended_role}</span>
        </div>

        {/* Primary Skillset */}
        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
          <span className="font-semibold text-[#92928B] uppercase tracking-wider">Primary Skillset</span>
          <div className="sm:col-span-2 flex flex-wrap gap-1.5">
            {evaluation.primary_skillset?.map((skill) => (
              <span key={skill} className="skill-tag">{skill}</span>
            )) || <span className="text-[#92928B]">N/A</span>}
          </div>
        </div>

        {/* Years of Experience */}
        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
          <span className="font-semibold text-[#92928B] uppercase tracking-wider">Years of Experience</span>
          <span className="sm:col-span-2 font-medium text-[#20211F]">{evaluation.years_of_experience} years documented</span>
        </div>

        {/* Cloud Experience */}
        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
          <span className="font-semibold text-[#92928B] uppercase tracking-wider">Cloud Experience</span>
          <span className="sm:col-span-2 text-[#20211F] leading-relaxed">{evaluation.cloud_experience || 'None documented'}</span>
        </div>

        {/* Employment Gaps */}
        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
          <span className="font-semibold text-[#92928B] uppercase tracking-wider">Employment Gaps</span>
          <div className="sm:col-span-2 space-y-1">
            {evaluation.employment_gaps?.length > 0 ? (
              evaluation.employment_gaps.map((gap, i) => (
                <div key={i} className="text-[#A4773D] bg-[#FAF6EE] p-2 rounded border border-[#F0E4D2]">
                  {gap}
                </div>
              ))
            ) : (
              <span className="text-[#657A63]">No unexplained gaps detected</span>
            )}
          </div>
        </div>

        {/* Review Items / Red Flags */}
        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
          <span className="font-semibold text-[#92928B] uppercase tracking-wider">Review Items</span>
          <div className="sm:col-span-2 space-y-1">
            {evaluation.red_flags?.length > 0 ? (
              evaluation.red_flags.map((flag, i) => (
                <div key={i} className="text-[#A85C55] bg-[#FDF4F3] p-2 rounded border border-[#F7DFDC]">
                  {flag}
                </div>
              ))
            ) : (
              <span className="text-[#6F706B]">No critical review items flag raised</span>
            )}
          </div>
        </div>

        {/* Evaluation Summary / Reason */}
        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
          <span className="font-semibold text-[#92928B] uppercase tracking-wider">Evaluation Summary</span>
          <span className="sm:col-span-2 text-[#20211F] leading-relaxed">
            {evaluation.recommendation_reason || 'Candidate meets requirements for structured review.'}
          </span>
        </div>
      </div>

      {/* Dispatch confirmation banner if simulated */}
      {dispatch?.status === 'simulated' && (
        <div className="flex items-center gap-2.5 p-3 bg-[#F1F5F0] border border-[#E1EADF] rounded-lg text-xs font-medium text-[#657A63] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>HR dispatch simulation completed for recipient: {dispatch.recipient}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        {pdfFile && (
          <a
            href={api.getDownloadUrl(pdfFile)}
            download={pdfFile}
            className="btn-secondary text-xs flex items-center gap-1.5"
            id="download-pdf-btn"
          >
            <Download className="w-3.5 h-3.5 text-[#6F706B]" />
            <span>Download PDF</span>
          </a>
        )}

        <button
          onClick={onDownloadJson}
          className="btn-secondary text-xs flex items-center gap-1.5"
          id="download-json-btn"
        >
          <FileText className="w-3.5 h-3.5 text-[#6F706B]" />
          <span>Download JSON</span>
        </button>

        <button
          onClick={() => setShowModal(true)}
          className="btn-charcoal text-xs flex items-center gap-1.5 sm:ml-auto"
          id="send-to-hr-btn"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Send to HR</span>
        </button>
      </div>

      {showModal && (
        <DispatchModal
          dispatch={dispatch}
          candidateName={candidateName}
          onConfirm={() => {
            onSendToHR();
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
