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

export type AdministrationAISettingsFormProps = IFormProps<null>;

export class AdministrationAISettingsFormServiceImpl extends FormBaseService<null, AdministrationAISettingsFormProps> {
  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Administration AI Settings form');
  }
}

export type AdministrationAISettingsFormService = AdministrationAISettingsFormServiceImpl;

export class AdministrationAISettingsFormServiceDI extends Context.Service<
  AdministrationAISettingsFormServiceDI,
  AdministrationAISettingsFormServiceImpl
>()('@cloudbeaver/plugin-ai-administration/AISettingsForm/AdministrationAISettingsFormService#AdministrationAISettingsFormService') {
  static readonly implementation = AdministrationAISettingsFormServiceImpl;

  static readonly dependencies = () => [LocalizationService, NotificationService] as const;
  static readonly make: Effect.Effect<
    AdministrationAISettingsFormServiceImpl,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeAdministrationAISettingsFormService() {
    const localizationService = yield* LocalizationService;
    const notificationService = yield* NotificationService;

    return new AdministrationAISettingsFormServiceImpl(localizationService, notificationService);
  });
  static readonly layer: Layer.Layer<
    AdministrationAISettingsFormServiceDI,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AdministrationAISettingsFormService = AdministrationAISettingsFormServiceDI;
