import { useState } from 'react';
import { Mail, MapPin, Briefcase, GraduationCap, Award, AlertCircle } from 'lucide-react';
import ExperienceTimeline from './ExperienceTimeline';

export default function CandidateProfile({ candidate, gaps = [], totalExp }) {
  const [activeTab, setActiveTab] = useState('Overview');

  if (!candidate) return null;

  const currentRole = candidate.experience?.[candidate.experience.length - 1]?.title || candidate.experience?.[0]?.title || 'Candidate';
  const currentCompany = candidate.experience?.[candidate.experience.length - 1]?.company;

  return (
    <div className="card space-y-6">
      {/* Editorial HR Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E8E6DF]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#20211F] tracking-tight">{candidate.name}</h1>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#F2F3EE] text-[#6B705C] border border-[#E3E6DC]">
              HR Record
            </span>
          </div>
          
          <p className="text-sm font-medium text-[#6F706B] mt-1">
            {currentRole} {currentCompany ? `at ${currentCompany}` : ''}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#6F706B]">
            {candidate.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#92928B]" />
                {candidate.location}
              </span>
            )}
            {candidate.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#92928B]" />
                {candidate.email}
              </span>
            )}
            {candidate.education?.[0] && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#92928B]" />
                {candidate.education[0].degree} ({candidate.education[0].institution})
              </span>
            )}
          </div>
        </div>

        {/* Experience Metric Pill */}
        <div className="sm:text-right flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0 bg-[#FAF9F5] sm:bg-transparent p-3 sm:p-0 rounded-md border border-[#E8E6DF] sm:border-0">
          <span className="text-2xl font-bold text-[#20211F] leading-tight">{totalExp}</span>
          <span className="text-xs text-[#92928B]">Years Documented Experience</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E8E6DF] gap-6 text-sm">
        {['Overview', 'Experience Timeline', 'Skills & Qualifications'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-[#20211F] font-semibold border-b-2 border-[#6B705C]'
                : 'text-[#6F706B] hover:text-[#20211F]'
            }`}
            id={`tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in pt-1">
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            {/* Summary */}
            {candidate.summary && (
              <div>
                <p className="text-xs font-semibold text-[#92928B] uppercase tracking-wider mb-2">Professional Summary</p>
                <p className="text-sm text-[#20211F] leading-relaxed bg-[#FAF9F5] p-3.5 rounded-lg border border-[#E8E6DF]">
                  {candidate.summary}
                </p>
              </div>
            )}

            {/* Employment Gap Notice if any */}
            {gaps?.length > 0 && (
              <div className="p-4 rounded-lg bg-[#FAF6EE] border border-[#F0E4D2]">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertCircle className="w-4 h-4 text-[#A4773D]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#A4773D]">
                    Review Required — {gaps.length} Unexplained Employment Period{gaps.length > 1 ? 's' : ''}
                  </span>
                </div>
                {gaps.map((gap, i) => (
                  <p key={i} className="text-xs text-[#6F706B] mt-1">
                    <span className="font-semibold text-[#20211F]">{gap.start} — {gap.end}:</span> {gap.description}
                  </p>
                ))}
              </div>
            )}

            {/* Structured 2-col overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left col: Recent Experience snapshot */}
              <div>
                <p className="text-xs font-semibold text-[#92928B] uppercase tracking-wider mb-3">Experience</p>
                <div className="space-y-3">
                  {(candidate.experience || []).slice().reverse().map((exp, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-[#E8E6DF]">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-mono text-[#92928B]">{exp.start} — {exp.end}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#20211F] mt-0.5">{exp.title}</p>
                      <p className="text-xs text-[#6F706B]">{exp.company}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right col: Skills & Certifications snapshot */}
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-[#92928B] uppercase tracking-wider mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(candidate.skills || []).map((skill) => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>

                {candidate.certifications?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#92928B] uppercase tracking-wider mb-2">Certifications</p>
                    <div className="space-y-1.5">
                      {candidate.certifications.map((cert) => (
                        <div key={cert} className="flex items-center gap-2 text-xs text-[#20211F] bg-[#FAF9F5] px-2.5 py-1.5 rounded border border-[#E8E6DF]">
                          <Award className="w-3.5 h-3.5 text-[#6B705C] flex-shrink-0" />
                          <span>{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {candidate.education?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#92928B] uppercase tracking-wider mb-2">Education</p>
                    <div className="space-y-1.5">
                      {candidate.education.map((edu, idx) => (
                        <div key={idx} className="text-xs text-[#20211F] bg-[#FAF9F5] p-2.5 rounded border border-[#E8E6DF]">
                          <p className="font-semibold">{edu.degree}</p>
                          <p className="text-[#6F706B]">{edu.institution} {edu.year ? `(${edu.year})` : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Experience Timeline' && (
          <ExperienceTimeline experience={candidate.experience} gaps={gaps} />
        )}

        {activeTab === 'Skills & Qualifications' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-[#92928B] uppercase tracking-wider mb-3">Documented Technical Skills</p>
              <div className="flex flex-wrap gap-2">
                {(candidate.skills || []).map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-[#FAF9F5] text-sm font-medium text-[#20211F] rounded border border-[#DDDCD5]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {candidate.certifications?.length > 0 && (
              <div className="pt-4 border-t border-[#E8E6DF]">
                <p className="text-xs font-semibold text-[#92928B] uppercase tracking-wider mb-3">Certifications & Accreditations</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {candidate.certifications.map((cert) => (
                    <div key={cert} className="p-3 bg-white rounded-lg border border-[#DDDCD5] flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-[#6B705C] flex-shrink-0" />
                      <span className="text-sm font-medium text-[#20211F]">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
