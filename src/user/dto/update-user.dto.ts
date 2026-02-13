import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole, UserStatus, UserGender } from '../schemas/user.schema';
import { Transform } from 'class-transformer';

export class BaseUpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  nickname?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  bio?: string;

  @IsOptional()
  @IsEmail()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  email?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  avatar?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  cover?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  location?: string;

  @IsOptional()
  @IsEnum(UserGender)
  @Transform(({ value }) => (value === '' ? undefined : value))
  gender?: UserGender;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === '' ? undefined : value))
  isEmailPublic?: boolean;
}

//update
export class UpdateMeDto extends BaseUpdateUserDto {}

//admin
export class UpdateUserByAdminDto extends BaseUpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: string;

  @IsOptional()
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
