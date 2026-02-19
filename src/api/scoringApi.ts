import { apiFetch, setAuthToken } from './client';

export type ApiUser = {
  id: string;
  name: string;
  role: 'admin' | 'judge';
  judgeId: string;
  judgeType?: 'Internal' | 'External';
};

export type ApiDomain = {
  key: string;
  name: string;
};

export type ApiTeam = {
  _id: string;
  name: string;
  teamId: string;
  domainKey: string;
  problemStatement?: string;
  ideaDescription?: string;
  createdAt: string;
};

export type ApiJudge = {
  _id: string;
  name: string;
  judgeId: string;
  judgeType?: 'Internal' | 'External';
  createdAt?: string;
};

export type ApiAllocation = {
  _id: string;
  judge: { _id: string; name: string; judgeId: string };
  team: { _id: string; name: string; teamId: string; domainKey: string };
  domainKey: string;
  createdAt: string;
};

export type ApiScore = {
  _id: string;
  judgeId: string;
  judgeName: string;
  teamId: string;
  teamName: string;
  teamProblemStatement?: string;
  domainKey: string;
  problemIdentification: number;
  innovationCreativity: number;
  feasibilityPracticality: number;
  marketImpactPotential: number;
  technologyDomainRelevance: number;
  pitchDeliveryQA: number;
  bonus: number;
  total: number;
  createdAt: string;
};

export type ApiRoundTwoScore = ApiScore & {
  teamIdeaDescription?: string;
};

export type ApiRoundOneResult = {
  _id: string;
  domainKey: string;
  teamId: string;
  teamName: string;
  totalScore: number;
  innovationCreativityScore: number;
  marketImpactPotentialScore: number;
  teamProblemStatement?: string;
  teamIdeaDescription?: string;
  rank: number;
};

export type ApiRoundTwoResult = {
  _id: string;
  teamId: string;
  teamName: string;
  domainKey: string;
  totalScore: number;
  innovationCreativityScore: number;
  marketImpactPotentialScore: number;
  teamProblemStatement?: string;
  teamIdeaDescription?: string;
  rank: number;
};

export type ApiRoundTwoAllocation = {
  _id: string;
  judgeId: string;
  judgeName: string;
  teamId: string;
  team: { _id: string; name: string; problemStatement?: string; ideaDescription?: string };
  createdAt: string;
};

export const bootstrapAdmin = (payload: { name: string; judgeId: string }) =>
  apiFetch<{ token: string; user: ApiUser }>('/api/auth/admin/bootstrap', {
    method: 'POST',
    body: JSON.stringify(payload)
  }).then((res) => {
    setAuthToken(res.token);
    return res;
  });

export const createJudge = (payload: { name: string; judgeId: string; judgeType?: 'Internal' | 'External' }) =>
  apiFetch('/api/auth/judges', { method: 'POST', body: JSON.stringify(payload) });

export const deleteAdmin = () => apiFetch('/api/auth/admin', { method: 'DELETE' });

export const login = (payload: { judgeId: string }) =>
  apiFetch<{ token: string; user: ApiUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }).then((res) => {
    setAuthToken(res.token);
    return res;
  });

export const logout = () => setAuthToken(null);

