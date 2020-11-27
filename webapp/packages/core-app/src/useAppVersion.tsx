import { useService } from '@cloudbeaver/core-di';
import { ServerService } from '@cloudbeaver/core-root';

interface IAppVersion {
  backendVersion: string;
  frontendVersion: string;
}

declare const _VERSION_: string | undefined;
const VERSION_REGEX = /(\d+\.\d+\.\d+)/;

export function useAppVersion(short = false): IAppVersion {
  const serverService = useService(ServerService);
  let backendVersion = serverService.config.data?.version || '';
  let frontendVersion = _VERSION_ || '';

  if (short) {
    backendVersion = VERSION_REGEX.exec(backendVersion)?.[1] ?? backendVersion;
    frontendVersion = VERSION_REGEX.exec(frontendVersion)?.[1] ?? frontendVersion;
  }
  return { backendVersion, frontendVersion };
}
