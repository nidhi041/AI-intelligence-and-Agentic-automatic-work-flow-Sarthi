import { useCallback, useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Sparkles } from 'lucide-react';

export default function UploadResume({ onUpload, onLoadDemo, isLoading }) {
  const [dragging, setDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'uploading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleFile = useCallback(async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['json', 'txt'].includes(ext)) {
      setUploadStatus('error');
      setErrorMsg('Unsupported format. Please upload a JSON or TXT file.');
      return;
    }
    setUploadStatus('uploading');
    setErrorMsg('');
    try {
      await onUpload(file);
      setUploadStatus('success');
    } catch (err) {
      setUploadStatus('error');
      setErrorMsg(err.message || 'Upload failed. Please try again.');
    }
  }, [onUpload]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E8E6DF]">
        <div>
          <h2 className="text-base font-semibold text-[#20211F]">Upload Candidate Resume</h2>
          <p className="text-xs text-[#6F706B] mt-0.5">Parse structured candidate profile, experience history, and employment timeline</p>
        </div>
        <button
          onClick={onLoadDemo}
          disabled={isLoading}
          className="btn-secondary text-xs flex items-center gap-1.5 self-start sm:self-auto"
          id="load-demo-btn"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#6B705C]" />
          <span>Load Demo Candidate</span>
        </button>
      </div>

      <label
        htmlFor="resume-upload"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          block border border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-150
          ${dragging ? 'border-[#6B705C] bg-[#F2F3EE]' : 'border-[#DDDCD5] hover:border-[#6B705C] hover:bg-[#FAF9F5]'}
          ${uploadStatus === 'uploading' ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <input
          id="resume-upload"
          type="file"
          className="hidden"
          accept=".json,.txt"
          onChange={onInputChange}
          disabled={isLoading}
        />

        {uploadStatus === 'uploading' ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#DDDCD5] border-t-[#6B705C] rounded-full animate-spin" />
            <p className="text-xs font-medium text-[#6F706B]">Parsing resume records…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-9 h-9 bg-[#F7F5F0] border border-[#DDDCD5] rounded-md flex items-center justify-center text-[#6B705C]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#20211F]">
                Drag and drop resume here, or <span className="text-[#6B705C] underline underline-offset-2">browse file</span>
              </p>
              <p className="text-xs text-[#92928B] mt-1">Accepted formats: JSON, TXT (Structured Resume)</p>
            </div>
          </div>
        )}
      </label>

      {/* Format Indicators */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E8E6DF]">
        <span className="text-xs text-[#92928B] mr-1">Supported:</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-[#6F706B] bg-[#F7F5F0] border border-[#E8E6DF]">
          <FileText className="w-3 h-3 text-[#6B705C]" />
          <span>JSON Schema</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-[#6F706B] bg-[#F7F5F0] border border-[#E8E6DF]">
          <FileText className="w-3 h-3 text-[#6B705C]" />
          <span>TXT Document</span>
        </div>
      </div>

      {/* Status messages */}
      {uploadStatus === 'success' && (
        <div className="mt-4 flex items-center gap-2 text-[#657A63] bg-[#F1F5F0] border border-[#E1EADF] rounded-md p-3 animate-fade-in text-xs font-medium">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>Resume successfully parsed and indexed into workspace.</span>
        </div>
      )}
      {uploadStatus === 'error' && (
        <div className="mt-4 flex items-center gap-2 text-[#A85C55] bg-[#FDF4F3] border border-[#F7DFDC] rounded-md p-3 animate-fade-in text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
