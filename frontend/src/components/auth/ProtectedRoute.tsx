
import { Navigate, Outlet } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../services/authService";

interface ProtectedRouteProps {
  allowedRole: UserRole;
}

function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  console.log("ProtectedRoute:", {
  currentPath: window.location.pathname,
  userRole: user?.role,
  allowedRole,
  loading,
});

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return (
      <Navigate
        to={
          user.role === "candidate"
            ? "/candidate/dashboard"
            : "/recruiter/dashboard"
        }
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
