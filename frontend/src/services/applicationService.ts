
import api from "./api";

export type ApplicationStatus =
  | "submitted"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "accepted"
  | "rejected";

export interface Application {
  id: string;
  candidate_id: string;
  job_id: string;
  status: ApplicationStatus;
  applied_at: string;
}

/** Extended application returned by GET /applications/my-applications */
export interface CandidateApplication extends Application {
  job_title: string;
  company_name: string;
  job_location: string | null;
  matching_score: number | null;
}

/** Extended application returned by GET /applications/received */
export interface RecruiterApplication extends Application {
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  company_name: string;
  matching_score: number | null;
}

// Candidate: Apply for a job
export const applyForJob = async (
  jobId: string
): Promise<Application> => {
  const response = await api.post<Application>("/applications/", {
    job_id: jobId,
  });

  return response.data;
};

// Candidate: Get own applications (with job details and matching score)
export const getMyApplications = async (): Promise<
  CandidateApplication[]
> => {
  const response = await api.get<CandidateApplication[]>(
    "/applications/my-applications"
  );

  return response.data;
};

// Recruiter: Get received applications (with candidate info, job details, and matching score)
export const getReceivedApplications = async (): Promise<
  RecruiterApplication[]
> => {
  const response = await api.get<RecruiterApplication[]>(
    "/applications/received"
  );

  return response.data;
};

// Recruiter: Update application status
export const updateApplicationStatus = async (
  applicationId: string,
  status: ApplicationStatus
): Promise<Application> => {
  const response = await api.patch<Application>(
    `/applications/${applicationId}/status`,
    { status }
  );

  return response.data;
};
