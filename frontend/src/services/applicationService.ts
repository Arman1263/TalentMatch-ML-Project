
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

export interface RecruiterApplication extends Application {
  candidate_name: string;
  candidate_email: string;
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

// Candidate: Get own applications
export const getMyApplications = async (): Promise<Application[]> => {
  const response = await api.get<Application[]>(
    "/applications/my-applications"
  );

  return response.data;
};

// Recruiter: Get received applications
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
