
import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SearchOutlined from "@mui/icons-material/SearchOutlined";
import WorkOutlineOutlined from "@mui/icons-material/WorkOutlineOutlined";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import RestartAltOutlined from "@mui/icons-material/RestartAltOutlined";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";

import { useNavigate } from "react-router-dom";

import {
  browseJobs,
  type Job,
  type JobBrowseParams,
} from "../../services/jobService";

const PAGE_SIZE = 9;

function JobListings() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [skill, setSkill] = useState("");
  const [experienceMax, setExperienceMax] = useState("");

  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    const params: JobBrowseParams = {
      skip,
      limit: PAGE_SIZE,
    };

    if (search.trim()) params.search = search.trim();
    if (location.trim()) params.location = location.trim();
    if (employmentType) params.employment_type = employmentType;
    if (skill.trim()) params.skill = skill.trim();

    if (experienceMax !== "") {
      params.experience_max = Number(experienceMax);
    }

    try {
      const data = await browseJobs(params);
      setJobs(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError("Unable to load jobs. Please try again.");
      setJobs([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    location,
    employmentType,
    skill,
    experienceMax,
    skip,
  ]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSkip(0);
    void fetchJobs();
  };

  const handleClearFilters = () => {
    setSearch("");
    setLocation("");
    setEmploymentType("");
    setSkill("");
    setExperienceMax("");
    setSkip(0);
  };

  const handleNextPage = () => {
    setSkip((current) => current + PAGE_SIZE);
  };

  const handlePreviousPage = () => {
    setSkip((current) => Math.max(0, current - PAGE_SIZE));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Explore Jobs
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Discover opportunities that match your skills and career goals.
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Card
        elevation={0}
        sx={{ border: "1px solid #E2E8F0", mb: 4 }}
      >
        <CardContent>
          <Box component="form" onSubmit={handleSearch}>
            <Stack spacing={2}>
              <TextField
                label="Search job title"
                placeholder="e.g. Python Developer"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSkip(0);
                }}
                fullWidth
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Location"
                    placeholder="e.g. Pune"
                    value={location}
                    onChange={(event) => {
                      setLocation(event.target.value);
                      setSkip(0);
                    }}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    label="Employment Type"
                    value={employmentType}
                    onChange={(event) => {
                      setEmploymentType(event.target.value);
                      setSkip(0);
                    }}
                    fullWidth
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="Full-time">Full-time</MenuItem>
                    <MenuItem value="Part-time">Part-time</MenuItem>
                    <MenuItem value="Contract">Contract</MenuItem>
                    <MenuItem value="Internship">Internship</MenuItem>
                    <MenuItem value="Remote">Remote</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Required Skill"
                    placeholder="e.g. Python"
                    value={skill}
                    onChange={(event) => {
                      setSkill(event.target.value);
                      setSkip(0);
                    }}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    label="Maximum Experience"
                    value={experienceMax}
                    onChange={(event) => {
                      setExperienceMax(event.target.value);
                      setSkip(0);
                    }}
                    fullWidth
                  >
                    <MenuItem value="">Any Experience</MenuItem>
                    <MenuItem value="0">Fresher / 0 years</MenuItem>
                    <MenuItem value="1">Up to 1 year</MenuItem>
                    <MenuItem value="2">Up to 2 years</MenuItem>
                    <MenuItem value="3">Up to 3 years</MenuItem>
                    <MenuItem value="5">Up to 5 years</MenuItem>
                    <MenuItem value="10">Up to 10 years</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
              >
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SearchOutlined />}
                  disabled={loading}
                >
                  Search Jobs
                </Button>

                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<RestartAltOutlined />}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void fetchJobs()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Job Listings */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !error && jobs.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            border: "1px solid #E2E8F0",
            textAlign: "center",
            py: 7,
          }}
        >
          <WorkOutlineOutlined
            color="primary"
            sx={{ fontSize: 48 }}
          />

          <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
            No jobs found
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Try changing your search terms or filters.
          </Typography>

          <Button sx={{ mt: 2 }} onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </Card>
      ) : !error ? (
        <>
          <Typography sx={{ mb: 2 }} color="text.secondary">
            Showing {jobs.length} jobs
          </Typography>

          <Grid container spacing={3}>
            {jobs.map((job) => (
              <Grid key={job.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #E2E8F0",
                    transition: "0.2s",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      {job.title}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {job.company_name}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}
                    >
                      <Chip
                        icon={<LocationOnOutlined />}
                        label={job.location || "Not specified"}
                        size="small"
                        variant="outlined"
                      />

                      <Chip
                        icon={<WorkOutlineOutlined />}
                        label={job.employment_type || "Not specified"}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 2,
                        lineHeight: 1.6,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {job.description}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        REQUIRED SKILLS
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ mt: 1, flexWrap: "wrap", gap: 0.75 }}
                      >
                        {(job.required_skills || []).slice(0, 5).map(
                          (item) => (
                            <Chip
                              key={item}
                              label={item}
                              size="small"
                            />
                          )
                        )}
                      </Stack>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2 }}
                    >
                      Experience:{" "}
                      {job.experience_required === null
                        ? "Not specified"
                        : `${job.experience_required} years`}
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    <Button
                      fullWidth
                      variant="contained"
                      endIcon={<ArrowForwardOutlined />}
                      sx={{ mt: 3 }}
                      onClick={() =>
                        navigate(`/candidate/jobs/${job.id}`)
                      }
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
                mt: 4,
                justifyContent: "center",
                alignItems: "center",
            }}
            >
            <Button
              variant="outlined"
              disabled={skip === 0 || loading}
              onClick={handlePreviousPage}
            >
              Previous
            </Button>

            <Typography color="text.secondary">
              Page {Math.floor(skip / PAGE_SIZE) + 1}
            </Typography>

            <Button
              variant="outlined"
              disabled={!hasMore || loading}
              onClick={handleNextPage}
            >
              Next
            </Button>
          </Stack>
        </>
      ) : null}
    </Container>
  );
}

export default JobListings;
