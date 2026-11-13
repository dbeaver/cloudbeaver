/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, type IFormState } from '@cloudbeaver/core-ui';
import type { IConnectionFormProps, IConnectionFormState } from '@cloudbeaver/plugin-connections';

export type ConnectionFormAiContainerProps = {
  formState: IFormState<IConnectionFormState>;
  metaTransferConfirmed?: boolean;
};

export class ConnectionFormAiServiceImpl extends FormBaseService<IConnectionFormState, IConnectionFormProps> {
  readonly optionsContainer: PlaceholderContainer<ConnectionFormAiContainerProps>;

  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Connection AI form');
    this.optionsContainer = new PlaceholderContainer<ConnectionFormAiContainerProps>();
  }
}

export type ConnectionFormAiService = ConnectionFormAiServiceImpl;

export class ConnectionFormAiServiceDI extends Context.Service<ConnectionFormAiServiceDI, ConnectionFormAiServiceImpl>()(
  '@cloudbeaver/plugin-connection-ai/connection-ai-settings/ConnectionFormAiService#ConnectionFormAiService',
) {
  static readonly implementation = ConnectionFormAiServiceImpl;

  static readonly dependencies = () => [LocalizationService, NotificationService] as const;
  static readonly make: Effect.Effect<
    ConnectionFormAiServiceImpl,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeConnectionFormAiService() {
    const localizationService = yield* LocalizationService;
    const notificationService = yield* NotificationService;

    return new ConnectionFormAiServiceImpl(localizationService, notificationService);
  });
  static readonly layer: Layer.Layer<
    ConnectionFormAiServiceDI,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionFormAiService = ConnectionFormAiServiceDI;
