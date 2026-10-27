/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useTranslate } from '@cloudbeaver/core-blocks';
import type { AdminUserTeamInfo } from '@cloudbeaver/core-sdk';

interface Props {
  grant: { grantType?: `${AdminUserTeamInfo['grantType']}`; grantedBy?: AdminUserTeamInfo['grantedBy'] } | undefined;
}

export const TeamGrantSource = observer<Props>(function TeamGrantSource({ grant }) {
  const translate = useTranslate();

  function getLabel(): string {
    if (!grant) {
      return translate('plugin_authentication_administration_team_grant_none');
    }

    switch (grant.grantType ?? 'MANUAL') {
      case 'AUTH_PROVIDER': {
        const label = translate('plugin_authentication_administration_team_grant_provider');
        return grant.grantedBy ? `${label}: ${grant.grantedBy}` : label;
      }
      case 'DEFAULT':
        return translate('plugin_authentication_administration_team_grant_default');
      case 'MANUAL':
        return translate('plugin_authentication_administration_team_grant_manual');
      default:
        return '-';
    }
  }

  function getTooltip(): string | undefined {
    switch (grant?.grantType) {
      case 'AUTH_PROVIDER':
        return translate('plugin_authentication_administration_team_grant_provider_tooltip');
      case 'DEFAULT':
        return translate('plugin_authentication_administration_team_grant_default_tooltip');
      default:
        return undefined;
    }
  }

  return <span title={getTooltip()}>{getLabel()}</span>;
});
