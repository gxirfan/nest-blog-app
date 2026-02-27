import { IAuditFields } from 'src/common/interfaces/common.interface';
import { UserGender, UserRole, UserStatus } from '@prisma/client';

export interface IUser extends IAuditFields {
  id: string;
  username: string | null;
  nickname: string | null;
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  email: string;
  isEmailVerified: boolean;
  isEmailPublic: boolean;
  passwordHash: string;
  resetPasswordToken?: string | undefined;
  resetPasswordExpiresAt?: Date | undefined;
  recoveryCodes?: string[];
  role: UserRole;
  status: UserStatus;
  birthDate: Date;
  avatar?: string | null;
  cover?: string | null;
  location?: string | null;
  gender?: UserGender | null;
  lastLoginAt: Date;
}
