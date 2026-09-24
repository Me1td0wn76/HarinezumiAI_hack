import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthResponse } from '@lt/shared';
import { compare, hash } from 'bcryptjs';
import type { User } from '../../generated/prisma/client.js';
import { UsersRepository } from '../users/users.repository.js';
import { toUserDto } from '../users/users.mapper.js';
import type { JwtPayload } from './jwt.strategy.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new ConflictException('このメールアドレスは既に登録されています');
    }
    const user = await this.users.create({
      email,
      passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
      displayName: dto.displayName,
    });
    return this.issue(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email.toLowerCase());
    // ユーザーの有無で応答を変えない（メールアドレスの存在を推測させない）
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException(
        'メールアドレスまたはパスワードが違います',
      );
    }
    return this.issue(user);
  }

  private issue(user: User): AuthResponse {
    const payload: JwtPayload = { sub: user.id };
    return { accessToken: this.jwt.sign(payload), user: toUserDto(user) };
  }
}
