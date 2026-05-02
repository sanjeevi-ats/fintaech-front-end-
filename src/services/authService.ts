import { apiClient } from './apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  name: string;
  role: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  branchId: string;
  role?: string;
}

export interface RegisterResponse {
  id: string;
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  token: string;
}

export const authService = {
  login: (credentials: LoginRequest) => 
    apiClient.post<LoginResponse>('/api/v1/Auth/login', credentials),
  
  register: (userData: RegisterRequest) => 
    apiClient.post<RegisterResponse>('/api/v1/Auth/register', userData),
  
  refreshToken: (request: RefreshTokenRequest) => 
    apiClient.post<LoginResponse>('/api/v1/Auth/refresh-token', request),
  
  changePassword: (request: ChangePasswordRequest) => 
    apiClient.post<{ message: string }>('/api/v1/Auth/change-password', request),
  
  enableTotp: (request: { secret: string }) => 
    apiClient.post<{ qrCode: string; backupCodes: string[] }>('/api/v1/Auth/enable-totp', request),
};