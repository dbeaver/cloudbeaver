/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISettingsSource } from './ISettingsSource.js';
import type { ISettingsLayer } from './SettingsLayer.js';

export interface ISettingsResolverSource extends ISettingsSource {
  hasResolver: (layer: ISettingsLayer, resolver: ISettingsSource) => boolean;
  addResolver: (layer: ISettingsLayer, ...resolvers: ISettingsSource[]) => void;
  removeResolver: (layer: ISettingsLayer, resolver: ISettingsSource) => void;
  clearResolvers: () => void;
}
