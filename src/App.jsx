import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ToastContainer from './components/common/ToastContainer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students/StudentList';
import StudentDetail from './pages/Students/StudentDetail';
import ExamsList from './pages/exams/ExamsList';
import CreateExam from './pages/exams/CreateExam';
import ExamDetail from './pages/exams/ExamDetail';
import HandwritingReview from './pages/Discipline/HandwritingMonitor';
import AdminSupportPage from './pages/SupportDesk/AdminSupportPage';
import AdminAnnouncementsPage from './pages/Announcements/AdminAnnouncementsPage';
import SchoolRegistry from './pages/AdminControl/SchoolRegistry';
import StaffRegistry from './pages/AdminControl/StaffRegistry';
import SystemHealth from './pages/AdminControl/SystemHealth';
import RankingLeaderboard from './pages/Rankings/RankingLeaderboard';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/:id" element={<StudentDetail />} />
              <Route path="/discipline/handwriting" element={<HandwritingReview />} />
              <Route path="/exams" element={<ExamsList />} />
              <Route path="/exams/create" element={<CreateExam />} />
              <Route path="/exams/:id" element={<ExamDetail />} />
              <Route path="/rankings" element={<RankingLeaderboard />} />
              <Route path="/support" element={<AdminSupportPage />} />
              <Route path="/announcements" element={<AdminAnnouncementsPage />} />

              {/* Super Admin Foundation Routes */}
              <Route path="/admin/system-health" element={<SystemHealth />} />
              <Route path="/admin/schools" element={<SchoolRegistry />} />
              <Route path="/admin/staff" element={<StaffRegistry />} />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
