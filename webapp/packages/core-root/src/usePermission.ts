import { useService } from '@cloudbeaver/core-di';

import { PermissionsService } from './PermissionsService';

export function usePermission(key: string) {
  const permissionsService = useService(PermissionsService);

  return permissionsService.has(key);
}
