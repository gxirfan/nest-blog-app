export interface IUserBaseProfile {
  id: number;
  username: string;
  nickname: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  email: string;
  birthDate: Date;
  avatar: string | null;
  cover: string | null;
  location: string | null;
  gender: string | null;
}