export const listJudges = () => apiFetch<ApiJudge[]>('/api/judges');
export const createJudgesBulk = (payload: { judges: { name: string; judgeId: string; judgeType?: 'Internal' | 'External' }[] } | { name: string; judgeId: string; judgeType?: 'Internal' | 'External' }[]) =>
  apiFetch('/api/judges/bulk', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const updateJudge = (id: string, payload: { name?: string; judgeId?: string; judgeType?: 'Internal' | 'External' }) =>
  apiFetch(`/api/judges/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
export const deleteJudge = (id: string) =>
  apiFetch(`/api/judges/${id}`, { method: 'DELETE' });
export const deleteAllJudges = () => apiFetch('/api/judges', { method: 'DELETE' });

export const listDomains = () => apiFetch<ApiDomain[]>('/api/domains');

export const listTeams = () => apiFetch<ApiTeam[]>('/api/teams');
export const createTeam = (payload: {
  name: string;
  teamId: string;
  domainKey: string;
  problemStatement: string;
  ideaDescription?: string;
}) => apiFetch<ApiTeam>('/api/teams', { method: 'POST', body: JSON.stringify(payload) });

export const createTeamsBulk = (payload: { teams: ApiTeam[] } | ApiTeam[]) =>
  apiFetch('/api/teams/bulk', { method: 'POST', body: JSON.stringify(payload) });

export const updateTeam = (id: string, payload: Partial<ApiTeam>) =>
  apiFetch(`/api/teams/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteTeam = (id: string) => apiFetch(`/api/teams/${id}`, { method: 'DELETE' });
export const deleteAllTeams = () => apiFetch('/api/teams', { method: 'DELETE' });

export const setDomainJudges = (payload: { domainKey: string; judgeIds: string[] }) =>
  apiFetch('/api/domain-judges/assign', { method: 'POST', body: JSON.stringify(payload) });

export const listDomainJudges = (domainKey: string) =>
  apiFetch(`/api/domain-judges/${domainKey}`);

export const listAllocations = () => apiFetch<ApiAllocation[]>('/api/allocations');
export const deleteAllocation = (id: string) => apiFetch(`/api/allocations/${id}`, { method: 'DELETE' });
export const listMyAllocations = () => apiFetch<ApiAllocation[]>('/api/allocations/me');

export const submitScore = (payload: {
  teamId: string;
  domainKey: string;
  problemIdentification: number;
  innovationCreativity: number;
  feasibilityPracticality: number;
  marketImpactPotential: number;
  technologyDomainRelevance: number;
  pitchDeliveryQA: number;
  bonus?: number;
}) => apiFetch('/api/scores', { method: 'POST', body: JSON.stringify(payload) });

export const submitScoresBulk = (payload: { scores: any[] } | any[]) =>
  apiFetch('/api/scores/bulk', { method: 'POST', body: JSON.stringify(payload) });

export const listMyScores = (domainKey: string) => apiFetch<ApiScore[]>(`/api/scores/my?domainKey=${domainKey}`);
export const listScores = (domainKey: string) => apiFetch<ApiScore[]>(`/api/scores?domainKey=${domainKey}`);
export const listScoresForTeam = (teamId: string, domainKey: string) =>
  apiFetch<ApiScore[]>(`/api/scores/team/${teamId}?domainKey=${domainKey}`);
export const listTeamsScoresByDomain = (domainKey: string) =>
  apiFetch(`/api/scores/domain/${domainKey}/teams`);

export const listJudgeScoreCounts = (domainKey?: string) =>
  apiFetch(`/api/scores/judges/count${domainKey ? `?domainKey=${domainKey}` : ''}`);

export const setupRoundTwo = (payload: { judgeIds: string[] }) =>
  apiFetch('/api/round-two/setup', { method: 'POST', body: JSON.stringify(payload) });

export const submitRoundTwoScore = (payload: {
  teamId: string;
  problemIdentification: number;
  innovationCreativity: number;
  feasibilityPracticality: number;
  marketImpactPotential: number;
  technologyDomainRelevance: number;
  pitchDeliveryQA: number;
  bonus?: number;
}) => apiFetch('/api/scores/round-two', { method: 'POST', body: JSON.stringify(payload) });

export const submitRoundTwoScoresBulk = (payload: { scores: any[] } | any[]) =>
  apiFetch('/api/scores/round-two/bulk', { method: 'POST', body: JSON.stringify(payload) });

export const listMyRoundTwoScores = () => apiFetch<ApiRoundTwoScore[]>('/api/scores/my/round-two');

export const listRoundTwoTeamsScores = () => apiFetch('/api/scores/round-two/teams');

export const calculateRoundOneResults = () =>
  apiFetch('/api/results/round-one/calculate', { method: 'POST', body: JSON.stringify({}) });

export const listRoundOneResults = (domainKey?: string) =>
  apiFetch<ApiRoundOneResult[]>(`/api/results/round-one${domainKey ? `?domainKey=${domainKey}` : ''}`);

export const getRoundOneStatus = () =>
  apiFetch<{ calculated: boolean; count: number }>('/api/results/round-one/status');

export const calculateRoundTwoResults = () =>
  apiFetch('/api/round-two/calculate', { method: 'POST', body: JSON.stringify({}) });

export const listRoundTwoResults = () => apiFetch<ApiRoundTwoResult[]>('/api/round-two/results');

export const listRoundTwoAllocations = (judgeId?: string) =>
  apiFetch<ApiRoundTwoAllocation[]>(`/api/round-two/allocations${judgeId ? `?judgeId=${judgeId}` : ''}`);

export const exportRoundTwoResults = async () => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string) || 'http://34.47.198.176'}/api/round-two/export`, {
    headers
  });

  if (!res.ok) {
    throw new Error('Failed to export Round 2 results');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `round2_results_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getTeam = (id: string) => apiFetch<ApiTeam>(`/api/teams/${id}`);

export const getJudge = (id: string) => apiFetch<ApiJudge>(`/api/judges/${id}`);

export const createScoresBulkAdmin = (payload: { scores: any[] } | any[]) =>
  apiFetch('/api/scores/bulk/admin', { method: 'POST', body: JSON.stringify(payload) });
