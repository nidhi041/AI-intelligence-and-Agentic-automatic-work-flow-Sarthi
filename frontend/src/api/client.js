/**
 * API client for the AI Candidate Intelligence backend.
 * All requests go through the Vite proxy at /api → localhost:8000
 */

const BASE_URL = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
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
    const res = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: form });
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
  getDownloadUrl: (filename) => `${BASE_URL}/download/${filename}`,
};
