
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import WorkOutlineOutlined from "@mui/icons-material/WorkOutlineOutlined";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import RefreshOutlined from "@mui/icons-material/Refresh";

import api from "../../services/api";
import type { ApplicationStatus } from "../../services/applicationService";

interface CandidateApplication {
  id: string;
  candidate_id: string;
  job_id: string;
  status: ApplicationStatus;
  applied_at: string;
  job_title: string;
  company_name: string;
  job_location: string | null;
  matching_score: number | null;
}

const statusColors: Record<
  ApplicationStatus,
  "default" | "info" | "warning" | "primary" | "success" | "error"
> = {
  submitted: "info",
  reviewing: "warning",
  shortlisted: "primary",
  interview: "primary",
  accepted: "success",
  rejected: "error",
};

function MyApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<CandidateApplication[]>(
        "/applications/my-applications"
      );

      setApplications(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            "Unable to load your applications."
        );
      } else {
        setError("Something went wrong while loading applications.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplications();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          mb: 4,
          alignItems: "center",
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackOutlined />}
          onClick={() => navigate("/candidate/dashboard")}
        >
          Dashboard
        </Button>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            My Applications
          </Typography>
          <Typography color="text.secondary">
            Track your job applications and matching scores.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshOutlined />}
          onClick={() => void fetchApplications()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 8,
          }}
        >
          <CircularProgress />
        </Box>
      ) : applications.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: "center", py: 7 }}>
            <WorkOutlineOutlined
              sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
            />

            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              No applications yet
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Explore available jobs and submit your first application.
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate("/candidate/jobs")}
            >
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          <Typography color="text.secondary">
            {applications.length} application
            {applications.length !== 1 ? "s" : ""} submitted
          </Typography>

          {applications.map((application) => (
            <Card key={application.id} variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {application.job_title}
                    </Typography>

                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                      {application.company_name}
                    </Typography>
                  </Box>

                  <Chip
                    label={
                      application.status.charAt(0).toUpperCase() +
                      application.status.slice(1)
                    }
                    color={statusColors[application.status]}
                    variant="outlined"
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack
                  direction="row"
                  spacing={3}
                  sx={{
                    mb: 2,
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0.7}
                    sx={{ alignItems: "center" }}
                  >
                    <LocationOnOutlined fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {application.job_location || "Location not specified"}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={0.7}
                    sx={{ alignItems: "center" }}
                  >
                    <CalendarTodayOutlined
                      fontSize="small"
                      color="action"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Applied{" "}
                      {new Date(application.applied_at).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Stack>

                <Box sx={{ mb: 2 }}>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Resume Match Score
                    </Typography>

                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {application.matching_score !== null
                        ? `${application.matching_score.toFixed(1)}%`
                        : "Not available"}
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      100,
                      Math.max(0, application.matching_score ?? 0)
                    )}
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VisibilityOutlined />}
                  onClick={() =>
                    navigate(`/candidate/jobs/${application.job_id}`)
                  }
                >
                  View Job
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}

export default MyApplications;
