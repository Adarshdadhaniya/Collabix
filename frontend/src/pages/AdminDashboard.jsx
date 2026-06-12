import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Calendar, Users, Settings, Loader2, Target, ShieldAlert } from 'lucide-react';
import api from '../api/axios';
import { getDepartments, generateEligibilityTriplets } from '../utils/collegeStructure';
import { AuthContext } from '../context/AuthContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eligibleDepartments: [],
    eligibleYears: [],
    eligibilityRules: [], // array of strings like "Computer Science|1|A"
    minTeamSize: 3,
    maxTeamSize: 5,
    visibilityType: 'college',
    leaderPolicy: 'creator_becomes_leader',
    assignedLeaders: []
  });

  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const fetchNotices = async () => {
    try {
      const res = await api.get('/project-notices');
      setNotices(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch project notices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleDepartmentToggle = (dept) => {
    setFormData(prev => {
      const newDepts = prev.eligibleDepartments.includes(dept)
        ? prev.eligibleDepartments.filter(d => d !== dept)
        : [...prev.eligibleDepartments, dept];
      return { ...prev, eligibleDepartments: newDepts, eligibilityRules: [] };
    });
  };

  const handleYearToggle = (year) => {
    setFormData(prev => {
      const newYears = prev.eligibleYears.includes(year)
        ? prev.eligibleYears.filter(y => y !== year)
        : [...prev.eligibleYears, year];
      return { ...prev, eligibleYears: newYears, eligibilityRules: [] };
    });
  };

  const handleTripletToggle = (tripletString) => {
    setFormData(prev => {
      const newRules = prev.eligibilityRules.includes(tripletString)
        ? prev.eligibilityRules.filter(r => r !== tripletString)
        : [...prev.eligibilityRules, tripletString];
      return { ...prev, eligibilityRules: newRules };
    });
  };

  useEffect(() => {
    const fetchEligibleStudents = async () => {
      if (formData.leaderPolicy === 'assigned_by_teacher' && formData.eligibilityRules.length > 0) {
        setIsFetchingStudents(true);
        try {
          const formattedRules = formData.eligibilityRules.map(ruleStr => {
            const [department, year, section] = ruleStr.split('|');
            return { department, year: Number(year), section };
          });
          const res = await api.post('/project-notices/eligible-students', { eligibilityRules: formattedRules });
          setEligibleStudents(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setIsFetchingStudents(false);
        }
      } else {
        setEligibleStudents([]);
      }
    };

    fetchEligibleStudents();
  }, [formData.leaderPolicy, formData.eligibilityRules]);

  const handleLeaderToggle = (studentId) => {
    setFormData(prev => {
      const newLeaders = prev.assignedLeaders.includes(studentId)
        ? prev.assignedLeaders.filter(id => id !== studentId)
        : [...prev.assignedLeaders, studentId];
      return { ...prev, assignedLeaders: newLeaders };
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Format data for backend
      const formattedRules = formData.eligibilityRules.map(ruleStr => {
        const [department, year, section] = ruleStr.split('|');
        return { department, year: Number(year), section };
      });

      const payload = {
        title: formData.title,
        description: formData.description,
        minTeamSize: formData.minTeamSize,
        maxTeamSize: formData.leaderPolicy === 'highest_cgpa' ? formData.minTeamSize : formData.maxTeamSize,
        visibilityType: formData.visibilityType,
        leaderPolicy: formData.leaderPolicy,
        eligibilityRules: formattedRules,
        assignedLeaders: formData.leaderPolicy === 'assigned_by_teacher' ? formData.assignedLeaders : []
      };

      await api.post('/project-notices', payload);
      setSuccess('Project notice created successfully!');
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        eligibleDepartments: [],
        eligibleYears: [],
        eligibilityRules: [],
        minTeamSize: 3,
        maxTeamSize: 5,
        visibilityType: 'college',
        leaderPolicy: 'creator_becomes_leader',
        assignedLeaders: []
      });
      fetchNotices(); // Refresh list
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create project notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-500">Manage college project events and team formation rules.</p>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right text-sm text-gray-500 hidden sm:block">
              Logged in as: <span className="font-semibold text-gray-950">{user.name}</span> ({user.email})
            </div>
          )}
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            {showForm ? 'Cancel Creation' : 'New Project Event'}
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> {error}</div>}
      {success && <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100">{success}</div>}

      {/* Creation Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            Create Project Event
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Final Year Project 2026" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 h-28 resize-none" placeholder="Describe the project requirements..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Departments</label>
                  <div className="flex gap-2 flex-wrap">
                    {getDepartments().map(dept => (
                      <button type="button" key={dept} onClick={() => handleDepartmentToggle(dept)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${formData.eligibleDepartments.includes(dept) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Years</label>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4].map(year => (
                        <button type="button" key={year} onClick={() => handleYearToggle(year)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${formData.eligibleYears.includes(year) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          Year {year}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Team Size</label>
                    <input type="number" required min="1" value={formData.minTeamSize} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        setFormData({
                          ...formData, 
                          minTeamSize: val,
                          maxTeamSize: formData.leaderPolicy === 'highest_cgpa' ? val : formData.maxTeamSize
                        });
                      }} 
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Team Size</label>
                    <input type="number" required min="1" 
                      disabled={formData.leaderPolicy === 'highest_cgpa'}
                      value={formData.leaderPolicy === 'highest_cgpa' ? formData.minTeamSize : formData.maxTeamSize} 
                      onChange={e => setFormData({...formData, maxTeamSize: Number(e.target.value)})} 
                      className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 ${formData.leaderPolicy === 'highest_cgpa' ? 'bg-gray-50 text-gray-500' : ''}`} 
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specific Eligibility (Select exactly who can join)</label>
                  <div className="flex gap-2 flex-wrap">
                    {formData.eligibleDepartments.length > 0 && formData.eligibleYears.length > 0 ? (
                      generateEligibilityTriplets(formData.eligibleDepartments, formData.eligibleYears).map(triplet => {
                        const tripletString = `${triplet.department}|${triplet.year}|${triplet.section}`;
                        const displayString = `${triplet.department} Yr ${triplet.year} Sec ${triplet.section}`;
                        const isSelected = formData.eligibilityRules.includes(tripletString);
                        
                        return (
                          <button type="button" key={tripletString} onClick={() => handleTripletToggle(tripletString)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            {displayString}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-sm text-gray-400">Select at least one Department and Year first to view combinations</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leader Policy</label>
                  <select value={formData.leaderPolicy} 
                    onChange={e => {
                      const policy = e.target.value;
                      setFormData({
                        ...formData, 
                        leaderPolicy: policy,
                        maxTeamSize: policy === 'highest_cgpa' ? formData.minTeamSize : formData.maxTeamSize,
                        assignedLeaders: []
                      });
                    }} 
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="creator_becomes_leader">Creator Becomes Leader</option>
                    <option value="highest_cgpa">Highest CGPA Becomes Leader</option>
                    <option value="assigned_by_teacher">Assigned by Teacher</option>
                  </select>
                  {formData.leaderPolicy === 'highest_cgpa' && (
                    <p className="text-xs text-indigo-600 mt-1">System will auto-select top leaders based on CGPA and team size.</p>
                  )}
                </div>

                {formData.leaderPolicy === 'assigned_by_teacher' && formData.eligibilityRules.length > 0 && (
                  <div className="col-span-2 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">Select Leaders (Sorted by CGPA)</label>
                      <input 
                        type="text" 
                        placeholder="Search students..." 
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="border border-gray-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      {isFetchingStudents ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
                      ) : (
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                            <tr>
                              <th className="px-4 py-2">Selected</th>
                              <th className="px-4 py-2">Name</th>
                              <th className="px-4 py-2">Dept</th>
                              <th className="px-4 py-2">CGPA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {eligibleStudents
                              .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                              .map(student => (
                              <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2">
                                  <input 
                                    type="checkbox" 
                                    checked={formData.assignedLeaders.includes(student._id)}
                                    onChange={() => handleLeaderToggle(student._id)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                </td>
                                <td className="px-4 py-2 font-medium text-gray-900">{student.name}</td>
                                <td className="px-4 py-2 text-gray-500">{student.profile.department} (Yr {student.profile.year})</td>
                                <td className="px-4 py-2 text-indigo-600 font-bold">{student.profile.cgpa}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{formData.assignedLeaders.length} leaders selected</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button disabled={isSubmitting} type="submit" className="flex items-center gap-2 bg-gray-900 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-70">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Notice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Projects List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          Active Project Events
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-12 text-center text-gray-500">
            No active project notices. Click 'New Project Event' to create one.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {notices.map(notice => (
              <div 
                key={notice._id} 
                onClick={() => navigate(`/admin/project/${notice._id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{notice.title}</h3>
                    <p className="text-xs text-gray-500">Created {new Date(notice.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-100">
                    {notice.status.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-6 line-clamp-2">{notice.description}</p>
                
                <div className="grid grid-cols-2 gap-y-4 text-sm border-t border-gray-50 pt-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Team Size</p>
                    <p className="font-medium text-gray-900">{notice.minTeamSize} - {notice.maxTeamSize} members</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Settings className="w-3 h-3" /> Policy</p>
                    <p className="font-medium text-gray-900 capitalize">{notice.leaderPolicy.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Eligibility Rules</p>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {notice.eligibilityRules && notice.eligibilityRules.slice(0, 4).map((rule, idx) => (
                        <span key={idx} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded font-medium border border-indigo-100">
                          {rule.department} Yr {rule.year} Sec {rule.section}
                        </span>
                      ))}
                      {notice.eligibilityRules && notice.eligibilityRules.length > 4 && (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-medium">
                          +{notice.eligibilityRules.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
