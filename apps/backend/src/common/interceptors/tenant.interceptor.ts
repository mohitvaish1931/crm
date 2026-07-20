import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantContext } from '../../context/tenant-context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // In Sprint 1, Tenant ID is extracted from the authenticated user (JWT)
    // If not authenticated, tenantId will be undefined.
    const tenantId = request.user?.tenantId;

    return tenantContext.run({ tenantId }, () => {
      return next.handle();
    });
  }
}
