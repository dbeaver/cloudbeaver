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

export interface IUserFormState {
  userId: string | null;
}

export type UserFormProps = IFormProps<IUserFormState>;

export class AdministrationUserFormServiceImpl extends FormBaseService<IUserFormState, UserFormProps> {
  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Administration User form');
  }
}

export type AdministrationUserFormService = AdministrationUserFormServiceImpl;

export class AdministrationUserFormServiceDI extends Context.Service<AdministrationUserFormServiceDI, AdministrationUserFormServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/UserForm/AdministrationUserFormService#AdministrationUserFormService',
) {
  static readonly implementation = AdministrationUserFormServiceImpl;

  static readonly dependencies = () => [LocalizationService, NotificationService] as const;
  static readonly make: Effect.Effect<
    AdministrationUserFormServiceImpl,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeAdministrationUserFormService() {
    const localizationService = yield* LocalizationService;
    const notificationService = yield* NotificationService;

    return new AdministrationUserFormServiceImpl(localizationService, notificationService);
  });
  static readonly layer: Layer.Layer<
    AdministrationUserFormServiceDI,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AdministrationUserFormService = AdministrationUserFormServiceDI;
