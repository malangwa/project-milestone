import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const PLATFORM_URL = 'http://64.118.157.17';

@Injectable()
export class AiAgentService {
  constructor(private readonly http: HttpService) {}

  private headers(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async platformRegister(email: string, username: string, password: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${PLATFORM_URL}/auth/register`, { email, username, password }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Registration failed', err.response?.status || HttpStatus.BAD_REQUEST);
    }
  }

  async platformLogin(email: string, password: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${PLATFORM_URL}/auth/login`, { email, password }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Login failed', err.response?.status || HttpStatus.UNAUTHORIZED);
    }
  }

  async getMe(userToken: string) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${PLATFORM_URL}/auth/me`, { headers: this.headers(userToken) }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async listProjects(userToken: string) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${PLATFORM_URL}/projects`, { headers: this.headers(userToken) }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async createProject(userToken: string, name: string, description?: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${PLATFORM_URL}/projects`, { name, description }, { headers: this.headers(userToken) }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async connectAgent(userToken: string, agentName: string, projectId: string, description?: string, expiresInMinutes?: number) {
    try {
      const res = await firstValueFrom(
        this.http.post(
          `${PLATFORM_URL}/connect-agent`,
          { agent_name: agentName, project_id: projectId, description, expires_in_minutes: expiresInMinutes },
          { headers: this.headers(userToken) },
        ),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async listAgents(userToken: string, projectId?: string) {
    try {
      const url = projectId ? `${PLATFORM_URL}/agents?project_id=${projectId}` : `${PLATFORM_URL}/agents`;
      const res = await firstValueFrom(
        this.http.get(url, { headers: this.headers(userToken) }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async onlineAgents(userToken: string) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${PLATFORM_URL}/agents/online/status`, { headers: this.headers(userToken) }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async revokeAgent(userToken: string, agentId: string) {
    try {
      await firstValueFrom(
        this.http.delete(`${PLATFORM_URL}/agents/${agentId}`, { headers: this.headers(userToken) }),
      );
      return { success: true };
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async listRooms(userToken: string, projectId?: string) {
    try {
      const url = projectId ? `${PLATFORM_URL}/rooms?project_id=${projectId}` : `${PLATFORM_URL}/rooms`;
      const res = await firstValueFrom(
        this.http.get(url, { headers: this.headers(userToken) }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async createRoom(userToken: string, name: string, projectId: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${PLATFORM_URL}/rooms`, { name, project_id: projectId }, { headers: this.headers(userToken) }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async joinRoom(userToken: string, roomId: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${PLATFORM_URL}/rooms/${roomId}/join`, {}, { headers: this.headers(userToken) }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async getRoomMembers(userToken: string, roomId: string) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${PLATFORM_URL}/rooms/${roomId}/members`, { headers: this.headers(userToken) }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async getRoomOnline(userToken: string, roomId: string) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${PLATFORM_URL}/rooms/${roomId}/online`, { headers: this.headers(userToken) }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async sendMessage(agentToken: string, room: string, content: any, type: string = 'info') {
    try {
      const res = await firstValueFrom(
        this.http.post(
          `${PLATFORM_URL}/message`,
          { room, content, type },
          { headers: this.headers(agentToken) },
        ),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async getMessages(userToken: string, roomId: string, limit = 50, offset = 0) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${PLATFORM_URL}/messages/${roomId}?limit=${limit}&offset=${offset}`, {
          headers: this.headers(userToken),
        }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }

  async broadcastEvent(
    agentToken: string,
    room: string,
    eventType: string,
    projectName: string,
    data: Record<string, any>,
    triggeredBy?: string,
  ) {
    const content = JSON.stringify({
      event_type: eventType,
      project_name: projectName,
      data,
      triggered_by: triggeredBy || 'WINDSURF',
      timestamp: new Date().toISOString(),
      source: 'Project Milestone Management System',
    });
    return this.sendMessage(agentToken, room, content, 'event');
  }

  async askAi(userToken: string, question: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${PLATFORM_URL}/ask`, { question }, { headers: this.headers(userToken) }),
      );
      return res.data;
    } catch (err: any) {
      throw new HttpException(err.response?.data || 'Failed', err.response?.status || 400);
    }
  }
}
