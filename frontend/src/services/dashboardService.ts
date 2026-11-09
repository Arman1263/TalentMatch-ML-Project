
import api from "./api";

export interface CandidateDashboardResponse {
  profile: {
    full_name: string;
    headline: string | null;
    location: string | null;
  } | null;

  statistics: {
    total_resumes: number;
    has_active_resume: boolean;
    total_applications: number;
    total_matches: number;
    average_match_score: number;
  };
}

export const getCandidateDashboard = async (): Promise<CandidateDashboardResponse> => {
  const response = await api.get<CandidateDashboardResponse>(
    "/users/candidate/dashboard"
  );

  return response.data;
};


export interface RecruiterDashboardResponse {
  profile: {
    full_name: string;
    company_name: string;
    company_website: string | null;
  } | null;

  statistics: {
    total_jobs: number;
    active_jobs: number;
    total_applications: number;
    total_matches: number;
    matched_candidates: number;
  };
}

export const getRecruiterDashboard =
  async (): Promise<RecruiterDashboardResponse> => {
    const response = await api.get<RecruiterDashboardResponse>(
      "/users/recruiter/dashboard"
    );

    return response.data;
  };
