/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IKeyBinding } from './IKeyBinding';

interface IKeyBindingOptions {
  id: string;
  label: string;
  preventDefault?: boolean;
  keys: string | string[];
}

export function createKeyBinding(options: IKeyBindingOptions): IKeyBinding {
  return {
    ...options,
    id: `@keybinding/${options.id}`,
  };
}
