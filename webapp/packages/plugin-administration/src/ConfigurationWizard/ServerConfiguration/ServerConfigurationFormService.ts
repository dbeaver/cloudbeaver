/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, type IFormProps } from '@cloudbeaver/core-ui';

export type ServerConfigurationFormProps = IFormProps<null> & {
  configurationWizard: boolean;
};

export class ServerConfigurationFormServiceImpl extends FormBaseService<null, ServerConfigurationFormProps> {
  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Server Configuration form');
  }
}

export type ServerConfigurationFormService = ServerConfigurationFormServiceImpl;

export class ServerConfigurationFormServiceDI extends Context.Service<ServerConfigurationFormServiceDI, ServerConfigurationFormServiceImpl>()(
  '@cloudbeaver/plugin-administration/ConfigurationWizard/ServerConfiguration/ServerConfigurationFormService#ServerConfigurationFormService',
) {
  static readonly implementation = ServerConfigurationFormServiceImpl;

  static readonly dependencies = () => [LocalizationService, NotificationService] as const;
  static readonly make: Effect.Effect<
    ServerConfigurationFormServiceImpl,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeServerConfigurationFormService() {
    const localizationService = yield* LocalizationService;
    const notificationService = yield* NotificationService;

    return new ServerConfigurationFormServiceImpl(localizationService, notificationService);
  });
  static readonly layer: Layer.Layer<
    ServerConfigurationFormServiceDI,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerConfigurationFormService = ServerConfigurationFormServiceDI;
