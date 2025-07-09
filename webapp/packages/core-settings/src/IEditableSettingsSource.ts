/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ISettingsSource } from './ISettingsSource.js';

export interface IEditableSettingsSource extends ISettingsSource {
  clear: () => void;
  isEdited: (key?: any) => boolean;
  isReadOnly: (key: any) => boolean;
  getEditedValue: (key: any) => any | undefined;
  setValue: (key: any, value: any) => void;
  resetValue: (key: any) => void;
  save: () => Promise<void>;
  isOverrideDefaults?: () => boolean;
  restoreDefaults?: () => void;
}

export function isEditableSettingsSource(source: ISettingsSource): source is IEditableSettingsSource {
  return 'isEdited' in source;
}
