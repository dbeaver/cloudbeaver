/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, type IFormState } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps, IConnectionFormState } from './IConnectionFormState.js';

const ConnectionFormBaseActionsLoader = importLazyComponent(() => import('./ConnectionFormBaseActions.js').then(m => m.ConnectionFormBaseActions));

export type ConnectionFormContainerProps = {
  formState: IFormState<IConnectionFormState>;
};

export class ConnectionFormServiceImpl extends FormBaseService<IConnectionFormState, IConnectionFormProps> {
  readonly mainPropertiesContainer: PlaceholderContainer<ConnectionFormContainerProps>;
  readonly providerPropertiesContainer: PlaceholderContainer<ConnectionFormContainerProps>;
  readonly connectionContainer: PlaceholderContainer<ConnectionFormContainerProps>;
  readonly optionsPresentationContainer: PlaceholderContainer<ConnectionFormContainerProps>;
  readonly originInfoContainer: PlaceholderContainer<ConnectionFormContainerProps>;

  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Connection form');
    this.mainPropertiesContainer = new PlaceholderContainer<ConnectionFormContainerProps>();
    this.providerPropertiesContainer = new PlaceholderContainer<ConnectionFormContainerProps>();
    this.connectionContainer = new PlaceholderContainer<ConnectionFormContainerProps>();
    this.optionsPresentationContainer = new PlaceholderContainer<ConnectionFormContainerProps>();
    this.originInfoContainer = new PlaceholderContainer<ConnectionFormContainerProps>();
    this.actionsContainer.add(ConnectionFormBaseActionsLoader);
  }
}

export type ConnectionFormService = ConnectionFormServiceImpl;

export class ConnectionFormServiceDI extends Context.Service<ConnectionFormServiceDI, ConnectionFormServiceImpl>()(
  '@cloudbeaver/plugin-connections/ConnectionForm/ConnectionFormService#ConnectionFormService',
) {
  static readonly implementation = ConnectionFormServiceImpl;

  static readonly dependencies = () => [LocalizationService, NotificationService] as const;
  static readonly make: Effect.Effect<
    ConnectionFormServiceImpl,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeConnectionFormService() {
    const localizationService = yield* LocalizationService;
    const notificationService = yield* NotificationService;

    return new ConnectionFormServiceImpl(localizationService, notificationService);
  });
  static readonly layer: Layer.Layer<
    ConnectionFormServiceDI,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionFormService = ConnectionFormServiceDI;
