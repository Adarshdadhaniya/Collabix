import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, UserMinus, ArrowLeft, Loader2, Target, CheckCircle, Shield, Brain, X } from 'lucide-react';
import api from '../api/axios';

export default function ProjectAdminDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [groups, setGroups] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [evaluatingGroup, setEvaluatingGroup] = useState(null);
  const [evaluationReport, setEvaluationReport] = useState(null);
  const [showEvalModal, setShowEvalModal] = useState(false);


  const fetchData = async () => {
    try {
      const [projectRes, groupsRes, unassignedRes] = await Promise.all([
        api.get(`/project-notices/${projectId}`),
        api.get(`/groups/project/${projectId}`),
        api.get(`/project-notices/${projectId}/unassigned`)
      ]);
      setProject(projectRes.data);
      setGroups(groupsRes.data);
      setUnassigned(unassignedRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const handleEvaluateGroup = async (groupId) => {
    setEvaluatingGroup(groupId);
    try {
      const res = await api.post(`/groups/${groupId}/evaluate`);
      setEvaluationReport(res.data.evaluation);
      setShowEvalModal(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to evaluate team');
    } finally {
      setEvaluatingGroup(null);
    }
  };


  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
      </Link>

      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project?.title}</h1>
            <p className="text-gray-500 max-w-2xl">{project?.description}</p>
          </div>
          <div className="text-right">
            <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-100 uppercase">
              {project?.status}
            </span>
            <p className="text-xs text-gray-400 mt-2">Policy: <span className="capitalize">{project?.leaderPolicy.replace(/_/g, ' ')}</span></p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formed Groups */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Formed Groups ({groups.length})
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {groups.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                No groups have been formed yet.
              </div>
            ) : (
              groups.map(group => {
                const isProposalFilled = group.projectTitle && group.projectDescription && group.problemStatement && group.techStack?.length > 0;
                
                return (
                  <div key={group._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col h-full">
                    <h3 className="font-bold text-gray-900 mb-2 flex justify-between">
                      {group.name}
                      <span className="text-xs font-normal text-gray-500">{group.members?.length} / {project?.maxTeamSize} members</span>
                    </h3>
                    {group.projectTitle && (
                      <p className="text-xs text-gray-600 italic mb-2 line-clamp-1 border-l-2 border-indigo-200 pl-2">{group.projectTitle}</p>
                    )}
                    <p className="text-xs text-indigo-600 font-medium mb-4 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Leader: {group.leader?.name}
                    </p>
                    <div className="space-y-2 flex-grow">
                      {group.members?.map(m => (
                        <div key={m.student?._id} className="text-xs text-gray-600 flex justify-between items-center bg-gray-50 px-2 py-1.5 rounded">
                          <span>{m.student?.name}</span>
                          <span className="text-[10px] text-gray-400">{m.student?.email}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={() => handleEvaluateGroup(group._id)}
                        disabled={!isProposalFilled || evaluatingGroup === group._id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          !isProposalFilled 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'
                        }`}
                        title={!isProposalFilled ? "Project Proposal not filled by team yet" : "Run AI Evaluation"}
                      >
                        {evaluatingGroup === group._id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</>
                        ) : (
                          <><Brain className="w-4 h-4" /> AI Evaluate</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Unassigned Students */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserMinus className="w-6 h-6 text-amber-500" />
            Unassigned Students ({unassigned.length})
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-50">
              {unassigned.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  All eligible students have joined a group!
                </div>
              ) : (
                unassigned.map(student => (
                  <div key={student._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <p className="font-bold text-sm text-gray-900">{student.name}</p>
                    <p className="text-[11px] text-gray-500">{student.profile.department} (Yr {student.profile.year} Sec {student.profile.section})</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-indigo-600 font-bold">CGPA: {student.profile.cgpa}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Evaluation Modal */}
      {showEvalModal && evaluationReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-600" />
                AI Team Evaluation
              </h2>
              <button onClick={() => setShowEvalModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Project</p>
                  <p className="text-2xl font-bold text-gray-900">{evaluationReport.project_title}</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center px-6 py-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-sm font-bold text-indigo-600 uppercase mb-1">Score</p>
                    <p className="text-3xl font-extrabold text-indigo-900">{evaluationReport.overall_score}/100</p>
                  </div>
                  <div className="text-center px-6 py-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-sm font-bold text-gray-500 uppercase mb-1">Verdict</p>
                    <p className={`text-xl font-extrabold ${
                      evaluationReport.verdict === 'ACCEPT' ? 'text-green-600' : 
                      evaluationReport.verdict === 'REJECT' ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {evaluationReport.verdict}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                  <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Team Strengths
                  </h3>
                  <ul className="space-y-3">
                    {evaluationReport.strengths?.map((s, i) => (
                      <li key={i} className="text-sm">
                        <strong className="text-green-800 block">{s.title}</strong>
                        <span className="text-green-700">{s.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                  <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" /> Risks & Missing Skills
                  </h3>
                  <ul className="space-y-3 mb-4">
                    {evaluationReport.risks?.map((r, i) => (
                      <li key={i} className="text-sm">
                        <strong className="text-amber-800 block">
                          {r.title} 
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded ml-2 uppercase">{r.severity}</span>
                        </strong>
                        <span className="text-amber-700">{r.detail}</span>
                      </li>
                    ))}
                  </ul>
                  {evaluationReport.missing_skills?.length > 0 && (
                    <div className="border-t border-amber-200 pt-3">
                      <p className="text-xs font-bold text-amber-900 uppercase mb-2">Missing Capabilities</p>
                      <ul className="space-y-2">
                        {evaluationReport.missing_skills.map((m, i) => (
                          <li key={i} className="text-xs text-amber-800">
                            <strong>{m.skill}:</strong> {m.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Balance & Originality</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border border-gray-100 rounded-xl p-4 shadow-sm bg-white">
                    <p className="font-bold text-gray-800 flex justify-between">
                      Team Balance <span className="text-indigo-600">{evaluationReport.team_balance?.rating}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{evaluationReport.team_balance?.summary}</p>
                  </div>
                  <div className="border border-gray-100 rounded-xl p-4 shadow-sm bg-white">
                    <p className="font-bold text-gray-800 flex justify-between">
                      Originality <span className="text-indigo-600">{evaluationReport.originality?.rating}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{evaluationReport.originality?.summary}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 text-white rounded-xl p-6 shadow-inner">
                <h3 className="font-bold text-gray-300 uppercase tracking-wider text-sm mb-3">Mentor Recommendation</h3>
                <p className="text-gray-100 leading-relaxed font-medium">
                  {evaluationReport.mentor_recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
