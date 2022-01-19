/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavigatorSettingsInput } from '@cloudbeaver/core-sdk';

export type NavigatorView = 'simple' | 'advanced';
export type NavigatorViewSettings = Partial<NavigatorSettingsInput>;

export const CONNECTION_NAVIGATOR_VIEW_SETTINGS: Record<NavigatorView, NavigatorViewSettings> = {
  simple: {
    showOnlyEntities: true,
    hideFolders: true,
    hideVirtualModel: true,
    hideSchemas: false,
    mergeEntities: false,
    showUtilityObjects: false,
  },
  advanced: {
    showOnlyEntities: false,
    hideFolders: false,
    hideVirtualModel: false,
    hideSchemas: false,
    mergeEntities: false,
    showUtilityObjects: false,
  },
};

export function isNavigatorViewSettingsEqual(
  settings: NavigatorSettingsInput, settingsToCompare: NavigatorViewSettings
): boolean {
  return !(Object.keys(settingsToCompare) as Array<keyof NavigatorSettingsInput>)
    .some(key => settings[key] !== settingsToCompare[key]);
}
