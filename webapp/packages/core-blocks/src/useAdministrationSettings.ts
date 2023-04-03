/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EAdminPermission } from '@cloudbeaver/core-authentication';
import { ServerConfigResource } from '@cloudbeaver/core-root';

import { useResource } from './ResourcesHooks/useResource';
import { usePermission } from './usePermission';


interface IAdministrationSettings {
  credentialsSavingEnabled: boolean;
}

function getCredentialsSavingSetting(config: ServerConfigResource, isAdmin: boolean) {
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
  const { resource: serverConfigResource } = useResource(useAdministrationSettings, ServerConfigResource, undefined);

  return {
    credentialsSavingEnabled: getCredentialsSavingSetting(serverConfigResource, isAdmin),
  };
}
