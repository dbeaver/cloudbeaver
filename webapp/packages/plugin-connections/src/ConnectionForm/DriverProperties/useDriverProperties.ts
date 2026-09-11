/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';
import { observable, reaction, toJS } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ConnectionConfig, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { type ILoadableState } from '@cloudbeaver/core-utils';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { type IFormState } from '@cloudbeaver/core-ui';

import type { IConnectionFormState } from '../IConnectionFormState.js';

interface Payload {
  formState: IFormState<IConnectionFormState>;
  config: ConnectionConfig;
  selected: boolean;
}

interface State extends ILoadableState {
  properties: ObjectPropertyInfo[] | null;
  loading: boolean;
  loaded: boolean;
  exception: Error | null;
  promise: Promise<ObjectPropertyInfo[]> | null;
  payload: Payload;
  connectionInfoResource: ConnectionInfoResource;
  load: () => Promise<void>;
  reset: () => void;
}

export function useDriverProperties(payload: Payload) {
  const connectionInfoResource = useService(ConnectionInfoResource);

  const state = useObservableRef<State>(
    () => ({
      properties: null,
      exception: null,
      promise: null,
      isLoaded() {
        return this.properties !== null;
      },
      isError() {
        return this.exception !== null;
      },
      isLoading() {
        return this.promise !== null;
      },
      async load() {
        try {
          this.exception = null;

          // We are executing a format task, so the config was fully updated with defaults.
          // We need to guarantee that the config is the same as the one sent to the test connection function;
          // otherwise, the backend will return only partial data.
          await this.payload.formState.formatTask.execute(this.payload.formState);
          this.promise = this.connectionInfoResource.getConnectionDriverProperties(this.payload.formState.state.projectId, this.payload.config);
          const properties = await this.promise;
          this.properties = properties;
        } catch (exception: any) {
          this.exception = exception;
        } finally {
          this.promise = null;
        }
      },
      reset() {
        this.properties = null;
      },
    }),
    {
      properties: observable.ref,
      promise: observable.ref,
      exception: observable.ref,
      payload: observable.ref,
      connectionInfoResource: observable.ref,
    },
    { payload, connectionInfoResource },
  );

  useEffect(() => {
    const disposer = reaction(
      () => {
        const state = payload.config;

        return {
          driverId: state.driverId,
          authModelId: state.authModelId,
          host: state.host,
          mainPropertyValues: toJS(state.mainPropertyValues),
          credentials: toJS(state.credentials),
        };
      },
      () => {
        if (!payload.selected) {
          state.reset();
        }
      },
    );

    return () => disposer();
  }, [payload.config, payload.selected, state]);

  return state;
}
