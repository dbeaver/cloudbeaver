/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { EUsersAdministrationSub, UsersAdministrationNavigationService } from '../UsersAdministrationNavigationService.js';

export class TeamsAdministrationNavServiceImpl {
  constructor(private readonly usersAdministrationNavigationService: UsersAdministrationNavigationService) {}

  navToRoot(): void {
    this.usersAdministrationNavigationService.navToSub(EUsersAdministrationSub.Teams);
  }

  navToCreate(): void {
    this.usersAdministrationNavigationService.navToSub(EUsersAdministrationSub.Teams, 'create');
  }
}

export type TeamsAdministrationNavService = TeamsAdministrationNavServiceImpl;

export class TeamsAdministrationNavServiceDI extends Context.Service<TeamsAdministrationNavServiceDI, TeamsAdministrationNavServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/Teams/TeamsAdministrationNavService#TeamsAdministrationNavService',
) {
  static readonly implementation = TeamsAdministrationNavServiceImpl;

  static readonly dependencies = () => [UsersAdministrationNavigationService] as const;
  static readonly make: Effect.Effect<
    TeamsAdministrationNavServiceImpl,
    never,
    Context.Service.Identifier<typeof UsersAdministrationNavigationService>
  > = Effect.gen(function* makeTeamsAdministrationNavService() {
    const usersAdministrationNavigationService = yield* UsersAdministrationNavigationService;

    return new TeamsAdministrationNavServiceImpl(usersAdministrationNavigationService);
  });
  static readonly layer: Layer.Layer<
    TeamsAdministrationNavServiceDI,
    never,
    Context.Service.Identifier<typeof UsersAdministrationNavigationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TeamsAdministrationNavService = TeamsAdministrationNavServiceDI;
