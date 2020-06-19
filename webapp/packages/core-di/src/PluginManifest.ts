/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  IServiceConstructor, IServiceCollection, IServiceInjector,
} from './IApp';

export interface PluginManifest {
  info: {
    name: string;
    defaultSettings?: object;
  };

  /**
   * First phase, only register services in DI here
   */
  registerServices?(services: IServiceCollection): void;

  providers: IServiceConstructor<any>[];

  /**
   * Second phase.
   * You can be sure that all services of all plugins are already registered here and you can use any service
   */
  initialize?(services: IServiceInjector): Promise<void> | void;

  /**
   * Third phase but we still don't know what is it :)
   */
  load?(): Promise<void> | void;

  /**
   * The list of plugins which your plugin depends on
   */
  depends?: PluginManifest[];
}
