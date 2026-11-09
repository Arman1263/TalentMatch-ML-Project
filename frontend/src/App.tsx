
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";

import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import JobManagement from "./pages/recruiter/JobManagement";
import JobListings from "./pages/candidate/JobListings";
import JobDetails from "./pages/candidate/JobDetails";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Candidate protected routes */}
      <Route element={<ProtectedRoute allowedRole="candidate" />}>
        <Route
          path="/candidate/dashboard"
          element={<CandidateDashboard />}
        />

        <Route
          path="/candidate/jobs"
          element={<JobListings />}
        />

        <Route
          path="/candidate/jobs/:jobId"
          element={<JobDetails />}
        />
      </Route>

      {/* Recruiter protected routes */}
      <Route element={<ProtectedRoute allowedRole="recruiter" />}>
        <Route
          path="/recruiter/dashboard"
          element={<RecruiterDashboard />}
        />

        <Route
          path="/recruiter/jobs"
          element={<JobManagement />}
        />
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;
