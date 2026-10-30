/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { AdminUserTeamInfo } from '@cloudbeaver/core-sdk';

export interface ITeamGrantSource {
  grantType?: `${AdminUserTeamInfo['grantType']}`;
  grantedBy?: AdminUserTeamInfo['grantedBy'];
}

export function useTeamGrantLabel() {
  const translate = useTranslate();
  const providers = useResource(useTeamGrantLabel, AuthProvidersResource, CachedMapAllKey);

  return function getTeamGrantLabel(grant: ITeamGrantSource | undefined): string {
    if (!grant) {
      return '-';
    }

    switch (grant.grantType ?? 'MANUAL') {
      case 'AUTH_PROVIDER': {
        const label = translate('plugin_authentication_administration_team_grant_provider');
        const providerName = (grant.grantedBy && providers.resource.get(grant.grantedBy)?.label) || grant.grantedBy;

        return providerName ? `${label} (${providerName})` : label;
      }
      case 'DEFAULT':
        return translate('plugin_authentication_administration_team_grant_default');
      case 'MANUAL':
        return translate('plugin_authentication_administration_team_grant_manual');
      default:
        return '-';
    }
  };
}
