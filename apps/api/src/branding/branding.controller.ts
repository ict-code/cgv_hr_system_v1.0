import { BadRequestException, Body, Controller, Get, NotFoundException, Put, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { BrandingService } from './branding.service.js';
import { UpdateBrandingDto } from './dto/update-branding.dto.js';
import { UploadLogoDto } from './dto/upload-logo.dto.js';

const MAX_LOGO_BYTES = 1_000_000;

@Controller('branding')
export class BrandingController {
  constructor(private readonly branding: BrandingService) {}

  // Public on purpose: it's the app's own name/logo, shown the same to everyone.
  @Get()
  get() {
    return this.branding.get();
  }

  @Get('logo')
  async logo(@Res() res: Response) {
    const row = await this.branding.getLogo();
    if (!row?.logoData || !row.logoMime) throw new NotFoundException('No logo uploaded');
    res.set({ 'Content-Type': row.logoMime, 'Cache-Control': 'public, max-age=300' });
    res.send(Buffer.from(row.logoData));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('branding:edit')
  @Put()
  update(@Body() dto: UpdateBrandingDto) {
    return this.branding.update(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('branding:edit')
  @Put('logo')
  setLogo(@Body() dto: UploadLogoDto) {
    if (Buffer.byteLength(dto.data, 'base64') > MAX_LOGO_BYTES) {
      throw new BadRequestException('Logo must be 1 MB or smaller');
    }
    return this.branding.setLogo(dto);
  }
}
