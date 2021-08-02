/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';
import { ServerService } from '@cloudbeaver/core-root';
import { GlobalConstants } from '@cloudbeaver/core-utils';

interface IAppVersion {
  backendVersion: string;
  frontendVersion: string;
}

const VERSION_REGEX = /(\d+\.\d+\.\d+)/;

export function useAppVersion(short = false): IAppVersion {
  const serverService = useService(ServerService);
  let backendVersion = serverService.config.data?.version || '';
  let frontendVersion = GlobalConstants.version || '';

  if (short) {
    backendVersion = VERSION_REGEX.exec(backendVersion)?.[1] ?? backendVersion;
    frontendVersion = VERSION_REGEX.exec(frontendVersion)?.[1] ?? frontendVersion;
  }
  return { backendVersion, frontendVersion };
}
