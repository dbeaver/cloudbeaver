/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IServiceConstructor } from './IApp';

export interface PluginManifest {
  info: {
    name: string;
    defaultSettings?: Record<string, any>;
  };

  providers: Array<IServiceConstructor<any>>;

  /**
   * The list of plugins which your plugin depends on
   */
  depends?: PluginManifest[];
}
