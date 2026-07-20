import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ConflictException } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
// Note: Assuming a generic Cache service mapping to Redis. Using an in-memory Map for fallback/testing.
const redisMock = new Map<string, { status: string, response?: any }>();

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      return next.handle();
    }

    const tenantId = request.user?.tenantId || 'system';
    const cacheKey = `idempotency:${tenantId}:${idempotencyKey}`;

    const existingState = redisMock.get(cacheKey);

    if (existingState) {
      if (existingState.status === 'IN_PROGRESS') {
        // Industry standard: Wait for Request A to complete and return the same response
        for (let i = 0; i < 50; i++) {
          await new Promise(resolve => setTimeout(resolve, 100)); // poll every 100ms
          const checkState = redisMock.get(cacheKey);
          if (checkState?.status === 'COMPLETED') {
            return of(checkState.response);
          }
        }
        throw new ConflictException('Idempotency timeout: original request took too long');
      }
      if (existingState.status === 'COMPLETED') {
        return of(existingState.response);
      }
    }

    redisMock.set(cacheKey, { status: 'IN_PROGRESS' });

    return next.handle().pipe(
      tap((response) => {
        redisMock.set(cacheKey, { status: 'COMPLETED', response });
      })
    );
  }
}
