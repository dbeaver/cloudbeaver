/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavigatorSettingsInput } from '@cloudbeaver/core-sdk';

type NavigatorView = 'simple' | 'advanced';

export const CONNECTION_NAVIGATOR_VIEW_SETTINGS: Record<NavigatorView, NavigatorSettingsInput> = {
  simple: {
    showOnlyEntities: true,
    hideFolders: true,
    hideVirtualModel: true,
    hideSchemas: false,
    mergeEntities: false,
    showSystemObjects: false,
    showUtilityObjects: false,
  },
  advanced: {
    showOnlyEntities: false,
    hideFolders: false,
    hideVirtualModel: false,
    hideSchemas: false,
    mergeEntities: false,
    showSystemObjects: false,
    showUtilityObjects: false,
  },
};

export function isSimpleNavigatorView(settings: NavigatorSettingsInput): boolean {
  const simple = CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple;
  return !Object.keys(simple)
    .some(key => settings[key as keyof NavigatorSettingsInput] !== simple[key as keyof NavigatorSettingsInput]);
}
