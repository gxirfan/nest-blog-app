import { PassportSerializer } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { Injectable } from '@nestjs/common';
import { UserResponseDto } from '../user/dto/user-response.dto';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly userService: UserService) {
    super();
  }

  serializeUser(
    user: any,
    done: (err: Error | null, id: string | null) => void,
  ): void {
    try {
      const userId = user?.id?.toString();

      if (!userId) {
        console.error(user);
        return done(new Error('User ID not found during serialization'), null);
      }

      done(null, userId);
    } catch (e) {
      console.error(e);
      done(e, null);
    }
  }

  async deserializeUser(
    payload: string,
    done: (err: Error | null, user: any) => void,
  ): Promise<void> {
    try {
      const id = Number(payload);

      const user = await this.userService.findOneById(id);

      if (!user) {
        return done(null, null);
      }

      const { passwordHash, recoveryCodes, ...cleanUser } = user;

      done(null, cleanUser);
    } catch (e) {
      console.error(e);
      done(e, null);
    }
  }
}
