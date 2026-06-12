import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, UserMinus, ArrowLeft, Loader2, Target, CheckCircle, Shield } from 'lucide-react';
import api from '../api/axios';

export default function ProjectAdminDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [groups, setGroups] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
              groups.map(group => (
                <div key={group._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2 flex justify-between">
                    {group.name}
                    <span className="text-xs font-normal text-gray-500">{group.members?.length} / {project?.maxTeamSize} members</span>
                  </h3>
                  <p className="text-xs text-indigo-600 font-medium mb-4 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Leader: {group.leader?.name}
                  </p>
                  <div className="space-y-2">
                    {group.members?.map(m => (
                      <div key={m.student?._id} className="text-xs text-gray-600 flex justify-between items-center bg-gray-50 px-2 py-1.5 rounded">
                        <span>{m.student?.name}</span>
                        <span className="text-[10px] text-gray-400">{m.student?.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
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
    </div>
  );
}
