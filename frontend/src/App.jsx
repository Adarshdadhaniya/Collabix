import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TeammateSearch from './pages/TeammateSearch';
import ProfileSetup from './pages/ProfileSetup';
import Messages from './pages/Messages';
import GroupDashboard from './pages/GroupDashboard';
import ProjectGroups from './pages/ProjectGroups';
import ProjectAdminDetails from './pages/ProjectAdminDetails';
import StudentRequests from './pages/StudentRequests';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Dashboard Routes wrapped in a layout for sidebar/navigation */}
            <Route path="/" element={<DashboardLayout />}>
              <Route path="student/dashboard" element={<StudentDashboard />} />
              <Route path="student/profile" element={<ProfileSetup />} />
              <Route path="student/search" element={<TeammateSearch />} />
              <Route path="student/requests" element={<StudentRequests />} />
              <Route path="student/messages" element={<Messages />} />
              <Route path="student/group/:groupId" element={<GroupDashboard />} />
              <Route path="student/project/:projectId/groups" element={<ProjectGroups />} />
              
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/project/:projectId" element={<ProjectAdminDetails />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
