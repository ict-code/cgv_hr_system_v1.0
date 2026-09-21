import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateBrandingDto } from './dto/update-branding.dto.js';
import type { UploadLogoDto } from './dto/upload-logo.dto.js';

const ID = 'default';
const DEFAULTS = { title: 'CGV - HRAS', subtitle: 'City Government of Vigan' };

@Injectable()
export class BrandingService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const row = await this.prisma.appBranding.findUnique({
      where: { id: ID },
      select: { title: true, subtitle: true, logoMime: true, updatedAt: true },
    });
    return {
      title: row?.title ?? DEFAULTS.title,
      subtitle: row?.subtitle ?? DEFAULTS.subtitle,
      hasLogo: !!row?.logoMime,
      updatedAt: row?.updatedAt ?? null,
    };
  }

  getLogo() {
    return this.prisma.appBranding.findUnique({ where: { id: ID }, select: { logoData: true, logoMime: true } });
  }

  async update(dto: UpdateBrandingDto) {
    await this.prisma.appBranding.upsert({
      where: { id: ID },
      update: dto,
      create: { id: ID, ...dto },
    });
    return this.get();
  }

  async setLogo(dto: UploadLogoDto) {
    const logoData = Buffer.from(dto.data, 'base64');
    await this.prisma.appBranding.upsert({
      where: { id: ID },
      update: { logoData, logoMime: dto.mime },
      create: { id: ID, ...DEFAULTS, logoData, logoMime: dto.mime },
    });
    return this.get();
  }
}
