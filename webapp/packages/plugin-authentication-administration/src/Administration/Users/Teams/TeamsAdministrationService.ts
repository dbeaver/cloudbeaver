/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TeamInfo } from '@cloudbeaver/core-authentication';
import { importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';

const DeleteTeamsButton = importLazyComponent(() => import('./TeamsTable/DeleteTeamsButton.js').then(m => m.DeleteTeamsButton));
const CreateTeamButton = importLazyComponent(() => import('./TeamsTable/CreateTeamButton.js').then(m => m.CreateTeamButton));

export interface ITeamDetailsInfoProps {
  team: TeamInfo;
}

export class TeamsAdministrationServiceImpl {
  readonly teamDetailsInfoPlaceholder = new PlaceholderContainer<ITeamDetailsInfoProps>();
  readonly actions = new PlaceholderContainer();

  register(): void {
    this.actions.add(DeleteTeamsButton, 0);
    this.actions.add(CreateTeamButton, 1);
  }
}

export type TeamsAdministrationService = TeamsAdministrationServiceImpl;

export class TeamsAdministrationServiceDI extends Context.Service<TeamsAdministrationServiceDI, TeamsAdministrationServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/Teams/TeamsAdministrationService#TeamsAdministrationService',
) {
  static readonly implementation = TeamsAdministrationServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<TeamsAdministrationServiceImpl, never, never> = Effect.sync(() => new TeamsAdministrationServiceImpl());
  static readonly layer: Layer.Layer<TeamsAdministrationServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TeamsAdministrationService = TeamsAdministrationServiceDI;
