import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CensorService } from './censor.service';

@Injectable()
export class CensorInterceptor implements NestInterceptor {
  constructor(private readonly censorService: CensorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    const fieldsToCensor = ['content', 'title', 'bio', 'description'];

    for (const field of fieldsToCensor) {
      if (body[field] && typeof body[field] === 'string') {
        if (field === 'content' && body[field].includes('data:image')) {
          body[field] = this.safeCensor(body[field]);
        } else {
          body[field] = this.censorService.censor(body[field]);
        }
      }
    }

    return next.handle();
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
