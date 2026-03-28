import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InventoryGateway } from './inventory.gateway';
import { UsersService } from '../users/users.service';

describe('InventoryGateway', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;

  const usersService = {
    findById: jest.fn(),
  } as unknown as UsersService;

  let gateway: InventoryGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new InventoryGateway(jwtService, configService, usersService);
  });

  it('authenticates clients with a JWT from the socket auth payload', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'user-1' });
    (usersService.findById as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'manager',
      isActive: true,
    });

    const client = {
      id: 'socket-1',
      handshake: { auth: { token: 'jwt-token' }, headers: {} },
      data: {},
      join: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('jwt-token', {
      secret: 'test-secret',
    });
    expect(usersService.findById).toHaveBeenCalledWith('user-1');
    expect(client.data.user).toEqual(expect.objectContaining({ id: 'user-1' }));
    expect(client.join).toHaveBeenCalledWith('user_user-1');
    expect(client.join).toHaveBeenCalledWith('inventory_admins');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('rejects clients when the token is missing', async () => {
    const client = {
      id: 'socket-2',
      handshake: { auth: {}, headers: {} },
      data: {},
      join: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('rejects clients when JWT verification fails', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
      new Error('bad token'),
    );

    const client = {
      id: 'socket-3',
      handshake: { auth: { token: 'bad-token' }, headers: {} },
      data: {},
      join: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(usersService.findById).not.toHaveBeenCalled();
  });
});
