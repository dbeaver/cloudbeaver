/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { formValidationContext, type IFormState } from '@cloudbeaver/core-ui';

import type { IServerConfigurationFormPartState } from './IServerConfigurationFormPartState.js';
import { ServerConfigurationFormService } from './ServerConfigurationFormService.js';

export interface IConfigurationPlaceholderProps {
  configurationWizard: boolean;
  state: IServerConfigurationFormPartState;
}

export interface IServerInfoPlaceholderProps extends IConfigurationPlaceholderProps {
  formState: IFormState<null>;
}

export class ServerConfigurationServiceImpl {
  isDone: boolean;

  readonly securitySettingsContainer: PlaceholderContainer<IConfigurationPlaceholderProps>;
  readonly serverInfoContainer: PlaceholderContainer<IServerInfoPlaceholderProps>;

  constructor(private readonly serverConfigurationFormService: ServerConfigurationFormService) {
    this.isDone = false;
    this.securitySettingsContainer = new PlaceholderContainer();
    this.serverInfoContainer = new PlaceholderContainer();

    this.serverConfigurationFormService.onValidate.addHandler((data, contexts) => {
      const validation = contexts.getContext(formValidationContext);
      this.setDone(validation.valid);
    });

    makeObservable(this, {
      isDone: observable.ref,
    });
  }

  setDone(value: boolean): void {
    this.isDone = value;
  }
}

export type ServerConfigurationService = ServerConfigurationServiceImpl;

export class ServerConfigurationServiceDI extends Context.Service<ServerConfigurationServiceDI, ServerConfigurationServiceImpl>()(
  '@cloudbeaver/plugin-administration/ConfigurationWizard/ServerConfiguration/ServerConfigurationService#ServerConfigurationService',
) {
  static readonly implementation = ServerConfigurationServiceImpl;

  static readonly dependencies = () => [ServerConfigurationFormService] as const;
  static readonly make: Effect.Effect<ServerConfigurationServiceImpl, never, Context.Service.Identifier<typeof ServerConfigurationFormService>> =
    Effect.gen(function* makeServerConfigurationService() {
      const serverConfigurationFormService = yield* ServerConfigurationFormService;

      return new ServerConfigurationServiceImpl(serverConfigurationFormService);
    });
  static readonly layer: Layer.Layer<ServerConfigurationServiceDI, never, Context.Service.Identifier<typeof ServerConfigurationFormService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const ServerConfigurationService = ServerConfigurationServiceDI;
