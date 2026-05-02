const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  // Only add Content-Type if not already set and not a blob response
  if (!headers['Content-Type'] && !(options as any).responseType) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific Redis connection errors
      if (errorData.message && errorData.message.includes('Redis')) {
        throw new Error('Redis connection error. Please ensure Redis server is running or update connection string with abortConnect=false');
      }
      
      throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
    }

    // Handle blob responses (for PDF downloads)
    if ((options as any).responseType === 'blob') {
      return (await response.blob()) as unknown as T;
    }

    return response.status === 204 ? ({} as T) : await response.json();
  } catch (fetchError: any) {
    if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
      throw new Error('Backend server is not running. Please start the backend on port 5177.');
    }
    throw fetchError;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
