import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserGender } from '../schemas/user.schema';
import { Transform, Type } from 'class-transformer';

export class CreateUserRequestDto {
  @IsString()
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  @MinLength(3, { message: 'Username must be at least 3 characters long.' })
  @MaxLength(50, { message: 'Username must be at most 50 characters long.' })
  username: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  nickname?: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  @MinLength(1, { message: 'First name must be at least 1 character long.' })
  @MaxLength(50, { message: 'First name must be at most 50 characters long.' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required.' })
  @MinLength(1, { message: 'Last name must be at least 1 character long.' })
  @MaxLength(50, { message: 'Last name must be at most 50 characters long.' })
  lastName: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  bio?: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email is required.' })
  @MinLength(1, { message: 'Email must be at least 1 character long.' })
  @MaxLength(100, { message: 'Email must be at most 100 characters long.' })
  email: string;

  @IsDate()
  @IsNotEmpty({ message: 'Birth date is required.' })
  @Type(() => Date)
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
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  location?: string;

  @IsEnum(UserGender)
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  gender?: UserGender;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @MaxLength(250, { message: 'Password must be at most 250 characters long.' })
  password: string;
}
