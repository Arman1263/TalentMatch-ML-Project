
import { useEffect, useState, type FormEvent } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import WorkOutlined from "@mui/icons-material/WorkOutlined";
import BlockOutlined from "@mui/icons-material/BlockOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";

import {
  getMyJobs,
  createJob,
  updateJob,
  deactivateJob,
  reactivateJob,
  type Job,
  type JobCreateRequest,
} from "../../services/jobService";

const initialFormData = {
  title: "",
  description: "",
  required_skills: "",
  location: "",
  employment_type: "",
  experience_required: "",
};

function JobManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [jobToDeactivate, setJobToDeactivate] = useState<Job | null>(null);

  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  // Fetch recruiter's jobs
  const fetchJobs = async () => {
    try {
      setError("");
      const data = await getMyJobs();
      setJobs(data);
    } catch {
      setError("Unable to load your jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchJobs();
  }, []);

  // Job statistics
  const activeJobs = jobs.filter((job) => job.is_active).length;
  const inactiveJobs = jobs.length - activeJobs;

  const statistics = [
    { label: "Total Jobs", value: jobs.length },
    { label: "Active Jobs", value: activeJobs },
    { label: "Inactive Jobs", value: inactiveJobs },
  ];

  // Open dialog for creating a job
  const handleCreateClick = () => {
    setEditingJob(null);
    setFormData(initialFormData);
    setFormError("");
    setDialogOpen(true);
  };

  // Open dialog with existing job details
  const handleEditClick = (job: Job) => {
    setEditingJob(job);

    setFormData({
      title: job.title,
      description: job.description,
      required_skills: job.required_skills?.join(", ") || "",
      location: job.location || "",
      employment_type: job.employment_type || "",
      experience_required:
        job.experience_required !== null
          ? String(job.experience_required)
          : "",
    });

    setFormError("");
    setDialogOpen(true);
  };

  // Create or update a job
  const handleSubmitJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const skills = [
      ...new Set(
        formData.required_skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      ),
    ];

    if (skills.length === 0) {
      setFormError("Please enter at least one required skill.");
      return;
    }

    const experience = formData.experience_required.trim()
      ? Number(formData.experience_required)
      : null;

    if (
      experience !== null &&
      (!Number.isInteger(experience) || experience < 0)
    ) {
      setFormError("Experience must be a non-negative whole number.");
      return;
    }

    const payload: JobCreateRequest = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      required_skills: skills,
      location: formData.location.trim() || null,
      employment_type: formData.employment_type || null,
      experience_required: experience,
    };

    setSubmitting(true);

    try {
      if (editingJob) {
        await updateJob(editingJob.id, payload);
      } else {
        await createJob(payload);
      }

      await fetchJobs();

      setFormData(initialFormData);
      setEditingJob(null);
      setDialogOpen(false);
    } catch {
      setFormError(
        editingJob
          ? "Unable to update the job. Please try again."
          : "Unable to create the job. Please check your information and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Deactivate or reactivate a job
  const handleJobStatusChange = async (job: Job, shouldActivate: boolean) => {
    setActionError("");
    setUpdatingJobId(job.id);

    try {
      if (shouldActivate) {
        await reactivateJob(job.id);
      } else {
        await deactivateJob(job.id);
      }

      setJobToDeactivate(null);
      await fetchJobs();
    } catch {
      setActionError(
        shouldActivate
          ? "Unable to reactivate this job. Please try again."
          : "Unable to deactivate this job. Please try again."
      );
    } finally {
      setUpdatingJobId(null);
    }
  };

  // Close and reset dialog
  const handleCloseDialog = () => {
    if (submitting) return;

    setDialogOpen(false);
    setFormError("");
    setEditingJob(null);
    setFormData(initialFormData);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Page Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Manage Jobs
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Create and manage your company's job postings.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={handleCreateClick}
        >
          Create Job
        </Button>
      </Box>

      {/* API Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button size="small" onClick={() => void fetchJobs()}>
            Retry
          </Button>
        </Alert>
      )}

      {actionError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setActionError("")}>
          {actionError}
        </Alert>
      )}

      {/* Statistics */}
      {!loading && !error && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, 1fr)",
            },
            gap: 2,
            mb: 4,
          }}
        >
          {statistics.map((item) => (
            <Paper
              key={item.label}
              elevation={0}
              sx={{ p: 3, border: "1px solid #E2E8F0" }}
            >
              <Typography color="text.secondary">
                {item.label}
              </Typography>

              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                {item.value}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Loading */}
      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 8,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loading && !error && jobs.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: "center",
            border: "1px solid #E2E8F0",
          }}
        >
          <WorkOutlined color="primary" sx={{ fontSize: 42 }} />

          <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
            No jobs posted yet
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Create your first job posting to get started.
          </Typography>
        </Paper>
      )}

      {/* Job Listings */}
      {!loading && !error && jobs.length > 0 && (
        <Stack spacing={2}>
          {jobs.map((job) => (
            <Paper
              key={job.id}
              elevation={0}
              sx={{ p: 3, border: "1px solid #E2E8F0" }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {job.title}
                  </Typography>

                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {job.company_name} ·{" "}
                    {job.location || "Location not specified"}
                  </Typography>

                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {job.employment_type || "Employment type not specified"}
                    {" · "}
                    {job.experience_required ?? "Not specified"} years
                    experience
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Chip
                    label={job.is_active ? "Active" : "Inactive"}
                    color={job.is_active ? "success" : "default"}
                    size="small"
                  />

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditOutlined />}
                    onClick={() => handleEditClick(job)}
                    disabled={updatingJobId === job.id}
                  >
                    Edit
                  </Button>

                  {job.is_active ? (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<BlockOutlined />}
                      onClick={() => setJobToDeactivate(job)}
                      disabled={updatingJobId === job.id}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      color="success"
                      variant="outlined"
                      startIcon={<CheckOutlined  />}
                      onClick={() => void handleJobStatusChange(job, true)}
                      disabled={updatingJobId === job.id}
                    >
                      {updatingJobId === job.id ? "Updating..." : "Reactivate"}
                    </Button>
                  )}
                </Stack>
              </Box>

              {/* Job Description */}
                <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    mt: 2,
                    whiteSpace: "pre-line",
                    lineHeight: 1.7,
                }}
                >
                {job.description}
                </Typography>

                {/* Required Skills */}
                <Typography
                color="text.secondary"
                sx={{ mt: 2 }}
                >
                <strong>Required Skills:</strong>{" "}
                {job.required_skills?.join(" · ") || "No skills specified"}
                </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 2 }}
              >
                Posted: {new Date(job.created_at).toLocaleDateString()}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={Boolean(jobToDeactivate)}
        onClose={() => {
          if (!updatingJobId) setJobToDeactivate(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Deactivate Job?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to deactivate{" "}
            <strong>{jobToDeactivate?.title}</strong>? It will no longer appear
            in public job listings. You can reactivate it later.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            color="inherit"
            onClick={() => setJobToDeactivate(null)}
            disabled={updatingJobId !== null}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (jobToDeactivate) {
                void handleJobStatusChange(jobToDeactivate, false);
              }
            }}
            disabled={updatingJobId !== null}
          >
            {updatingJobId === jobToDeactivate?.id
              ? "Deactivating..."
              : "Deactivate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create / Edit Job Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleSubmitJob}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingJob ? "Edit Job" : "Create New Job"}
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              {formError && (
                <Alert severity="error">{formError}</Alert>
              )}

              <TextField
                label="Job Title"
                placeholder="e.g. Python Developer"
                value={formData.title}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    title: event.target.value,
                  })
                }
                required
                fullWidth
              />

              <TextField
                label="Job Description"
                placeholder="Describe the job responsibilities and requirements..."
                value={formData.description}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    description: event.target.value,
                  })
                }
                required
                multiline
                minRows={5}
                fullWidth
                helperText="Minimum 30 characters."
                slotProps={{
                  htmlInput: { minLength: 30 },
                }}
              />

              <TextField
                label="Required Skills"
                placeholder="Python, FastAPI, SQL, PostgreSQL"
                value={formData.required_skills}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    required_skills: event.target.value,
                  })
                }
                required
                fullWidth
                helperText="Enter skills separated by commas."
              />

              <TextField
                label="Location"
                placeholder="e.g. Pune, Maharashtra"
                value={formData.location}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    location: event.target.value,
                  })
                }
                fullWidth
              />

              <TextField
                select
                label="Employment Type"
                value={formData.employment_type}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    employment_type: event.target.value,
                  })
                }
                fullWidth
              >
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Internship">Internship</MenuItem>
                <MenuItem value="Remote">Remote</MenuItem>
              </TextField>

              <TextField
                label="Required Experience (Years)"
                type="number"
                value={formData.experience_required}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    experience_required: event.target.value,
                  })
                }
                fullWidth
                slotProps={{
                  htmlInput: { min: 0, step: 1 },
                }}
                helperText="Leave empty if experience is not specified."
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={handleCloseDialog}
              color="inherit"
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editingJob
                  ? "Save Changes"
                  : "Create Job"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  );
}

export default JobManagement;
