import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserGender } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsAgeValid } from '../validators/min-age-custom.validator';

export class CreateUserRequestDto {
  @IsString()
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @Matches(/^\S+$/, {
    message: 'Username cannot contain spaces.',
  })
  @MinLength(3, { message: 'Username must be at least 3 characters long.' })
  @MaxLength(50, { message: 'Username must be at most 50 characters long.' })
  username: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') return undefined;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  nickname?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') return undefined;
    return value.trim().replace(/\s+/g, ' ');
  })
  @MaxLength(50, { message: 'First name must be at most 50 characters long.' })
  firstName?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') return undefined;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  @MaxLength(50, { message: 'Last name must be at most 50 characters long.' })
  lastName?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') return undefined;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  bio?: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email is required.' })
  @MinLength(1, { message: 'Email must be at least 1 character long.' })
  @MaxLength(100, { message: 'Email must be at most 100 characters long.' })
  email: string;

  @IsNotEmpty({ message: 'Birth date is required.' })
  @Type(() => Date)
  @IsDate()
  @IsAgeValid({
    message: 'Identity Access Denied: Minimum age requirement is 18.',
  })
  birthDate: Date;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string | null }) =>
    value === null ? undefined : value,
  )
  avatar?: string | null;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string | null }) =>
    value === null ? undefined : value,
  )
  cover?: string | null;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') return undefined;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  location?: string;

  @IsEnum(UserGender)
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') return undefined;
    const upperValue = value.trim().toUpperCase();
    return upperValue === '' ? undefined : upperValue;
  })
  gender?: UserGender;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @MaxLength(250, { message: 'Password must be at most 250 characters long.' })
  password: string;
}
