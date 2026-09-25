import { LayoutDashboard, User, MessageSquare, ClipboardList, Activity, Briefcase } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'candidate', label: 'Candidate', icon: User },
  { id: 'qa', label: 'AI Q&A', icon: MessageSquare },
  { id: 'evaluation', label: 'Evaluation', icon: ClipboardList },
  { id: 'activity', label: 'Activity', icon: Activity },
];

export default function Navbar({ activeTab, onTabChange, isDemoMode }) {
  return (
    <header className="bg-white border-b border-[#DDDCD5] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-[#F2F3EE] border border-[#DDDCD5] flex items-center justify-center text-[#6B705C]">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#20211F] tracking-tight">AI Candidate Intelligence</span>
                {isDemoMode && (
                  <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FAF6EE] text-[#A4773D] border border-[#F0E4D2]">
                    Demo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6F706B] leading-none hidden sm:block">AI-powered recruitment assistant</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#EAE8E1] text-[#20211F] font-semibold'
                      : 'text-[#6F706B] hover:text-[#20211F] hover:bg-[#F2F0EB]'
                  }`}
                  id={`nav-${id}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#6B705C]' : 'text-[#92928B]'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
