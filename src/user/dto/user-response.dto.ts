import { IAuditFields } from 'src/common/interfaces/common.interface';
import { IUserBaseProfile } from '../interfaces/user-base-response.interface';

export class UserResponseDto implements IUserBaseProfile, IAuditFields {
  id: number;
  username: string;
  nickname: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  email: string;
  isEmailVerified: boolean;
  isEmailPublic: boolean;
  role: string;
  status: string;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
  birthDate: Date;
  avatar: string | null;
  cover: string | null;
  location: string | null;
  gender: string | null;
}

export class UserResponseWithRecoveryCodesDto
  implements IUserBaseProfile, IAuditFields
{
  id: number;
  username: string;
  nickname: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  email: string;
  recoveryCodes: string[];
  createdAt: Date;
  updatedAt: Date;
  isEmailVerified: boolean;
  isEmailPublic: boolean;
  role: string;
  status: string;
  lastLoginAt: Date;
  birthDate: Date;
  avatar: string | null;
  cover: string | null;
  location: string | null;
  gender: string | null;
}
