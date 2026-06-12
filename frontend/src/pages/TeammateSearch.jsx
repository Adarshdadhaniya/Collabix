import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, BrainCircuit, UserPlus, GraduationCap, Loader2, ArrowLeft, Target } from 'lucide-react';
import api from '../api/axios';

export default function TeammateSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('projectId');
  const groupId = searchParams.get('groupId');
  const projectTitle = searchParams.get('projectTitle');

  const [searchQuery, setSearchQuery] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(null);
  const [filters, setFilters] = useState({
    department: searchParams.get('dept') || 'All Departments',
    year: searchParams.get('year') ? `${searchParams.get('year')}${Number(searchParams.get('year')) === 1 ? 'st' : Number(searchParams.get('year')) === 2 ? 'nd' : Number(searchParams.get('year')) === 3 ? 'rd' : 'th'} Year` : 'All Years',
    minCgpa: 'Min CGPA: Any'
  });

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams({
        query: useAI ? searchQuery : '',
        department: filters.department,
        year: filters.year,
        minCgpa: filters.minCgpa,
        projectId: projectId || ''
      });

      const response = await api.get(`/profile/search?${params.toString()}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (studentId) => {
    if (!groupId) {
      alert('You must be in a group to invite teammates. Create a group from the dashboard first.');
      return;
    }
    setIsInviting(studentId);
    try {
      await api.post('/groups/invite', { projectId, groupId, studentId });
      alert('Invitation sent successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsInviting(null);
    }
  };

  // Run initial search
  useEffect(() => {
    handleSearch();
  }, [filters.department, filters.year]); // Re-search if context changes

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {projectId && (
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Group
        </button>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {projectId ? `Find Teammates for ${projectTitle}` : 'Find Teammates'}
          </h1>
          <p className="text-gray-500">
            {projectId 
              ? `Showing students eligible for ${projectTitle}.`
              : 'Search for students across the college based on skills, CGPA, and interests.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 border border-gray-200 rounded-lg shadow-sm">
          <span className="text-sm font-medium text-gray-600 pl-2">Semantic AI Search</span>
          <button 
            onClick={() => setUseAI(!useAI)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${useAI ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useAI ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {useAI ? <BrainCircuit className="h-5 w-5 text-indigo-500" /> : <Search className="h-5 w-5 text-gray-400" />}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 placeholder-gray-400"
              placeholder={useAI ? "Describe what you're looking for (e.g. 'Someone good at building frontend apps')" : "Search by skills, names, or USN"}
            />
          </div>
          <button className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors">
            <SlidersHorizontal className="w-5 h-5" />
            Filters
          </button>
          <button onClick={handleSearch} disabled={isLoading} className="px-6 py-3 flex gap-2 items-center bg-gray-900 text-white rounded-xl hover:bg-indigo-600 font-medium transition-colors shadow-sm disabled:opacity-70">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-gray-50/50 p-4 flex gap-3 overflow-x-auto">
          <select value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})} className="text-sm border border-gray-200 rounded-lg py-2 px-3 outline-none text-gray-600 bg-white">
            <option>All Departments</option>
            <option>Computer Science</option>
            <option>Information Science</option>
            <option>Electronics</option>
          </select>
          <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="text-sm border border-gray-200 rounded-lg py-2 px-3 outline-none text-gray-600 bg-white">
            <option>All Years</option>
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
            <option>4th Year</option>
          </select>
          <select value={filters.minCgpa} onChange={e => setFilters({...filters, minCgpa: e.target.value})} className="text-sm border border-gray-200 rounded-lg py-2 px-3 outline-none text-gray-600 bg-white">
            <option>Min CGPA: Any</option>
            <option>Min CGPA: 7.0</option>
            <option>Min CGPA: 8.0</option>
            <option>Min CGPA: 9.0</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
           <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.length === 0 ? (
             <div className="col-span-full text-center p-8 text-gray-500">No students matched your search criteria.</div>
          ) : searchResults.map((student) => (
            <div key={student.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {student.department} • Yr {student.year}
                    </p>
                  </div>
                </div>
                
                {useAI && student.matchScore !== null && (
                  <div className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded border border-green-100">
                    {student.matchScore}% Match
                  </div>
                )}
              </div>

              <div className="mb-4 min-h-[40px]">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Top Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {student.skills.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-[11px] font-medium rounded-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <div className="text-sm">
                  <span className="text-gray-500">CGPA: </span>
                  <span className="font-semibold text-gray-900">{student.cgpa}</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.location.href = `/student/messages?userId=${student.id}`}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Message
                  </button>
                  <button 
                    disabled={isInviting === student.id}
                    onClick={() => handleInvite(student.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isInviting === student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Invite
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
