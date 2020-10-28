import { useService } from '@cloudbeaver/core-di';
import { ServerService } from '@cloudbeaver/core-root';

declare const _VERSION_: string;
export const useAppVersion = (short = false): { backendVersion: string; frontendVersion: string } => {
  const serverService = useService(ServerService);
  let backendVersion = serverService.config.data?.version || '';
  let frontendVersion = _VERSION_ || '';

  if (short) {
    backendVersion = backendVersion.slice(0, 5);
    frontendVersion = frontendVersion.slice(0, 5);
  }
  return { backendVersion, frontendVersion };
};
