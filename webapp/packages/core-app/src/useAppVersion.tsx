import { useService } from '@cloudbeaver/core-di';
import { ServerService } from '@cloudbeaver/core-root';

interface IAppVersion {
  backendVersion: string;
  frontendVersion: string;
}
declare const _VERSION_: string | undefined;
export function useAppVersion(short = false): IAppVersion {
  const serverService = useService(ServerService);
  let backendVersion = serverService.config.data?.version || '';
  let frontendVersion = _VERSION_ || '';

  if (short) {
    backendVersion = backendVersion.slice(0, 5);
    frontendVersion = frontendVersion.slice(0, 5);
  }
  return { backendVersion, frontendVersion };
}
