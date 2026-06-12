import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Shield, UserPlus, MessageSquare, ArrowLeft, Loader2, Target, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function GroupDashboard() {
  const { groupId } = useParams();
  const { user } = useContext(AuthContext);
  const [group, setGroup] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const fetchGroupDetails = async () => {
    try {
      const groupRes = await api.get(`/groups/${groupId}`);
      setGroup(groupRes.data);
      
      // If leader, fetch requests
      if (groupRes.data.leader?._id === user?.id || groupRes.data.leader === user?.id) {
        const requestsRes = await api.get(`/groups/${groupId}/requests`);
        setRequests(requestsRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load group details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const handleRequestAction = async (requestId, action) => {
    setIsProcessing(true);
    try {
      await api.post(`/groups/join/${requestId}/${action}`);
      alert(`Request ${action}ed successfully!`);
      fetchGroupDetails(); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl border border-gray-100">
        <p className="text-red-500 mb-4">{error || 'Group not found'}</p>
        <Link to="/student/dashboard" className="text-indigo-600 hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const isLeader = group.leader?._id === user?.id || group.leader === user?.id;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-10 text-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Team Formation
                </span>
                {group.status === 'completed' && (
                  <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Completed
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-extrabold mb-2">{group.name}</h1>
              <p className="text-indigo-100 flex items-center gap-2">
                <Target className="w-4 h-4" /> {group.projectNotice?.title}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center">
                <p className="text-3xl font-bold">{group.members?.length}</p>
                <p className="text-xs uppercase tracking-widest text-indigo-200">Members</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Members List */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" />
                Team Members
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {group.members?.map((m) => (
                  <div key={m.student?._id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all group">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                      {m.student?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 flex items-center gap-1">
                        {m.student?.name}
                        {group.leader?._id === m.student?._id && (
                          <Shield className="w-3 h-3 text-amber-500" title="Team Leader" />
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{m.student?.email}</p>
                    </div>
                  </div>
                ))}
                
                {group.members?.length < (group.projectNotice?.maxTeamSize || 5) && (
                  <Link 
                    to={`/student/search?projectId=${group.projectNotice?._id}&groupId=${group._id}&projectTitle=${encodeURIComponent(group.projectNotice?.title)}`}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="font-medium">Invite Teammate</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Join Requests (Leader Only) */}
            {isLeader && requests.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-indigo-600" />
                  Join Requests
                </h2>
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                          {req.student?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{req.student?.name}</p>
                          <p className="text-xs text-gray-500">{req.student?.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          disabled={isProcessing}
                          onClick={() => handleRequestAction(req._id, 'accept')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button 
                          disabled={isProcessing}
                          onClick={() => handleRequestAction(req._id, 'reject')}
                          className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Group Chat / Activity Placeholder */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Group Workspace</h3>
              <p className="text-gray-500 text-sm mb-6">Chat with your team and share project resources here.</p>
              <Link to="/student/messages" className="bg-white text-gray-900 border border-gray-200 px-6 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm inline-block">
                Go to Messages
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Team Actions
              </h3>
              <div className="space-y-3">
                {isLeader ? (
                  <>
                    <button className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                      Manage Applications
                    </button>
                    <button className="w-full bg-white text-gray-900 border border-gray-200 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm">
                      Edit Team Settings
                    </button>
                    <button className="w-full bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-medium hover:bg-red-100 transition-colors">
                      Disband Team
                    </button>
                  </>
                ) : (
                  <button className="w-full bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-medium hover:bg-red-100 transition-colors">
                    Leave Team
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Project Overview</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-500 uppercase text-[10px] tracking-widest font-bold mb-1">Deadline</p>
                  <p className="font-medium">March 15, 2026</p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase text-[10px] tracking-widest font-bold mb-1">Team Size Limit</p>
                  <p className="font-medium">{group.projectNotice?.minTeamSize || 1} - {group.projectNotice?.maxTeamSize || 5} Members</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
