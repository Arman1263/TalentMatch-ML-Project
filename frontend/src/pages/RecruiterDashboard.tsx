
import { useEffect, useState } from "react";

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
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import AutoAwesome from "@mui/icons-material/AutoAwesome";

import { useAuth } from "../context/AuthContext";

import {
  getRecruiterDashboard,
  type RecruiterDashboardResponse,
} from "../services/dashboardService";

function RecruiterDashboard() {
  const { user, logout } = useAuth();

  const [dashboard, setDashboard] =
    useState<RecruiterDashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getRecruiterDashboard();
        setDashboard(data);
      } catch {
        setError("Unable to load recruiter dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  const statistics = dashboard?.statistics;

  const statsCards = [
    {
      icon: <WorkOutlined color="primary" />,
      title: "Total Jobs",
      value: statistics?.total_jobs ?? 0,
      description: "Total job postings",
    },
    {
      icon: <WorkOutlined color="primary" />,
      title: "Active Jobs",
      value: statistics?.active_jobs ?? 0,
      description: "Currently active postings",
    },
    {
      icon: <AssignmentOutlined color="primary" />,
      title: "Applications",
      value: statistics?.total_applications ?? 0,
      description: "Applications received",
    },
    {
      icon: <AutoAwesome color="primary" />,
      title: "AI Matches",
      value: statistics?.total_matches ?? 0,
      description: "Generated matching results",
    },
    {
      icon: <PeopleOutlined color="primary" />,
      title: "Matched Candidates",
      value: statistics?.matched_candidates ?? 0,
      description: "Unique matched candidates",
    },
  ];

  const features = [
    {
      icon: <WorkOutlined color="primary" />,
      title: "Manage Jobs",
      description: "Create, edit, and manage your job postings.",
    },
    {
      icon: <PeopleOutlined color="primary" />,
      title: "Candidate Matches",
      description: "Discover candidates ranked by AI matching scores.",
    },
    {
      icon: <AssignmentOutlined color="primary" />,
      title: "Applications",
      description: "Review applications and manage hiring progress.",
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

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {dashboard?.profile?.company_name || "Company not provided"}
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
          Manage your job postings, review applications, and discover
          AI-matched candidates.
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && dashboard && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Recruitment Overview
            </Typography>

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
              {statsCards.map((card) => (
                <Paper
                  key={card.title}
                  elevation={0}
                  sx={{ p: 3, border: "1px solid #E2E8F0" }}
                >
                  {card.icon}

                  <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                    {card.title}
                  </Typography>

                  <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                    {card.value}
                  </Typography>

                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {card.description}
                  </Typography>
                </Paper>
              ))}
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 600, mt: 5, mb: 2 }}>
              Quick Actions
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {features.map((feature) => (
                <Paper
                  key={feature.title}
                  elevation={0}
                  sx={{ p: 3, border: "1px solid #E2E8F0" }}
                >
                  {feature.icon}

                  <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>

                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}

export default RecruiterDashboard;
