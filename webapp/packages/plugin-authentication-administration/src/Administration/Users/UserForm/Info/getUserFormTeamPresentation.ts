/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TeamInfo } from '@cloudbeaver/core-authentication';
import type { TranslateFn } from '@cloudbeaver/core-localization';
import type { AdminUserTeamInfo } from '@cloudbeaver/core-sdk';

import { getTeamGrantLabel } from '../../getTeamGrantLabel.js';
import { getTeamGrantTooltip } from '../../getTeamGrantTooltip.js';

interface IUserFormTeamPresentationOptions {
  team: Pick<TeamInfo, 'teamId' | 'teamName' | 'description'>;
  grant: Pick<AdminUserTeamInfo, 'grantType' | 'grantedBy'> | undefined;
  isDefault: boolean;
  isGranted: boolean;
}

export function getUserFormTeamPresentation(
  translate: TranslateFn,
  { team, grant, isDefault, isGranted }: IUserFormTeamPresentationOptions,
): { label: string; caption: string | undefined; tooltip: string } {
  const label = `${team.teamId}${team.teamName && team.teamName !== team.teamId ? ' (' + team.teamName + ')' : ''}`;
  const tooltip = `${label}${team.description ? '\n' + team.description : ''}`;

  if (isDefault) {
    return {
      label,
      caption: `${getTeamGrantLabel(translate, 'DEFAULT')}. ${translate('plugin_authentication_administration_user_team_default_readonly_tooltip')}`,
      tooltip: `${tooltip}\n${getTeamGrantTooltip(translate, 'DEFAULT')}`,
    };
  }

  if (!isGranted) {
    return { label, caption: undefined, tooltip };
  }

  const grantType = grant?.grantType ?? 'MANUAL';
  const grantLabel = getTeamGrantLabel(translate, grantType, grant?.grantedBy);
  const caption = grantType === 'AUTH_PROVIDER' ? `${grantLabel}. ${getTeamGrantTooltip(translate, grantType)}` : grantLabel;

  return { label, caption, tooltip };
}
