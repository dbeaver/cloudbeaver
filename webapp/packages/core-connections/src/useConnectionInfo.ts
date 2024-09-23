/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { IConnectionInfoParams } from './CONNECTION_INFO_PARAM_SCHEMA.js';
import { type Connection, ConnectionInfoResource } from './ConnectionInfoResource.js';
import { ConnectionsManagerService } from './ConnectionsManagerService.js';

interface IPrivate extends IPublic {
  manager: ConnectionsManagerService;
}

interface IPublic {
  key: IConnectionInfoParams;
  resource: ConnectionInfoResource;
  connectionInfo: Connection | undefined;
  isLoading: () => boolean;
  isLoaded: () => boolean;
  isOutdated: () => boolean;
  load: () => Promise<Connection>;
  refresh: () => Promise<Connection>;
  connect: () => Promise<Connection | null>;
}

export function useConnectionInfo(key: IConnectionInfoParams): IPublic {
  const manager = useService(ConnectionsManagerService);
  const resource = useService(ConnectionInfoResource);
  key = resource.getKeyRef(key);

  return useObservableRef<IPrivate>(
    () => ({
      get connectionInfo(): Connection | undefined {
        return this.resource.get(this.key);
      },
      isLoading() {
        return this.resource.isLoading(this.key);
      },
      isLoaded() {
        return this.resource.isLoaded(this.key);
      },
      isOutdated() {
        return this.resource.isOutdated(this.key);
      },
      load() {
        return this.resource.load(this.key);
      },
      refresh() {
        return this.resource.refresh(this.key);
      },
      connect() {
        return this.manager.requireConnection(this.key);
      },
    }),
    {
      connectionInfo: computed,
      key: observable.ref,
    },
    { manager, resource, key },
    ['isLoading', 'isLoaded', 'isOutdated', 'load', 'refresh', 'connect'],
  );
}
