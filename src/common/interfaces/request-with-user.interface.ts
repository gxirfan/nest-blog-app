import { Request } from 'express';

interface IRequestWithUser extends Request {
  user?: {
    id: string;
  };
}

export default IRequestWithUser;
