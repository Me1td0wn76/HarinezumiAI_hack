import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** ログイン必須のエンドポイントに付ける */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
