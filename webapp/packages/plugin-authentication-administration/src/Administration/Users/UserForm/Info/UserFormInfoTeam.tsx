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

import { getTeamGrantLabelKey } from '../../getTeamGrantLabelKey.js';
import { getTeamGrantTooltipKey } from '../../getTeamGrantTooltipKey.js';
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
  const labelKey = getTeamGrantLabelKey(grantType);
  const tooltipKey = getTeamGrantTooltipKey(grantType);
  const grantLabel = labelKey ? translate(labelKey) : '-';
  const grantTooltip = tooltipKey ? translate(tooltipKey) : undefined;
  const label = `${team.teamId}${team.teamName && team.teamName !== team.teamId ? ' (' + team.teamName + ')' : ''}`;

  function getCaption(): string | undefined {
    if (isDefault) {
      return `${grantLabel}. ${translate('plugin_authentication_administration_user_team_default_readonly_tooltip')}`;
    }

    if (!state.teams.includes(team.teamId)) {
      return undefined;
    }

    if (grantType === 'AUTH_PROVIDER') {
      const provider = grant?.grantedBy ? `: ${grant.grantedBy}` : '';
      return `${grantLabel}${provider}. ${grantTooltip}`;
    }

    return grantLabel;
  }

  function getTooltip(): string {
    const tooltip = `${label}${team.description ? '\n' + team.description : ''}`;
    return isDefault ? `${tooltip}\n${grantTooltip}` : tooltip;
  }

  return (
    <FieldCheckbox
      id={id}
      title={getTooltip()}
      label={label}
      name="teams"
      state={state}
      value={team.teamId}
      caption={getCaption()}
      readOnly={isDefault}
      disabled={disabled}
    />
  );
});
