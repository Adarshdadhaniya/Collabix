import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Target, Loader2, PlusCircle, Search } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingGroupId, setCreatingGroupId] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [noticesRes, profileRes] = await Promise.all([
        api.get('/project-notices'),
        api.get('/profile')
      ]);
      setNotices(noticesRes.data);
      setProfile(profileRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateGroup = async (projectId) => {
    setCreatingGroupId(projectId);
    try {
      const groupName = prompt('Enter group name:');
      if (!groupName) return;
      
      await api.post('/groups', { projectId, name: groupName });
      alert('Group created successfully!');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreatingGroupId(null);
    }
  };

  const isLeader = (notice) => {
    if (notice.leaderPolicy === 'creator_becomes_leader') return true;
    return notice.assignedLeaders?.some(id => id.toString() === user?.id);
  };

  const getGroupForNotice = (noticeId) => {
    return profile?.currentGroups?.find(cg => cg.projectNotice === noticeId || cg.projectNotice?._id === noticeId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
          <p className="text-gray-500">View available project events and manage your teams.</p>
        </div>
        {user && (
          <div className="text-right text-sm text-gray-500 hidden sm:block">
            Logged in as: <span className="font-semibold text-gray-950">{user.name}</span> ({user.email})
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Available Projects Section */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Available Project Events
          </h2>

          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : notices.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400">
              No project events available for your department/year yet.
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map(notice => (
                <div key={notice._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{notice.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{notice.description}</p>
                    </div>
                    {(() => {
                      const userGroup = getGroupForNotice(notice._id);
                      if (userGroup) {
                        return (
                          <button 
                            onClick={() => navigate(`/student/group/${userGroup.group}`)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            View Group
                          </button>
                        );
                      }

                      const canCreate = isLeader(notice);
                      const isAssignedLeader = notice.leaderPolicy !== 'creator_becomes_leader' && notice.assignedLeaders?.some(id => id.toString() === (user?.id || user?._id));
                      const canJoin = !isAssignedLeader;
                      
                      return (
                        <div className="flex flex-wrap gap-2">
                          {canCreate && (
                            <button 
                              onClick={() => handleCreateGroup(notice._id)}
                              disabled={creatingGroupId === notice._id}
                              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                            >
                              {creatingGroupId === notice._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                              Create Group
                            </button>
                          )}
                          {canJoin && (
                            <button 
                              onClick={() => navigate(`/student/project/${notice._id}/groups`)}
                              className="flex items-center gap-2 border border-indigo-100 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
                            >
                              <Search className="w-4 h-4" />
                              Join Group
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Team Size</p>
                      <p className="font-semibold text-gray-700">{notice.minTeamSize} - {notice.maxTeamSize}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Policy</p>
                      <p className="font-semibold text-gray-700 capitalize">{notice.leaderPolicy.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Role</p>
                      <p className={`font-semibold ${isLeader(notice) ? 'text-indigo-600' : 'text-gray-700'}`}>
                        {isLeader(notice) ? 'Assigned Leader' : 'Team Member'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Your Current Groups (Placeholder for now) */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Your Groups
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-gray-500 text-sm">Your active groups and invitations will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
