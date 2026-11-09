
import api from "./api";

export type UserRole = "candidate" | "recruiter";

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
}

export const registerUser = async (
  data: RegisterRequest
): Promise<UserResponse> => {
  const response = await api.post<UserResponse>("/auth/register", data);
  return response.data;
};

export const loginUser = async (
  data: LoginRequest
): Promise<TokenResponse> => {
  const response = await api.post<TokenResponse>("/auth/login", data);

  sessionStorage.setItem("access_token", response.data.access_token);

  return response.data;
};

export const logoutUser = (): void => {
  sessionStorage.removeItem("access_token");
};


export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await api.get<UserResponse>("/users/me");
  return response.data;
};