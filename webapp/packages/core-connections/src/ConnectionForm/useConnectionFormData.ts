/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import type { CachedMapResource, ConnectionConfig, GetConnectionsQueryVariables } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { DatabaseConnection } from '../Administration/ConnectionsResource';
import type { IConnectionFormData } from './ConnectionFormService';

export interface IConnectionFormDataOptions {
  config: ConnectionConfig;
  availableDrivers?: string[];

  resource?: CachedMapResource<string, DatabaseConnection, GetConnectionsQueryVariables>;
  partsState?: MetadataMap<string, any>;
}

export function useConnectionFormData({
  config,
  availableDrivers = [],
  resource,
  partsState,
}: IConnectionFormDataOptions): IConnectionFormData {
  if (availableDrivers.length > 0) {
    availableDrivers = [...availableDrivers];
  } else if (config.driverId) {
    availableDrivers = [config.driverId];
  }

  const data = useObjectRef({
    config,
    availableDrivers: observable(availableDrivers),
    resource,
    partsState: partsState ?? new MetadataMap<string, any>(),
    get info() {
      if (!this.config.connectionId) {
        return undefined;
      }

      return this.resource?.get(this.config.connectionId);
    },
  }, {
    config,
    resource,
  }, {
    config: observable,
  });

  if (partsState) {
    data.partsState = partsState;
  }

  for (const driver of availableDrivers) {
    if (!data.availableDrivers.includes(driver)) {
      data.availableDrivers.push(driver);
    }
  }

  for (const driver of [...data.availableDrivers]) {
    if (!availableDrivers.includes(driver)) {
      data.availableDrivers.splice(data.availableDrivers.indexOf(driver), 1);
    }
  }

  return data;
}
