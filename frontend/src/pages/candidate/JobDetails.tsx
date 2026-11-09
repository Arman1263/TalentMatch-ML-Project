
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import WorkOutlineOutlined from "@mui/icons-material/WorkOutlineOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";

import { getJobById, type Job } from "../../services/jobService";
import {
  applyForJob,
  getMyApplications,
} from "../../services/applicationService";

function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [applying, setApplying] = useState(false);

  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationError, setApplicationError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setError("Invalid job ID.");
        setLoading(false);
        setCheckingApplication(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getJobById(jobId);
        setJob(data);
      } catch {
        setError("Unable to load this job. It may no longer be available.");
      } finally {
        setLoading(false);
      }
    };

    void fetchJob();
  }, [jobId]);

  // Check whether the candidate has already applied.
  useEffect(() => {
    const checkApplication = async () => {
      if (!jobId) {
        setCheckingApplication(false);
        return;
      }

      try {
        setCheckingApplication(true);

        const applications = await getMyApplications();

        const existingApplication = applications.some(
          (application) => application.job_id === jobId
        );

        setHasApplied(existingApplication);
      } catch {
        setApplicationError(
          "Unable to verify your application status. Please try again."
        );
      } finally {
        setCheckingApplication(false);
      }
    };

    void checkApplication();
  }, [jobId]);

  // Submit application.
  const handleApply = async () => {
    if (!jobId || applying || hasApplied) return;

    setApplying(true);
    setApplicationError("");
    setApplicationMessage("");

    try {
      await applyForJob(jobId);

      setHasApplied(true);
      setApplicationMessage(
        "Your application has been submitted successfully!"
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;

        if (statusCode === 400) {
          setApplicationError(
            "Please upload an active resume before applying."
          );
        } else if (statusCode === 409) {
          setHasApplied(true);
          setApplicationError(
            "You have already applied for this job."
          );
        } else if (statusCode === 404) {
          setApplicationError(
            "This job is no longer available."
          );
        } else {
          setApplicationError(
            error.response?.data?.detail ||
              "Unable to submit your application. Please try again."
          );
        }
      } else {
        setApplicationError(
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !job) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Alert severity="error">{error || "Job not found."}</Alert>

        <Button
          startIcon={<ArrowBackOutlined />}
          sx={{ mt: 3 }}
          onClick={() => navigate("/candidate/jobs")}
        >
          Back to Jobs
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Button
        startIcon={<ArrowBackOutlined />}
        onClick={() => navigate("/candidate/jobs")}
        sx={{ mb: 3 }}
      >
        Back to Jobs
      </Button>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          border: "1px solid #E2E8F0",
          borderRadius: 3,
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {job.title}
          </Typography>

          <Typography variant="h6" color="text.secondary">
            {job.company_name}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            <Chip
              icon={<LocationOnOutlined />}
              label={job.location || "Location not specified"}
              variant="outlined"
            />

            <Chip
              icon={<WorkOutlineOutlined />}
              label={job.employment_type || "Employment type not specified"}
              variant="outlined"
            />

            <Chip
              label={
                job.experience_required === null
                  ? "Experience not specified"
                  : `${job.experience_required} years experience`
              }
              variant="outlined"
            />
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Posted on {new Date(job.created_at).toLocaleDateString()}
          </Typography>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Job Description
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}
        >
          {job.description}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Required Skills
        </Typography>

        {job.required_skills?.length ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            {job.required_skills.map((skill) => (
              <Chip key={skill} label={skill} color="primary" />
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">
            No specific skills listed.
          </Typography>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Application Feedback */}
        {applicationMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {applicationMessage}
          </Alert>
        )}

        {applicationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {applicationError}
          </Alert>
        )}

        {/* Apply Button */}
        <Button
          fullWidth
          size="large"
          variant="contained"
          startIcon={
            hasApplied ? <CheckOutlined  /> : undefined
          }
          disabled={applying || checkingApplication || hasApplied}
          onClick={handleApply}
        >
          {checkingApplication
            ? "Checking Application..."
            : applying
              ? "Submitting Application..."
              : hasApplied
                ? "Already Applied"
                : "Apply Now"}
        </Button>
      </Paper>
    </Container>
  );
}

export default JobDetails;
