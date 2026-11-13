/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { Context, Effect, IServiceProvider, Layer, disposeService } from '@cloudbeaver/core-di';
import type { IFormState } from '@cloudbeaver/core-ui';

import { ServerConfigurationFormService } from './ServerConfigurationFormService.js';
import { ServerConfigurationFormState } from './ServerConfigurationFormState.js';

export class ServerConfigurationFormStateManagerImpl {
  formState: ServerConfigurationFormState | null;

  constructor(
    private readonly serviceProvider: IServiceProvider,
    private readonly serverConfigurationFormService: ServerConfigurationFormService,
  ) {
    this.formState = null;

    makeObservable(this, {
      formState: observable.ref,
    });
  }

  create(): IFormState<null> {
    if (this.formState) {
      return this.formState;
    }

    this.formState = new ServerConfigurationFormState(this.serviceProvider, this.serverConfigurationFormService);

    return this.formState;
  }

  async save(): Promise<boolean> {
    if (!this.formState) {
      return false;
    }

    return await this.formState.save();
  }

  destroy(): void {
    if (this.formState) {
      this.formState?.dispose();
      this.formState = null;
    }
  }
}

export type ServerConfigurationFormStateManager = ServerConfigurationFormStateManagerImpl;

export class ServerConfigurationFormStateManagerDI extends Context.Service<
  ServerConfigurationFormStateManagerDI,
  ServerConfigurationFormStateManagerImpl
>()(
  '@cloudbeaver/plugin-administration/ConfigurationWizard/ServerConfiguration/ServerConfigurationFormStateManager#ServerConfigurationFormStateManager',
) {
  static readonly implementation = ServerConfigurationFormStateManagerImpl;

  static readonly dependencies = () => [IServiceProvider, ServerConfigurationFormService] as const;
  static readonly make: Effect.Effect<
    ServerConfigurationFormStateManagerImpl,
    never,
    Context.Service.Identifier<typeof IServiceProvider> | Context.Service.Identifier<typeof ServerConfigurationFormService>
  > = Effect.gen(function* makeServerConfigurationFormStateManager() {
    const serviceProvider = yield* IServiceProvider;
    const serverConfigurationFormService = yield* ServerConfigurationFormService;

    return new ServerConfigurationFormStateManagerImpl(serviceProvider, serverConfigurationFormService);
  });
  static readonly layer: Layer.Layer<
    ServerConfigurationFormStateManagerDI,
    never,
    Context.Service.Identifier<typeof IServiceProvider> | Context.Service.Identifier<typeof ServerConfigurationFormService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerConfigurationFormStateManager = ServerConfigurationFormStateManagerDI;
