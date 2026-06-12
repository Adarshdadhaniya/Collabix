import { useState, useEffect } from 'react';
import { Mail, Check, X, Loader2, ArrowRight, Clock, ShieldCheck, UserPlus } from 'lucide-react';
import api from '../api/axios';

export default function StudentRequests() {
  const [invitations, setInvitations] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null);

  const fetchData = async () => {
    try {
      const [invitesRes, requestsRes] = await Promise.all([
        api.get('/groups/invitations'),
        api.get('/groups/sent-requests')
      ]);
      setInvitations(invitesRes.data);
      setSentRequests(requestsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvitationAction = async (invitationId, action) => {
    setIsProcessing(invitationId);
    try {
      await api.post(`/groups/invitations/${invitationId}/${action}`);
      alert(`Invitation ${action}ed!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} invitation`);
    } finally {
      setIsProcessing(null);
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
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Requests & Invitations</h1>
        <p className="text-gray-500">Manage your team invitations and track your join requests.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Received Invitations */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-600" />
            Invitations Received
          </h2>
          
          <div className="space-y-4">
            {invitations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
                No pending invitations.
              </div>
            ) : (
              invitations.map(invite => (
                <div key={invite._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        {invite.invitedBy?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{invite.invitedBy?.name}</p>
                        <p className="text-xs text-gray-500">Invited you to join</p>
                      </div>
                    </div>
                    <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                      Pending
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="text-sm font-bold text-gray-900">{invite.group?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{invite.projectNotice?.title}</p>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      disabled={isProcessing === invite._id}
                      onClick={() => handleInvitationAction(invite._id, 'accept')}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing === invite._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Accept
                    </button>
                    <button 
                      disabled={isProcessing === invite._id}
                      onClick={() => handleInvitationAction(invite._id, 'reject')}
                      className="flex-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sent Join Requests */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-green-600" />
            Sent Join Requests
          </h2>
          
          <div className="space-y-4">
            {sentRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
                You haven't sent any join requests yet.
              </div>
            ) : (
              sentRequests.map(req => (
                <div key={req._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      {req.group?.name}
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                      req.status === 'accepted' ? 'bg-green-50 text-green-600' :
                      req.status === 'rejected' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {req.status}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Sent on {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <ArrowRight className="w-3 h-3" />
                    <span>For project: </span>
                    <span className="font-medium text-gray-900">{req.projectNotice?.title}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
