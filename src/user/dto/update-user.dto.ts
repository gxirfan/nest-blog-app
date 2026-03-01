import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole, UserStatus, UserGender } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsAgeValid } from '../validators/min-age-custom.validator';

export class BaseUpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @Matches(/^\S+$/, {
    message: 'Username cannot contain spaces.',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  nickname?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  bio?: string;

  @IsOptional()
  @IsEmail()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  email?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @IsAgeValid({
    message: 'Identity Access Denied: Minimum age requirement is 18.',
  })
  @Transform(({ value }: { value: string | Date }) => {
    if (!value || value === '') return undefined;
    return new Date(value);
  })
  birthDate?: Date;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  avatar?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  cover?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  location?: string;

  @IsOptional()
  @IsEnum(UserGender)
  @Transform(({ value }: { value: string }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : (value.toUpperCase() as UserGender),
  )
  gender?: UserGender;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value,
  )
  isEmailPublic?: boolean;
}

//update
export class UpdateMeDto extends BaseUpdateUserDto {}

//admin
export class UpdateUserByAdminDto extends BaseUpdateUserDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(UserRole)
  role?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(UserStatus)
  status?: string;
}

export class UpdateUserPasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(250)
  oldPassword: string;

  @IsString()
  @MinLength(6)
  @MaxLength(250)
  newPassword: string;
}
