import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: (process.env.FRONTEND_URLS ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  },
})
export class InventoryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(InventoryGateway.name);
  private connectedUsers = new Map<string, { userId: string; role: string }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }

    return null;
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(
          `Rejected inventory WebSocket connection ${client.id}: missing token`,
        );
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        token,
        {
          secret:
            this.configService.get<string>('jwt.accessSecret') ??
            'fallback-secret',
        },
      );
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        this.logger.warn(
          `Rejected inventory WebSocket connection ${client.id}: inactive user`,
        );
        client.disconnect(true);
        return;
      }

      client.data.user = user;
      this.connectedUsers.set(client.id, { userId: user.id, role: user.role });
      client.join(`user_${user.id}`);

      if (user.role === 'admin' || user.role === 'manager') {
        client.join('inventory_admins');
      }

      this.logger.log(`User ${user.id} connected to inventory WebSocket`);
    } catch (error) {
      this.logger.warn(
        `Rejected inventory WebSocket connection ${client.id}: invalid token`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    this.logger.log(`Client disconnected from inventory WebSocket`);
  }

  // Broadcast inventory updates to relevant users
  broadcastInventoryUpdate(projectId: string, data: any) {
    // Send to all connected users (global inventory)
    this.server.emit('inventory_update', data);

    // Send project-specific updates
    this.server.emit(`project_${projectId}_inventory`, data);
  }

  // Broadcast stock movements
  broadcastStockMovement(projectId: string, data: any) {
    this.server.emit('stock_movement', data);
    this.server.emit(`project_${projectId}_stock_movement`, data);
  }

  // Broadcast low stock alerts
  broadcastLowStockAlert(data: any) {
    this.server.emit('low_stock_alert', data);
    // Also send to admins/managers specifically
    this.server.to('inventory_admins').emit('critical_low_stock', data);
  }

  @SubscribeMessage('subscribe_inventory')
  handleSubscribeInventory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId?: string },
  ) {
    if (data.projectId) {
      client.join(`project_${data.projectId}_inventory`);
      client.emit('subscribed', {
        type: 'project_inventory',
        projectId: data.projectId,
      });
    } else {
      client.join('global_inventory');
      client.emit('subscribed', { type: 'global_inventory' });
    }
  }

  @SubscribeMessage('unsubscribe_inventory')
  handleUnsubscribeInventory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId?: string },
  ) {
    if (data.projectId) {
      client.leave(`project_${data.projectId}_inventory`);
    } else {
      client.leave('global_inventory');
    }
    client.emit('unsubscribed', { type: 'inventory' });
  }
}
