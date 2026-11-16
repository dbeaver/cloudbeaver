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

export interface ITeamFormState {
  teamId: string | null;
}

export type TeamFormProps = IFormProps<ITeamFormState>;

export class TeamsAdministrationFormServiceImpl extends FormBaseService<ITeamFormState, TeamFormProps> {
  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Administration Team form');
  }
}

export type TeamsAdministrationFormService = TeamsAdministrationFormServiceImpl;

export class TeamsAdministrationFormServiceDI extends Context.Service<TeamsAdministrationFormServiceDI, TeamsAdministrationFormServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/Teams/TeamsForm/TeamsAdministrationFormService#TeamsAdministrationFormService',
) {
  static readonly implementation = TeamsAdministrationFormServiceImpl;

  static readonly dependencies = () => [LocalizationService, NotificationService] as const;
  static readonly make: Effect.Effect<
    TeamsAdministrationFormServiceImpl,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeTeamsAdministrationFormService() {
    const localizationService = yield* LocalizationService;
    const notificationService = yield* NotificationService;

    return new TeamsAdministrationFormServiceImpl(localizationService, notificationService);
  });
  static readonly layer: Layer.Layer<
    TeamsAdministrationFormServiceDI,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TeamsAdministrationFormService = TeamsAdministrationFormServiceDI;
