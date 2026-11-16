/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, type IFormState } from '@cloudbeaver/core-ui';

import type { IConnectionPreferencesFormProps, IConnectionPreferencesFormState } from './IConnectionPreferencesFormState.js';

const ConnectionFormBaseActionsLoader = importLazyComponent(() =>
  import('./ConnectionPreferencesFormBaseActions.js').then(m => m.ConnectionPreferencesFormBaseActions),
);

export type ConnectionFormContainerProps = {
  formState: IFormState<IConnectionPreferencesFormState>;
};

export class ConnectionPreferencesFormServiceImpl extends FormBaseService<IConnectionPreferencesFormState, IConnectionPreferencesFormProps> {
  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Connection preferences form');
    this.actionsContainer.add(ConnectionFormBaseActionsLoader);
  }
}

export type ConnectionPreferencesFormService = ConnectionPreferencesFormServiceImpl;

export class ConnectionPreferencesFormServiceDI extends Context.Service<ConnectionPreferencesFormServiceDI, ConnectionPreferencesFormServiceImpl>()(
  '@cloudbeaver/plugin-connection-preferences/ConnectionPreferencesForm/ConnectionPreferencesFormService#ConnectionPreferencesFormService',
) {
  static readonly implementation = ConnectionPreferencesFormServiceImpl;

  static readonly dependencies = () => [LocalizationService, NotificationService] as const;
  static readonly make: Effect.Effect<
    ConnectionPreferencesFormServiceImpl,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeConnectionPreferencesFormService() {
    const localizationService = yield* LocalizationService;
    const notificationService = yield* NotificationService;

    return new ConnectionPreferencesFormServiceImpl(localizationService, notificationService);
  });
  static readonly layer: Layer.Layer<
    ConnectionPreferencesFormServiceDI,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionPreferencesFormService = ConnectionPreferencesFormServiceDI;
