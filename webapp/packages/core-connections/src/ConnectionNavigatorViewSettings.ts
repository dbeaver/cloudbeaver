/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavigatorSettingsInput } from '@cloudbeaver/core-sdk';

export type NavigatorView = 'simple' | 'advanced' | 'custom';
export type NavigatorViewSettingsKeys = keyof NavigatorSettingsInput;

type NavigatorViewSettings = Record<Exclude<NavigatorView, 'custom'>, NavigatorSettingsInput>;

export const CONNECTION_NAVIGATOR_VIEW_SETTINGS: NavigatorViewSettings = {
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

export function getNavigatorView(settings: NavigatorSettingsInput): NavigatorView {
  const isSimple = isNavigatorViewSettingsEqual(settings, CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple);
  const isAdvanced = isNavigatorViewSettingsEqual(settings, CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced);

  if (isSimple) {
    return 'simple';
  }

  if (isAdvanced) {
    return 'advanced';
  }

  return 'custom';
}

export function isNavigatorSettingEnabled(
  setting: NavigatorViewSettingsKeys, settings: NavigatorSettingsInput
): boolean {
  return settings[setting];
}

function isNavigatorViewSettingsEqual(settings: NavigatorSettingsInput, settingsToCompare: NavigatorSettingsInput) {
  return !(Object.keys(settingsToCompare) as NavigatorViewSettingsKeys[])
    .some(key => {
      // we need to exclude it for now, cause we haven't implement custom navigator view logic yet
      if (key === 'showSystemObjects') {
        return false;
      }
      return settings[key] !== settingsToCompare[key];
    });
}
