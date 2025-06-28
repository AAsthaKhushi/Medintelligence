// Declare global variable for API base URL
declare global {
  const __API_BASE_URL__: string;
}

// API base URL configuration
const API_BASE_URL = typeof __API_BASE_URL__ !== 'undefined' 
  ? __API_BASE_URL__ 
  : process.env.NODE_ENV === 'production' 
    ? '/.netlify/functions/api' 
    : '/api';

/**
 * Creates a full API URL from a path
 * @param path - The API path (e.g., '/prescriptions', '/timeline/schedules')
 * @returns The full API URL
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

/**
 * Makes an API request with proper error handling
 * @param path - The API path
 * @param options - Fetch options
 * @returns Promise with the response
 */
export async function apiRequest(
  path: string, 
  options: RequestInit = {}
): Promise<Response> {
  const url = getApiUrl(path);
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }

  return response;
}

/**
 * Makes a GET request to the API
 * @param path - The API path
 * @returns Promise with the JSON response
 */
export async function apiGet<T = any>(path: string): Promise<T> {
  const response = await apiRequest(path, { method: 'GET' });
  return response.json();
}

/**
 * Makes a POST request to the API
 * @param path - The API path
 * @param data - The data to send
 * @returns Promise with the JSON response
 */
export async function apiPost<T = any>(path: string, data?: any): Promise<T> {
  const response = await apiRequest(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * Makes a PUT request to the API
 * @param path - The API path
 * @param data - The data to send
 * @returns Promise with the JSON response
 */
export async function apiPut<T = any>(path: string, data?: any): Promise<T> {
  const response = await apiRequest(path, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * Makes a DELETE request to the API
 * @param path - The API path
 * @returns Promise with the JSON response
 */
export async function apiDelete<T = any>(path: string): Promise<T> {
  const response = await apiRequest(path, { method: 'DELETE' });
  return response.json();
}

/**
 * Uploads a file to the API
 * @param path - The API path
 * @param formData - FormData containing the file
 * @returns Promise with the JSON response
 */
export async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
  const url = getApiUrl(path);
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }

  return response.json();
} 