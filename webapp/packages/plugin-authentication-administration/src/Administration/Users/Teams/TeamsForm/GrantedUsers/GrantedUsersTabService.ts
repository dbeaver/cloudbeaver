/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { importLazyComponent } from '@cloudbeaver/core-blocks';

import { TeamsAdministrationFormService } from '../TeamsAdministrationFormService.js';
import { getGrantedUsersFormPart } from './getGrantedUsersFormPart.js';

const GrantedUsersTable = importLazyComponent(() => import('./GrantedUsersTable.js').then(m => m.GrantedUsersTable));

export class GrantedUsersTabServiceImpl extends Bootstrap {
  private readonly key: string;

  constructor(private readonly teamsAdministrationFormService: TeamsAdministrationFormService) {
    super();
    this.key = 'granted-users';
  }

  override register(): void {
    this.teamsAdministrationFormService.parts.add({
      key: this.key,
      name: 'administration_teams_team_granted_users_tab_title',
      title: 'administration_teams_team_granted_users_tab_title',
      order: 2,
      stateGetter: props => () => getGrantedUsersFormPart(props.formState),
      panel: () => GrantedUsersTable,
    });
  }
}

export type GrantedUsersTabService = GrantedUsersTabServiceImpl;

export class GrantedUsersTabServiceDI extends Context.Service<GrantedUsersTabServiceDI, GrantedUsersTabServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/Teams/TeamsForm/GrantedUsers/GrantedUsersTabService#GrantedUsersTabService',
) {
  static readonly implementation = GrantedUsersTabServiceImpl;

  static readonly dependencies = () => [TeamsAdministrationFormService] as const;
  static readonly make: Effect.Effect<GrantedUsersTabServiceImpl, never, Context.Service.Identifier<typeof TeamsAdministrationFormService>> =
    Effect.gen(function* makeGrantedUsersTabService() {
      const teamsAdministrationFormService = yield* TeamsAdministrationFormService;

      return new GrantedUsersTabServiceImpl(teamsAdministrationFormService);
    });
  static readonly layer: Layer.Layer<GrantedUsersTabServiceDI, never, Context.Service.Identifier<typeof TeamsAdministrationFormService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const GrantedUsersTabService = GrantedUsersTabServiceDI;
