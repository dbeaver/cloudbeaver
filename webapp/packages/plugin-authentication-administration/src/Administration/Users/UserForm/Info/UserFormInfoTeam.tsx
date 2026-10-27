/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import { FieldCheckbox, useTranslate } from '@cloudbeaver/core-blocks';
import type { AdminUserTeamInfo } from '@cloudbeaver/core-sdk';

import type { UserFormInfoPart } from './UserFormInfoPart.js';

interface Props {
  id: string;
  team: TeamInfo;
  grant: Pick<AdminUserTeamInfo, 'grantType' | 'grantedBy'> | undefined;
  state: UserFormInfoPart['state'];
  isDefault: boolean;
  disabled: boolean;
}

export const UserFormInfoTeam = observer<Props>(function UserFormInfoTeam({ id, team, grant, state, isDefault, disabled }) {
  const translate = useTranslate();
  const grantType = isDefault ? 'DEFAULT' : (grant?.grantType ?? 'MANUAL');
  const isGranted = isDefault || state.teams.includes(team.teamId);

  function getLabel(): string {
    return `${team.teamId}${team.teamName && team.teamName !== team.teamId ? ' (' + team.teamName + ')' : ''}`;
  }

  function getCaption(): string | undefined {
    if (!isGranted) {
      return undefined;
    }

    switch (grantType) {
      case 'AUTH_PROVIDER': {
        const label = translate('plugin_authentication_administration_team_grant_provider');
        return grant?.grantedBy ? `${label}: ${grant.grantedBy}` : label;
      }
      case 'DEFAULT':
        return translate('plugin_authentication_administration_team_grant_default');
      case 'MANUAL':
        return translate('plugin_authentication_administration_team_grant_manual');
      default:
        return '-';
    }
  }

  function getTooltip(): string {
    const tooltip = `${getLabel()}${team.description ? '\n' + team.description : ''}`;

    if (isDefault) {
      return `${tooltip}\n${translate('plugin_authentication_administration_team_grant_default_tooltip')}\n${translate('plugin_authentication_administration_user_team_default_readonly_tooltip')}`;
    }

    if (isGranted && grantType === 'AUTH_PROVIDER') {
      return `${tooltip}\n${translate('plugin_authentication_administration_team_grant_provider_tooltip')}`;
    }

    return tooltip;
  }

  return (
    <FieldCheckbox
      id={id}
      title={getTooltip()}
      label={getLabel()}
      name="teams"
      state={state}
      value={team.teamId}
      caption={getCaption()}
      readOnly={isDefault}
      disabled={disabled}
    />
  );
});
