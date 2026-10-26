/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TranslateFn } from '@cloudbeaver/core-localization';

export function getTeamGrantTooltip(translate: TranslateFn, grantType: string | undefined): string | undefined {
  switch (grantType) {
    case 'AUTH_PROVIDER':
      return translate('plugin_authentication_administration_team_grant_provider_tooltip');
    case 'DEFAULT':
      return translate('plugin_authentication_administration_team_grant_default_tooltip');
    default:
      return undefined;
  }
}
