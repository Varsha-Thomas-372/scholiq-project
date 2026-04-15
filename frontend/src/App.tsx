import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { LandingPage } from "./pages/Landing";
import { HomePage } from "./pages/Home";
import { UploadPage } from "./pages/Upload";
import { ResourcesPage } from "./pages/Resources";
import { SchedulerPage } from "./pages/Scheduler";
import { MCQPage } from "./pages/MCQ";
import { ProgressPage } from "./pages/Progress";
import { PYQPage } from "./pages/PYQ";
import { SettingsPage } from "./pages/Settings";
import { FacultyPage } from "./pages/Faculty";

function RootRedirect() {
  const { profile, user } = useAuth();
  if (!user || !profile) return <Navigate to="/" replace />;
  return <Navigate to={profile.role === "FACULTY" ? "/faculty" : "/home"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute role="STUDENT">
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute role="STUDENT">
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute role="STUDENT">
            <ResourcesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scheduler"
        element={
          <ProtectedRoute role="STUDENT">
            <SchedulerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mcq"
        element={
          <ProtectedRoute role="STUDENT">
            <MCQPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute role="STUDENT">
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pyq"
        element={
          <ProtectedRoute role="STUDENT">
            <PYQPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty"
        element={
          <ProtectedRoute role="FACULTY">
            <FacultyPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
