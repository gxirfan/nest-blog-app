import { SearchLog } from '@prisma/client';
import { IAuditFields } from 'src/common/interfaces/common.interface';

export class SearchLogEntity implements SearchLog, IAuditFields {
  id: number;
  query: string;
  userId: number | null;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}
