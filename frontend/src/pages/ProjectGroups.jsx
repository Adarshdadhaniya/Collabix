import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Loader2, Search, UserPlus, CheckCircle } from 'lucide-react';
import api from '../api/axios';

export default function ProjectGroups() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, projectRes] = await Promise.all([
          api.get(`/groups/project/${projectId}`),
          api.get(`/project-notices/${projectId}`)
        ]);
        setGroups(groupsRes.data);
        setProject(projectRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleJoinRequest = async (groupId) => {
    setRequestingId(groupId);
    try {
      await api.post('/groups/join', { projectId, groupId });
      alert('Join request sent successfully!');
      // Update UI state locally if needed
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send join request');
    } finally {
      setRequestingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{project?.title}</h1>
        <p className="text-gray-500">Existing teams for this project. You can request to join any team that has space.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No groups have been formed for this project yet.</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group._id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{group.name}</h3>
                  <p className="text-xs text-gray-500 tracking-tight flex items-center gap-1">
                    Leader: <span className="font-semibold text-gray-700">{group.leader?.name}</span>
                  </p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold">
                  {group.members?.length} / {project?.maxTeamSize}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Members</p>
                <div className="flex -space-x-2 overflow-hidden">
                  {group.members?.map((m, idx) => (
                    <div key={idx} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                      {m.student?.name?.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleJoinRequest(group._id)}
                disabled={requestingId === group._id || group.members?.length >= project?.maxTeamSize}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  group.members?.length >= project?.maxTeamSize 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                }`}
              >
                {requestingId === group._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {group.members?.length >= project?.maxTeamSize ? 'Team Full' : 'Request to Join'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
