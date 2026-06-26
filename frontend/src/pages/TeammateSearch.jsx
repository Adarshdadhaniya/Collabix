import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Search, UserPlus, Check, Sparkles, BookOpen, User, Star } from 'lucide-react';

const TeammateSearch = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const groupId = searchParams.get('groupId');
  const projectTitle = searchParams.get('projectTitle');

  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [year, setYear] = useState('All Years');
  const [minCgpa, setMinCgpa] = useState('Min CGPA: Any');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invitedStudents, setInvitedStudents] = useState({});
  const [error, setError] = useState('');

  const departments = ['All Departments', 'Computer Science', 'Information Science', 'Electrical & Electronics Engineering', 'Mechanical Engineering', 'Civil'];
  const years = ['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year'];
  const cgpas = ['Min CGPA: Any', 'Min CGPA: 7.0', 'Min CGPA: 8.0', 'Min CGPA: 9.0'];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.get('/profile/search', {
        params: {
          query,
          department,
          year,
          minCgpa,
          projectId
        }
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to search teammates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      handleSearch();
    }
  }, [projectId]);

  const handleInvite = async (studentId) => {
    if (!groupId) {
      alert("No Group ID provided. Please make sure you joined a group first.");
      return;
    }

    try {
      setInvitedStudents(prev => ({ ...prev, [studentId]: 'loading' }));
      await api.post('/groups/invite', {
        projectId,
        groupId,
        studentId
      });
      setInvitedStudents(prev => ({ ...prev, [studentId]: 'invited' }));
    } catch (err) {
      console.error(err);
      setInvitedStudents(prev => ({ ...prev, [studentId]: 'error' }));
      setTimeout(() => {
        setInvitedStudents(prev => {
          const newState = { ...prev };
          delete newState[studentId];
          return newState;
        });
      }, 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-600" />
          Find Teammates
        </h1>
        {projectTitle && (
          <p className="text-gray-600 mt-2 text-lg">
            Searching for project: <span className="font-semibold text-gray-800">{projectTitle}</span>
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg"
              placeholder="Describe the ideal teammate (e.g., 'React developer with good UI skills')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="block w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="block w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              className="block w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {cgpas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8 text-center font-medium">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Results ({results.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((student) => (
              <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                {student.matchScore != null && (
                  <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 px-4 py-1.5 rounded-bl-xl font-bold flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4" />
                    {student.matchScore}% Match
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
                      <span className="flex items-center gap-1"><BookOpen className="w-4 h-4"/> {student.department}</span>
                      <span className="flex items-center gap-1"><User className="w-4 h-4"/> {student.year} Year</span>
                      <span className="flex items-center gap-1"><Star className="w-4 h-4"/> {student.cgpa} CGPA</span>
                    </div>
                  </div>
                </div>

                {student.skills && student.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {student.skills.slice(0, 5).map((skill, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                      {student.skills.length > 5 && (
                        <span className="bg-gray-50 text-gray-500 px-2.5 py-1 rounded-md text-xs font-medium">
                          +{student.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {student.reason && (
                  <div className="bg-indigo-50/50 rounded-lg p-3 mb-5 border border-indigo-100/50 mt-auto">
                    <p className="text-sm text-indigo-900 leading-relaxed italic">"{student.reason}"</p>
                  </div>
                )}

                <div className="flex justify-end mt-auto pt-2">
                  <button
                    onClick={() => handleInvite(student.id)}
                    disabled={invitedStudents[student.id] === 'invited' || invitedStudents[student.id] === 'loading'}
                    className={`px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                      invitedStudents[student.id] === 'invited'
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : invitedStudents[student.id] === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  >
                    {invitedStudents[student.id] === 'loading' ? (
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : invitedStudents[student.id] === 'invited' ? (
                      <><Check className="w-4 h-4" /> Invited</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Invite to Group</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !loading && query === '' && (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Start your search</h3>
          <p className="text-gray-500 mt-1">Describe what you are looking for or use the filters.</p>
        </div>
      )}
      
      {results.length === 0 && !loading && query !== '' && (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No teammates found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
};

export default TeammateSearch;
