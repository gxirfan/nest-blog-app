import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateContactDto {
  @IsNotEmpty({ message: 'name is required' })
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(100)
  email: string;

  @IsNotEmpty({ message: 'subject is required' })
  @IsString()
  @MaxLength(150)
  subject: string;

  @IsNotEmpty({ message: 'message is required' })
  @IsString()
  @MaxLength(1000)
  message: string;

  @IsString()
  @IsOptional()
  slug: string;
}
