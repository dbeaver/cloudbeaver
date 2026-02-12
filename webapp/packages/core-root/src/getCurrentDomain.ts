/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ServerConfig } from './ServerConfigResource.js';

// backend sorts supported hosts by priority, so the first one is the default domain
export function getCurrentDomain(serverConfig: ServerConfig | null): string | null {
  if (!serverConfig) {
    return null;
  }

  const defaultDomain = serverConfig.supportedHosts[0];

  if (serverConfig.supportedHosts.length && defaultDomain) {
    return defaultDomain;
  }

  return null;
}
