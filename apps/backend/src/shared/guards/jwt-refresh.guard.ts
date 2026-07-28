import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guard untuk endpoint POST /auth/refresh — pakai JWT refresh strategy */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
