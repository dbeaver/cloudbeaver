/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useService } from '@cloudbeaver/core-di';

import { VersionService } from './VersionService.js';

export function useAppVersion(short = false) {
  const versionService = useService(VersionService);
  return versionService.getProductVersion(short);
}
