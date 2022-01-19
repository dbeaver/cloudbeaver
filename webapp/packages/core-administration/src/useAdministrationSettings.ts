/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';
import { usePermission, ServerService } from '@cloudbeaver/core-root';
import type { ServerConfig } from '@cloudbeaver/core-sdk';

import { EAdminPermission } from './EAdminPermission';

interface IAdministrationSettings {
  credentialsSavingEnabled: boolean;
}

function getCredentialsSavingSetting(config: ServerConfig, isAdmin: boolean) {
  if (config.configurationMode) {
    return true;
  }

  if (!config.adminCredentialsSaveEnabled!) {
    return false;
  }

  if (isAdmin) {
    return true;
  }

  return config.publicCredentialsSaveEnabled!;
}

export function useAdministrationSettings(): IAdministrationSettings {
  const isAdmin = usePermission(EAdminPermission.admin);
  const serverService = useService(ServerService);
  const config = serverService.config.data;

  if (!config) {
    throw new Error("Can't get credentials save permission");
  }

  return {
    credentialsSavingEnabled: getCredentialsSavingSetting(config, isAdmin),
  };
}
