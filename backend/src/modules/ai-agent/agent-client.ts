import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import WebSocket = require('ws');

const PLATFORM_BASE = 'http://64.118.157.17';
const PLATFORM_WS   = 'ws://64.118.157.17';

export interface PlatformMessage {
  id: string;
  from: string;
  type: string;
  content: string;
  room: string;
  timestamp: string;
}

@Injectable()
export class AgentClient implements OnModuleDestroy {
  private readonly logger = new Logger(AgentClient.name);
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private room: string | null = null;
  private listeners: Array<(msg: PlatformMessage) => void> = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly http: HttpService) {}

  /** Initialize with agent token + room name */
  init(token: string, room: string) {
    this.token = token;
    this.room  = room;
    this.connect();
  }

  private connect() {
    if (!this.token || !this.room) return;
    const url = `${PLATFORM_WS}/ws/${this.room}?token=${this.token}`;
    this.ws = new WebSocket(url);

    if (!this.ws) return;
    this.ws.on('open', () => {
      this.logger.log(`AgentClient connected to room=${this.room}`);
    });

    this.ws.on('message', (raw: WebSocket.RawData) => {
      try {
        const msg: PlatformMessage = JSON.parse(raw.toString());
        if (!msg.content?.trim()) return;
        this.listeners.forEach((fn) => fn(msg));
      } catch {}
    });

    this.ws.on('close', () => {
      this.logger.warn('AgentClient WS closed — reconnecting in 5s');
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (err) => {
      this.logger.error(`AgentClient WS error: ${err.message}`);
    });
  }

  /** Register a callback for incoming messages */
  listen(callback: (msg: PlatformMessage) => void) {
    this.listeners.push(callback);
  }

  /** Send type=info */
  async send(content: string) {
    return this.post('info', content);
  }

  /** Send type=question */
  async ask(content: string) {
    return this.post('question', content);
  }

  /** Send type=answer */
  async reply(content: string) {
    return this.post('answer', content);
  }

  /** Send type=event with JSON payload */
  async event(payload: Record<string, any>) {
    return this.post('event', JSON.stringify({
      ...payload,
      triggered_by: 'WINDSURF',
      timestamp: new Date().toISOString(),
      source: 'Project Milestone Management System',
    }));
  }

  /** Send type=command */
  async command(content: string) {
    return this.post('command', content);
  }

  /** Validate token and get agent identity — GET /agent/ping */
  async ping(): Promise<{ valid: boolean; agent_id: string; agent_name: string; project_id: string; rooms: string[]; message: string }> {
    if (!this.token) throw new Error('AgentClient not initialized');
    const res = await firstValueFrom<any>(
      this.http.get(`${PLATFORM_BASE}/agent/ping`, {
        headers: { Authorization: `Bearer ${this.token}` },
      }),
    );
    return res.data;
  }

  /** Discover all rooms available to token with ws_url + http_messages_url — GET /agent/rooms */
  async rooms(): Promise<{ agent: string; rooms: Array<{ name: string; id: string; ws_url: string; http_messages_url: string }> }> {
    if (!this.token) throw new Error('AgentClient not initialized');
    const res = await firstValueFrom<any>(
      this.http.get(`${PLATFORM_BASE}/agent/rooms`, {
        headers: { Authorization: `Bearer ${this.token}` },
      }),
    );
    return res.data;
  }

  /** Fetch message history (returns oldest-first) */
  async history(limit = 50): Promise<PlatformMessage[]> {
    if (!this.token || !this.room) return [];
    const res = await firstValueFrom<any>(
      this.http.get(`${PLATFORM_BASE}/messages/${this.room}?limit=${limit}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      }),
    );
    return [...(res.data as PlatformMessage[])].reverse();
  }

  private async post(type: string, content: string) {
    if (!this.token || !this.room) throw new Error('AgentClient not initialized');
    const res = await firstValueFrom<any>(
      this.http.post(
        `${PLATFORM_BASE}/message`,
        { room: this.room, type, content },
        { headers: { Authorization: `Bearer ${this.token}` } },
      ),
    );
    return res.data;
  }

  onModuleDestroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) { this.ws.removeAllListeners(); this.ws.close(); }
  }
}
