/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceConstructor } from './IApp.js';

export interface PluginManifest {
  info: {
    name: string;
    defaultSettings?: Record<string, any>;
  };

  preload?: Array<() => Promise<IServiceConstructor<any>>>;
  providers: Array<() => Promise<IServiceConstructor<any>>>;

  /**
   * The list of plugins which your plugin depends on
   */
  depends?: PluginManifest[];
}
