
/**
 * API client for the AI Candidate Intelligence backend.
 * Uses VITE_API_URL environment variable with fallback to local backend.
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BASE_URL = RAW_API_URL.replace(/\/+$/, '');

function getUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

async function request(path, options = {}) {
  const res = await fetch(getUrl(path), {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  /** Check system status */
  getStatus: () => request('/status'),

  /** Load the built-in demo resume */
  loadDemo: () => request('/demo'),

  /** Upload a resume file */
  uploadResume: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(getUrl('/upload'), { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Upload failed');
    return data;
  },

  /** Get current candidate */
  getCandidate: () => request('/candidate'),

  /** Ask a question about the candidate */
  ask: (question) =>
    request('/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  /** Run evaluation only */
  evaluate: (targetRole) =>
    request('/evaluate', {
      method: 'POST',
      body: JSON.stringify({ target_role: targetRole }),
    }),

  /** Run full agentic workflow: evaluate + PDF + dispatch */
  evaluateAndDispatch: (targetRole) =>
    request('/evaluate-and-dispatch', {
      method: 'POST',
      body: JSON.stringify({ target_role: targetRole }),
    }),

  /** Save evaluation as JSON */
  saveJson: (targetRole) =>
    request('/save-json', {
      method: 'POST',
      body: JSON.stringify({ target_role: targetRole }),
    }),

  /** Get activity log */
  getActivity: () => request('/activity'),

  /** Get download URL for a file */
  getDownloadUrl: (filename) => getUrl(`/download/${filename}`),
};

