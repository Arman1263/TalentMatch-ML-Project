
import api from "./api";

export interface Job {
  id: string;
  title: string;
  company_name: string;
  description: string;
  required_skills: string[] | null;
  location: string | null;
  employment_type: string | null;
  experience_required: number | null;
  is_active: boolean;
  created_at: string;
}

export interface JobCreateRequest {
  title: string;
  description: string;
  required_skills: string[];
  location?: string | null;
  employment_type?: string | null;
  experience_required?: number | null;
}

export interface JobUpdateRequest {
  title?: string;
  description?: string;
  required_skills?: string[];
  location?: string | null;
  employment_type?: string | null;
  experience_required?: number | null;
  is_active?: boolean;
}

export interface JobBrowseParams {
  search?: string;
  location?: string;
  employment_type?: string;
  skill?: string;
  experience_max?: number;
  skip?: number;
  limit?: number;
}

// Recruiter: Get own jobs
export const getMyJobs = async (): Promise<Job[]> => {
  const response = await api.get<Job[]>("/jobs/my-jobs");
  return response.data;
};

// Recruiter: Create job
export const createJob = async (
  data: JobCreateRequest
): Promise<Job> => {
  const response = await api.post<Job>("/jobs/", data);
  return response.data;
};

// Recruiter: Update job
export const updateJob = async (
  jobId: string,
  data: JobUpdateRequest
): Promise<Job> => {
  const response = await api.patch<Job>(`/jobs/${jobId}`, data);
  return response.data;
};

// Recruiter: Deactivate job
export const deactivateJob = async (
  jobId: string
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `/jobs/${jobId}`
  );
  return response.data;
};

// Recruiter: Reactivate job
export const reactivateJob = async (
  jobId: string
): Promise<Job> => {
  const response = await api.patch<Job>(`/jobs/${jobId}`, {
    is_active: true,
  });
  return response.data;
};

// Candidate: Browse and filter active jobs
export const browseJobs = async (
  params: JobBrowseParams = {}
): Promise<Job[]> => {
  const response = await api.get<Job[]>("/jobs/", {
    params,
  });
  return response.data;
};

// Candidate: Get single job details
export const getJobById = async (
  jobId: string
): Promise<Job> => {
  const response = await api.get<Job>(`/jobs/${jobId}`);
  return response.data;
};
