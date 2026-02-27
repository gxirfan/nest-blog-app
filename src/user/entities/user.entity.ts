import { User, UserRole, UserStatus, UserGender } from '@prisma/client';
import { IAuditFields } from 'src/common/interfaces/common.interface';

export class UserEntity implements User, IAuditFields {
  id: number;
  username: string;
  nickname: string;
  email: string;
  passwordHash: string;
  avatar: string | null;
  cover: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  gender: UserGender | null;
  location: string | null;
  birthDate: Date;
  isEmailVerified: boolean;
  isEmailPublic: boolean;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date;
  recoveryCodes: string[];
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken: string | null;
  resetPasswordExpiresAt: Date | null;
}
