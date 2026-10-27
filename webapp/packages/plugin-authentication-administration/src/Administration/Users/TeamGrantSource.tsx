/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useTranslate } from '@cloudbeaver/core-blocks';

import { useTeamGrantLabel, type ITeamGrantSource } from './useTeamGrantLabel.js';

interface Props {
  grant: ITeamGrantSource | undefined;
}

export const TeamGrantSource = observer<Props>(function TeamGrantSource({ grant }) {
  const translate = useTranslate();
  const getLabel = useTeamGrantLabel();

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

  return <span title={getTooltip()}>{getLabel(grant)}</span>;
});
