import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  // Capped at 1000 — matches apiFetchAll's own "give me everything" page size
  // on the frontend (apps/web/lib/api.ts), so legitimate full-list fetches
  // still work while an arbitrarily large pageSize can't force a full table
  // scan/response.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  pageSize: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};
