
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";

import WorkOutlined from "@mui/icons-material/WorkOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";

import { useAuth } from "../context/AuthContext";
import {
  getCandidateDashboard,
  type CandidateDashboardResponse,
} from "../services/dashboardService";

function CandidateDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] =
    useState<CandidateDashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getCandidateDashboard();
        setDashboard(data);
      } catch {
        setError("Unable to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  const statistics = dashboard?.statistics;

  const cards = [
    {
      icon: <DescriptionOutlined color="primary" />,
      title: "My Resumes",
      value: statistics?.total_resumes ?? 0,
      description: statistics?.has_active_resume
        ? "Active resume available"
        : "No active resume",
    },
    {
      icon: <AssignmentOutlined color="primary" />,
      title: "Applications",
      value: statistics?.total_applications ?? 0,
      description: "Jobs applied to",
    },
    {
      icon: <AutoAwesome color="primary" />,
      title: "AI Matches",
      value: statistics?.total_matches ?? 0,
      description: "Generated job matches",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="inherit" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              TalentMatch
            </Typography>

            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Welcome, {dashboard?.profile?.full_name || user?.email}
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
          Manage your profile, discover jobs, and track your AI-powered matches.
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && dashboard && (
          <>
            <Paper
              elevation={0}
              sx={{ p: 3, mb: 3, border: "1px solid #E2E8F0" }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Profile Overview
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {dashboard.profile?.headline || "Add a professional headline"}
              </Typography>

              <Typography color="text.secondary">
                {dashboard.profile?.location || "Add your location"}
              </Typography>
            </Paper>

            {/* Dashboard Statistics */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {cards.map((item) => (
                <Paper
                  key={item.title}
                  elevation={0}
                  sx={{ p: 3, border: "1px solid #E2E8F0" }}
                >
                  {item.icon}

                  <Typography
                    variant="h6"
                    sx={{ mt: 2, fontWeight: 600 }}
                  >
                    {item.title}
                  </Typography>

                  <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                    {item.value}
                  </Typography>

                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {item.description}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Average Match Score */}
            <Paper
              elevation={0}
              sx={{ p: 3, mt: 3, border: "1px solid #E2E8F0" }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Average Match Score
              </Typography>

              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                {statistics?.average_match_score ?? 0}%
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Average score across your generated job matches.
              </Typography>
            </Paper>

            {/* Navigation Cards */}
            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                },
                gap: 3,
              }}
            >
              {/* Browse Jobs */}
              <Paper
                elevation={0}
                sx={{ p: 3, border: "1px solid #E2E8F0" }}
              >
                <WorkOutlined color="primary" />

                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                  Explore Jobs
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                  Discover jobs that match your skills and experience.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() => navigate("/candidate/jobs")}
                >
                  Browse Jobs
                </Button>
              </Paper>

              {/* My Applications */}
              <Paper
                elevation={0}
                sx={{ p: 3, border: "1px solid #E2E8F0" }}
              >
                <AssignmentOutlined color="primary" />

                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                  My Applications
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                  Track your submitted applications and matching scores.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() => navigate("/candidate/applications")}
                >
                  View Applications
                </Button>
              </Paper>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}

export default CandidateDashboard;
