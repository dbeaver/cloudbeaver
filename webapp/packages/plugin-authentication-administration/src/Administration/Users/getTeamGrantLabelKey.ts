/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export function getTeamGrantLabelKey(grantType: string): string | undefined {
  switch (grantType) {
    case 'AUTH_PROVIDER':
      return 'plugin_authentication_administration_team_grant_provider';
    case 'DEFAULT':
      return 'plugin_authentication_administration_team_grant_default';
    case 'MANUAL':
      return 'plugin_authentication_administration_team_grant_manual';
    default:
      return undefined;
  }
}
