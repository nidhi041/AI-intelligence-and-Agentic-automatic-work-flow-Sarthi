import { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import Navbar from './components/Navbar';
import UploadResume from './components/UploadResume';
import CandidateProfile from './components/CandidateProfile';
import ChatBox from './components/ChatBox';
import HiringAgent from './components/HiringAgent';
import EvaluationCard from './components/EvaluationCard';
import ActivityLog from './components/ActivityLog';
import { AlertCircle, User, MessageSquare, ClipboardList, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [candidate, setCandidate] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [totalExp, setTotalExp] = useState(0);
  const [messages, setMessages] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [agentSteps, setAgentSteps] = useState([]);
  const [agentRunning, setAgentRunning] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [dispatch, setDispatch] = useState(null);
  const [activityEvents, setActivityEvents] = useState([]);
  const [error, setError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Poll activity log
  const refreshActivity = useCallback(async () => {
    try {
      const data = await api.getActivity();
      setActivityEvents(data.events || []);
    } catch { /* silent */ }
  }, []);

  // Check status on mount
  useEffect(() => {
    api.getStatus()
      .then((s) => setIsDemoMode(s.demo_mode))
      .catch(() => {});
    refreshActivity();
  }, [refreshActivity]);

  const handleCandidateData = (data) => {
    setCandidate(data.candidate);
    setGaps(data.employment_gaps || []);
    setTotalExp(data.total_experience_years || 0);
    setIsDemoMode(data.demo_mode ?? true);
    setMessages([]);
    setAgentSteps([]);
    setEvaluation(null);
    setPdfFile(null);
    setDispatch(null);
    setError('');
    refreshActivity();
  };

  const handleUpload = async (file) => {
    setUploadLoading(true);
    try {
      const data = await api.uploadResume(file);
      handleCandidateData(data);
      setActiveTab('candidate');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setUploadLoading(true);
    try {
      const data = await api.loadDemo();
      handleCandidateData(data);
      setActiveTab('candidate');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAsk = async (question) => {
    if (!candidate) {
      setError('Please load a candidate resume first.');
      return;
    }
    setQaLoading(true);
    try {
      const resp = await api.ask(question);
      setMessages((prev) => [...prev, resp]);
      refreshActivity();
    } catch (err) {
      setError(err.message);
    } finally {
      setQaLoading(false);
    }
  };

  const handleRunAgent = async (role) => {
    if (!candidate) {
      setError('Please load a candidate resume first.');
      return;
    }
    setAgentRunning(true);
    setAgentSteps([]);
    setEvaluation(null);
    setPdfFile(null);
    setDispatch(null);

    // Simulate step-by-step progress while the backend runs
    const stepInterval = setInterval(() => {
      setAgentSteps((prev) => {
        if (prev.length < 8) return [...prev, { done: true }];
        return prev;
      });
    }, 450);

    try {
      const data = await api.evaluateAndDispatch(role);
      clearInterval(stepInterval);
      setAgentSteps(Array(8).fill({ done: true }));
      setEvaluation(data.evaluation);
      setPdfFile(data.pdf_file);
      setDispatch(data.dispatch);
      refreshActivity();

      // Save JSON for download
      await api.saveJson(role).catch(() => {});
      setActiveTab('evaluation');
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message);
    } finally {
      setAgentRunning(false);
    }
  };

  const handleDownloadJson = () => {
    window.open(api.getDownloadUrl('candidate_evaluation.json'), '_blank');
  };

  const handleSendToHR = async () => {
    refreshActivity();
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#20211F]">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} isDemoMode={isDemoMode} />

      {/* Global Error Banner */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-center gap-2 p-3 bg-[#FDF4F3] border border-[#F7DFDC] rounded-lg text-[#A85C55] text-xs font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ===================== DASHBOARD TAB ===================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Header / Workspace Banner */}
            <div className="pb-4 border-b border-[#DDDCD5]">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-mono tracking-widest text-[#92928B] uppercase">Recruiter Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#20211F]">
                AI Candidate Intelligence
              </h1>
              <p className="text-sm text-[#6F706B] mt-1 max-w-2xl">
                Editorial workspace for candidate resume parsing, grounded recruiter Q&A, and structured multi-step hiring evaluations.
              </p>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: '01', title: 'Structured Parsing', desc: 'Extracts validated work history, skills, and education.' },
                { step: '02', title: 'Grounded Inquiries', desc: 'Answers recruiter questions strictly based on resume text.' },
                { step: '03', title: 'HR Evaluation Agent', desc: 'Generates standardized hiring assessments and PDF reports.' },
              ].map(({ step, title, desc }) => (
                <div key={title} className="p-4 bg-white rounded-lg border border-[#DDDCD5]">
                  <span className="text-[11px] font-mono text-[#92928B] uppercase block mb-1">Step {step}</span>
                  <h3 className="text-sm font-semibold text-[#20211F]">{title}</h3>
                  <p className="text-xs text-[#6F706B] mt-1 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Upload Area */}
            <UploadResume
              onUpload={handleUpload}
              onLoadDemo={handleLoadDemo}
              isLoading={uploadLoading}
            />

            {/* Active Candidate Quick Bar if loaded */}
            {candidate && (
              <div className="p-4 bg-white rounded-lg border border-[#DDDCD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-[#F2F3EE] border border-[#DDDCD5] flex items-center justify-center font-bold text-sm text-[#6B705C]">
                    {candidate.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#20211F]">{candidate.name}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#F1F5F0] text-[#657A63] border border-[#E1EADF]">
                        Loaded
                      </span>
                    </div>
                    <p className="text-xs text-[#6F706B]">{candidate.email || 'No email provided'} · {totalExp} yrs experience</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('qa')}
                    className="btn-secondary text-xs"
                  >
                    AI Q&A
                  </button>
                  <button
                    onClick={() => setActiveTab('candidate')}
                    className="btn-primary text-xs flex items-center gap-1"
                  >
                    <span>View Record</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== CANDIDATE TAB ===================== */}
        {activeTab === 'candidate' && (
          <div>
            {candidate ? (
              <CandidateProfile candidate={candidate} gaps={gaps} totalExp={totalExp} />
            ) : (
              <EmptyState
                icon={User}
                title="No candidate record loaded"
                desc="Upload a candidate resume or load the demo profile to view structured career data."
                action={() => setActiveTab('dashboard')}
                actionLabel="Go to Upload"
              />
            )}
          </div>
        )}

        {/* ===================== Q&A TAB ===================== */}
        {activeTab === 'qa' && (
          <div>
            {candidate ? (
              <ChatBox
                onAsk={handleAsk}
                isLoading={qaLoading}
                messages={messages}
              />
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No candidate selected"
                desc="Load a resume first to ask grounded recruiter questions."
                action={() => setActiveTab('dashboard')}
                actionLabel="Go to Upload"
              />
            )}
          </div>
        )}

        {/* ===================== EVALUATION TAB ===================== */}
        {activeTab === 'evaluation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <HiringAgent
              onRun={handleRunAgent}
              isRunning={agentRunning}
              agentSteps={agentSteps}
            />
            {evaluation ? (
              <EvaluationCard
                evaluation={evaluation}
                pdfFile={pdfFile}
                dispatch={dispatch}
                onDownloadJson={handleDownloadJson}
                onSendToHR={handleSendToHR}
                candidateName={candidate?.name}
              />
            ) : (
              <div className="card text-center py-16 flex flex-col items-center justify-center">
                <ClipboardList className="w-8 h-8 text-[#92928B] mb-2" />
                <p className="text-sm font-semibold text-[#20211F]">Evaluation Not Yet Run</p>
                <p className="text-xs text-[#6F706B] mt-1 max-w-xs">
                  Select a target position and execute the AI Hiring Agent to generate a standardized HR report.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===================== ACTIVITY TAB ===================== */}
        {activeTab === 'activity' && (
          <ActivityLog events={activityEvents} />
        )}
      </main>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action, actionLabel }) {
  return (
    <div className="card text-center py-16 flex flex-col items-center justify-center">
      <Icon className="w-8 h-8 text-[#92928B] mb-3" />
      <p className="text-sm font-semibold text-[#20211F]">{title}</p>
      <p className="text-xs text-[#6F706B] mt-1 max-w-sm">{desc}</p>
      <button onClick={action} className="btn-secondary text-xs mt-4">
        {actionLabel}
      </button>
    </div>
  );
}
