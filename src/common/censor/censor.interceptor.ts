import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CensorService } from './censor.service';

@Injectable()
export class CensorInterceptor implements NestInterceptor {
  private readonly fieldsToCensor = [
    'content',
    'title',
    'bio',
    'description',
    'username',
    'nickname',
    'firstName',
    'lastName',
    'location',
  ];

  constructor(private readonly censorService: CensorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      this.processData(request.body);
    }

    return next.handle().pipe(
      map((data) => {
        return this.processData(data);
      }),
    );
  }

  private processData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.processData(item));
    }

    for (const field of this.fieldsToCensor) {
      if (data[field] && typeof data[field] === 'string') {
        if (field === 'content' && data[field].includes('data:image')) {
          data[field] = this.safeCensor(data[field]);
        } else {
          data[field] = this.censorService.censor(data[field]);
        }
      }
    }

    return data;
  }

  private safeCensor(content: string): string {
    const imgPlaceholderMap = new Map<string, string>();
    let counter = 0;

    const protectedContent = content.replace(
      /<img[^>]*src="data:image\/[^">]+"[^>]*>/g,
      (match) => {
        const placeholder = `__IMG_PLACEHOLDER_${counter}__`;
        imgPlaceholderMap.set(placeholder, match);
        counter++;
        return placeholder;
      },
    );

    let censoredContent = this.censorService.censor(protectedContent);

    imgPlaceholderMap.forEach((originalImg, placeholder) => {
      censoredContent = censoredContent.replace(placeholder, originalImg);
    });

    return censoredContent;
  }
}
