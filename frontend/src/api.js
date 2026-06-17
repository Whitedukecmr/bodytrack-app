const API_BASE = '/api';

function getToken() {
  return sessionStorage.getItem('bodytrack_token');
}

function setToken(token) {
  sessionStorage.setItem('bodytrack_token', token);
}

function clearToken() {
  sessionStorage.removeItem('bodytrack_token');
}

async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const resp = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.error || 'Erreur serveur');
  }
  return data;
}

export const api = {
  register: (payload) => apiCall('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiCall('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => apiCall('/profile/me'),
  dashboardToday: () => apiCall('/profile/dashboard/today'),
  dashboardProgress: () => apiCall('/profile/dashboard/progress'),
  analyzeMeal: (imageBase64, moment) => apiCall('/vision/meal', { method: 'POST', body: JSON.stringify({ imageBase64, moment }) }),
  analyzeActivity: (imageBase64, type_activite) => apiCall('/vision/activity', { method: 'POST', body: JSON.stringify({ imageBase64, type_activite }) }),
  analyzeBodyComposition: (imageBase64) => apiCall('/vision/body-composition', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),
};

export { getToken, setToken, clearToken };
