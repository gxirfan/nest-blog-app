import { IAuditFields } from 'src/common/interfaces/common.interface';
import { UserGender, UserRole, UserStatus } from '../schemas/user.schema';

export interface IUser extends IAuditFields {
  id: string;
  username: string;
  nickname: string;
  firstName: string;
  lastName: string;
  bio?: string;
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
  avatar?: string;
  cover?: string;
  location?: string;
  gender?: UserGender;
  lastLoginAt: Date;
}
