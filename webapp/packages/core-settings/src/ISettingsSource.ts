/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ISettingsSource {
  has: (key: any) => boolean;
  getValue: (key: any) => any | undefined;
  setValue: (key: any, value: any) => void;
  clear: () => void;
}
