import api from './axios';

const platformHeaders = (platformToken: string) => ({ 'x-platform-token': platformToken });
const agentHeaders = (agentToken: string) => ({ 'x-agent-token': agentToken });

export const aiAgentApi = {
  platformRegister: (email: string, username: string, password: string) =>
    api.post('/ai-agent/platform/register', { email, username, password }),

  platformLogin: (email: string, password: string) =>
    api.post('/ai-agent/platform/login', { email, password }),

  getMe: (platformToken: string) =>
    api.get('/ai-agent/platform/me', { headers: platformHeaders(platformToken) }),

  listProjects: (platformToken: string) =>
    api.get('/ai-agent/platform/projects', { headers: platformHeaders(platformToken) }),

  createProject: (platformToken: string, name: string, description?: string) =>
    api.post('/ai-agent/platform/projects', { name, description }, { headers: platformHeaders(platformToken) }),

  connectAgent: (platformToken: string, agentName: string, projectId: string, description?: string, expiresInMinutes?: number) =>
    api.post('/ai-agent/connect', { agent_name: agentName, project_id: projectId, description, expires_in_minutes: expiresInMinutes }, { headers: platformHeaders(platformToken) }),

  listAgents: (platformToken: string, projectId?: string) =>
    api.get(`/ai-agent/agents${projectId ? `?project_id=${projectId}` : ''}`, { headers: platformHeaders(platformToken) }),

  onlineAgents: (platformToken: string) =>
    api.get('/ai-agent/agents/online', { headers: platformHeaders(platformToken) }),

  revokeAgent: (platformToken: string, agentId: string) =>
    api.delete(`/ai-agent/agents/${agentId}`, { headers: platformHeaders(platformToken) }),

  listRooms: (platformToken: string, projectId?: string) =>
    api.get(`/ai-agent/rooms${projectId ? `?project_id=${projectId}` : ''}`, { headers: platformHeaders(platformToken) }),

  createRoom: (platformToken: string, name: string, projectId: string) =>
    api.post('/ai-agent/rooms', { name, project_id: projectId }, { headers: platformHeaders(platformToken) }),

  joinRoom: (platformToken: string, roomId: string) =>
    api.post(`/ai-agent/rooms/${roomId}/join`, {}, { headers: platformHeaders(platformToken) }),

  getRoomMembers: (platformToken: string, roomId: string) =>
    api.get(`/ai-agent/rooms/${roomId}/members`, { headers: platformHeaders(platformToken) }),

  getRoomOnline: (platformToken: string, roomId: string) =>
    api.get(`/ai-agent/rooms/${roomId}/online`, { headers: platformHeaders(platformToken) }),

  sendMessage: (agentToken: string, room: string, content: any, type = 'info') =>
    api.post('/ai-agent/messages/send', { room, content, type }, { headers: agentHeaders(agentToken) }),

  getMessages: (token: string, roomId: string, limit = 50, offset = 0) =>
    api.get(`/ai-agent/messages/${roomId}?limit=${limit}&offset=${offset}`, { headers: agentHeaders(token) }),

  broadcastEvent: (agentToken: string, room: string, eventType: string, projectName: string, data: Record<string, any>, triggeredBy?: string) =>
    api.post('/ai-agent/broadcast', { room, event_type: eventType, project_name: projectName, data, triggered_by: triggeredBy }, { headers: agentHeaders(agentToken) }),

  askAi: (platformToken: string, question: string) =>
    api.post('/ai-agent/ask', { question }, { headers: platformHeaders(platformToken) }),
};
