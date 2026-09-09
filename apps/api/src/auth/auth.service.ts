import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { permissionKey } from './permission.constant.js';

export type AuthenticatedUser = {
  id: string;
  loginId: string;
  fullName: string;
  permissions: string[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(loginId: string, password: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { loginId },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });

    if (!user || !user.active) {
      await this.audit.log({
        module: 'auth',
        action: 'login',
        description: `Failed login attempt for login-id "${loginId}" — account not found or inactive`,
        outcome: 'denied',
        ipAddress,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      await this.audit.log({
        userId: user.id,
        module: 'auth',
        action: 'login',
        description: 'Failed login attempt — incorrect password',
        outcome: 'denied',
        ipAddress,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = Array.from(
      new Set(
        user.roles.flatMap((userRole) =>
          userRole.role.permissions.map((rp) => permissionKey(rp.permission.module, rp.permission.action)),
        ),
      ),
    );

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      loginId: user.loginId,
      fullName: user.fullName,
      permissions,
    };

    const accessToken = await this.jwt.signAsync(authenticatedUser);

    await this.audit.log({
      userId: user.id,
      module: 'auth',
      action: 'login',
      description: `Successful login for "${user.loginId}"`,
      outcome: 'success',
      ipAddress,
    });

    return { accessToken, user: authenticatedUser };
  }
}
