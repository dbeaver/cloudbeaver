/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { Context, Effect, IServiceProvider, Layer, disposeService } from '@cloudbeaver/core-di';
import { FormMode, OptionsPanelService } from '@cloudbeaver/core-ui';

import { ConnectionPreferencesFormService } from './ConnectionPreferencesForm/ConnectionPreferencesFormService.js';
import { ConnectionPreferencesFormState } from './ConnectionPreferencesForm/ConnectionPreferencesFormState.js';

const ConnectionPreferencesPanel = importLazyComponent(() => import('./ConnectionPreferencesPanel.js').then(m => m.ConnectionPreferencesPanel));

const formGetter = () => ConnectionPreferencesPanel;

export class ConnectionPreferencesPanelServiceImpl {
  formState: ConnectionPreferencesFormState | null;

  constructor(
    private readonly optionsPanelService: OptionsPanelService,
    private readonly serviceProvider: IServiceProvider,
    private readonly connectionPreferencesFormService: ConnectionPreferencesFormService,
  ) {
    this.formState = null;

    makeObservable(this, {
      formState: observable.shallow,
      open: action,
      close: action,
    });
  }

  async open(connectionKey: IConnectionInfoParams): Promise<boolean> {
    const opened = await this.optionsPanelService.open(formGetter);

    if (opened) {
      this.formState?.dispose();
      this.formState = new ConnectionPreferencesFormState(this.serviceProvider, this.connectionPreferencesFormService, {
        projectId: connectionKey.projectId,
        connectionId: connectionKey.connectionId,
      }).setMode(FormMode.Edit);
    }

    return opened;
  }

  async close(): Promise<void> {
    await this.optionsPanelService.close();

    this.formState?.dispose();
    this.formState = null;
  }
}

export type ConnectionPreferencesPanelService = ConnectionPreferencesPanelServiceImpl;

export class ConnectionPreferencesPanelServiceDI extends Context.Service<
  ConnectionPreferencesPanelServiceDI,
  ConnectionPreferencesPanelServiceImpl
>()('@cloudbeaver/plugin-connection-preferences/ConnectionPreferencesPanelService#ConnectionPreferencesPanelService') {
  static readonly implementation = ConnectionPreferencesPanelServiceImpl;

  static readonly dependencies = () => [OptionsPanelService, IServiceProvider, ConnectionPreferencesFormService] as const;
  static readonly make: Effect.Effect<
    ConnectionPreferencesPanelServiceImpl,
    never,
    | Context.Service.Identifier<typeof OptionsPanelService>
    | Context.Service.Identifier<typeof IServiceProvider>
    | Context.Service.Identifier<typeof ConnectionPreferencesFormService>
  > = Effect.gen(function* makeConnectionPreferencesPanelService() {
    const optionsPanelService = yield* OptionsPanelService;
    const serviceProvider = yield* IServiceProvider;
    const connectionPreferencesFormService = yield* ConnectionPreferencesFormService;

    return new ConnectionPreferencesPanelServiceImpl(optionsPanelService, serviceProvider, connectionPreferencesFormService);
  });
  static readonly layer: Layer.Layer<
    ConnectionPreferencesPanelServiceDI,
    never,
    | Context.Service.Identifier<typeof OptionsPanelService>
    | Context.Service.Identifier<typeof IServiceProvider>
    | Context.Service.Identifier<typeof ConnectionPreferencesFormService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionPreferencesPanelService = ConnectionPreferencesPanelServiceDI;
