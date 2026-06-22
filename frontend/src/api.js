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
  updateProfile: (payload) => apiCall('/profile/me', { method: 'PUT', body: JSON.stringify(payload) }),
  dashboardToday: (date) => apiCall(`/profile/dashboard/today${date ? `?date=${date}` : ''}`),
  dashboardRange: (days, endDate) => apiCall(`/profile/dashboard/range?days=${days}${endDate ? `&endDate=${endDate}` : ''}`),
  dashboardProgress: () => apiCall('/profile/dashboard/progress'),
  analyzeMeal: (imageBase64, moment) => apiCall('/vision/meal', { method: 'POST', body: JSON.stringify({ imageBase64, moment }) }),
  analyzeMealText: (description, moment) => apiCall('/vision/meal-text', { method: 'POST', body: JSON.stringify({ description, moment }) }),
  analyzeMealCombined: (imageBase64, description, moment) => apiCall('/vision/meal-combined', { method: 'POST', body: JSON.stringify({ imageBase64, description, moment }) }),
  analyzeActivity: (imageBase64, type_activite) => apiCall('/vision/activity', { method: 'POST', body: JSON.stringify({ imageBase64, type_activite }) }),
  analyzeBodyComposition: (imageBase64) => apiCall('/vision/body-composition', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),
  addBodyCompositionManual: (payload) => apiCall('/vision/body-composition-manual', { method: 'POST', body: JSON.stringify(payload) }),
  updateMeal: (id, payload) => apiCall(`/entries/meals/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteMeal: (id) => apiCall(`/entries/meals/${id}`, { method: 'DELETE' }),
  updateActivity: (id, payload) => apiCall(`/entries/activities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteActivity: (id) => apiCall(`/entries/activities/${id}`, { method: 'DELETE' }),
  deleteBodyComposition: (id) => apiCall(`/entries/body-composition/${id}`, { method: 'DELETE' }),
};

export { getToken, setToken, clearToken };
