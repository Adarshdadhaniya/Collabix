import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { getDepartments, getSections } from '../utils/collegeStructure';

export default function ProfileSetup() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [parsedData, setParsedData] = useState({
    department: '',
    year: '',
    section: '',
    cgpa: '',
    skills: '', // Track as string for the textarea
    github: '',
    linkedin: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        if (res.data) {
          setParsedData({
            department: res.data.department || '',
            year: res.data.year || '',
            section: res.data.section || '',
            cgpa: res.data.cgpa || '',
            skills: res.data.skills ? res.data.skills.join(', ') : '',
            github: res.data.github || '',
            linkedin: res.data.linkedin || ''
          });
        }
      } catch (err) {
        // 404 just means they haven't created one yet
        if (err.response && err.response.status !== 404) {
          console.error('Failed to fetch profile:', err);
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsUploading(true);
      setMessage('');
      
      const formData = new FormData();
      formData.append('resume', selectedFile);

      try {
        const response = await api.post('/profile/upload-resume', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Merge the AI data with whatever they already typed
        setParsedData(prev => ({
          ...prev,
          ...response.data.data,
          skills: response.data.data.skills ? response.data.data.skills.join(', ') : prev.skills,
          resumeUrl: response.data.resumeUrl
        }));
        setMessage('Resume parsed successfully by AI!');
      } catch (err) {
        console.error(err);
        setMessage('Failed to parse resume. Make sure Ollama and AI service are running.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...parsedData,
        skills: typeof parsedData.skills === 'string' 
          ? parsedData.skills.split(',').map(s => s.trim()).filter(s => s) 
          : parsedData.skills
      };
      await api.post('/profile', payload);
      setMessage('Profile saved and embeddings generated successfully!');
    } catch (err) {
      console.error(err);
      setMessage('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setParsedData({ ...parsedData, [field]: value });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
        <p className="text-gray-500">Upload your resume to let our AI auto-fill your details, or fill them in manually.</p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI Resume Parsing
          </h2>
          
          <label className={`block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${file ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'}`}>
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
            
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-gray-900">Extracting text with pdfplumber...</p>
                <p className="text-xs text-gray-500 mt-1">Ollama is analyzing your skills</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">Click to change file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">Click to upload PDF</p>
                <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
              </div>
            )}
          </label>
        </div>

        {/* Auto-filled Form Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Details</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Department</label>
                <select value={parsedData.department} onChange={(e) => { handleChange('department', e.target.value); handleChange('section', ''); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                  <option value="">Select Dept</option>
                  {getDepartments().map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Year</label>
                <select value={parsedData.year} onChange={(e) => { handleChange('year', e.target.value); handleChange('section', ''); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                  <option value="">Select Year</option>
                  {[1, 2, 3, 4].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Section</label>
                <select value={parsedData.section} onChange={(e) => handleChange('section', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" disabled={!parsedData.department || !parsedData.year}>
                  <option value="">Select Section</option>
                  {getSections(parsedData.department, parsedData.year).map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">CGPA</label>
              <input type="text" value={parsedData.cgpa} onChange={(e) => handleChange('cgpa', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 8.5" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider flex justify-between">
                Skills (Comma separated)
                <span className="text-indigo-600 text-[10px] font-bold">EMBEDDINGS WILL BE GENERATED</span>
              </label>
              <textarea 
                value={parsedData.skills} 
                onChange={(e) => handleChange('skills', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none" 
                placeholder="React, Node.js, Python..." 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">GitHub</label>
                <input type="text" value={parsedData.github} onChange={(e) => handleChange('github', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="github.com/..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">LinkedIn</label>
                <input type="text" value={parsedData.linkedin} onChange={(e) => handleChange('linkedin', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="linkedin.com/in/..." />
              </div>
            </div>

            <button 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full mt-4 bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
