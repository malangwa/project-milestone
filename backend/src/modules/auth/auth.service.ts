import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is inactive');
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async refresh(userId: string, refreshToken: string) {
    const stored = await this.refreshTokenRepo.findOne({
      where: { userId, isRevoked: false },
      order: { createdAt: 'DESC' },
    });
    if (!stored) throw new UnauthorizedException('Invalid refresh token');
    const isValid = await bcrypt.compare(refreshToken, stored.tokenHash);
    if (!isValid || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
    await this.refreshTokenRepo.update(stored.id, { isRevoked: true });
    const user = await this.usersService.findById(userId);
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const foundUser = await this.usersService.findById(userId);
    const user = await this.usersService.findByEmail(foundUser.email);
    if (!user) throw new UnauthorizedException('User not found');
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch)
      throw new UnauthorizedException('Current password is incorrect');
    const newHash = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(userId, { passwordHash: newHash } as any);
    return { message: 'Password changed successfully' };
  }

  async logout(userId: string) {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(sub: string, email: string, role: string) {
    const payload = { sub, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessSecret'),
        expiresIn: this.configService.get('jwt.accessExpiry'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiry'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const entity = this.refreshTokenRepo.create({
      userId,
      tokenHash,
      expiresAt,
    });
    return this.refreshTokenRepo.save(entity);
  }
}
