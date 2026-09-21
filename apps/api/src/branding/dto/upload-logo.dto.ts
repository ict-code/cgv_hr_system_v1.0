import { IsIn, IsString, MaxLength } from 'class-validator';

export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export class UploadLogoDto {
  @IsIn(LOGO_MIME_TYPES)
  mime!: (typeof LOGO_MIME_TYPES)[number];

  // base64, ~1MB of image => ~1.4M chars
  @IsString()
  @MaxLength(1_500_000)
  data!: string;
}
