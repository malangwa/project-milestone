import { io, Socket } from 'socket.io-client';

const resolveWebSocketUrl = () => {
  const explicitUrl = import.meta.env.VITE_WS_URL;
  if (explicitUrl) return explicitUrl;

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) return 'http://localhost:3000';

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return 'http://localhost:3000';
  }
};

const websocketUrl = resolveWebSocketUrl();

export type InventoryEvent = {
  type: 'stock_adjustment' | 'goods_receipt' | 'stock_in' | 'stock_out';
  item: any;
  movement: any;
  oldQuantity?: number;
  newQuantity?: number;
  projectId: string;
  receiptId?: string;
  quantity?: number;
};

export type StockMovementEvent = {
  type: 'stock_in' | 'stock_out' | 'adjustment';
  item: any;
  movement: any;
  quantity: number;
  projectId: string;
};

export type LowStockAlertEvent = {
  type: 'low_stock';
  item: any;
  projectId: string;
  currentQuantity: number;
  reorderLevel: number;
};

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.socket = io(websocketUrl, {
        auth: {
          token: token.replace('Bearer ', ''),
        },
        transports: ['websocket'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to inventory WebSocket');
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from inventory WebSocket');
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.socket?.connect();
          }, this.reconnectDelay * this.reconnectAttempts);
        } else {
          reject(new Error('Failed to connect to WebSocket after multiple attempts'));
        }
      });

      // Auto-reconnect
      this.socket.io.on('reconnect', (attemptNumber: number) => {
        console.log(`Reconnected after ${attemptNumber} attempts`);
        this.reconnectAttempts = 0;
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to inventory updates
  subscribeToInventory(projectId?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_inventory', { projectId });
    }
  }

  unsubscribeFromInventory(projectId?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_inventory', { projectId });
    }
  }

  // Event listeners
  onInventoryUpdate(callback: (data: InventoryEvent) => void): void {
    if (this.socket) {
      this.socket.on('inventory_update', callback);
    }
  }

  onStockMovement(callback: (data: StockMovementEvent) => void): void {
    if (this.socket) {
      this.socket.on('stock_movement', callback);
    }
  }

  onLowStockAlert(callback: (data: LowStockAlertEvent) => void): void {
    if (this.socket) {
      this.socket.on('low_stock_alert', callback);
    }
  }

  onCriticalLowStock(callback: (data: LowStockAlertEvent) => void): void {
    if (this.socket) {
      this.socket.on('critical_low_stock', callback);
    }
  }

  // Remove event listeners
  offInventoryUpdate(callback?: (data: InventoryEvent) => void): void {
    if (this.socket) {
      this.socket.off('inventory_update', callback);
    }
  }

  offStockMovement(callback?: (data: StockMovementEvent) => void): void {
    if (this.socket) {
      this.socket.off('stock_movement', callback);
    }
  }

  offLowStockAlert(callback?: (data: LowStockAlertEvent) => void): void {
    if (this.socket) {
      this.socket.off('low_stock_alert', callback);
    }
  }

  offCriticalLowStock(callback?: (data: LowStockAlertEvent) => void): void {
    if (this.socket) {
      this.socket.off('critical_low_stock', callback);
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const webSocketService = new WebSocketService();
