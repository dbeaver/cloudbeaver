/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';

import { TeamsAdministrationFormService } from '../TeamsAdministrationFormService.js';
import { getGrantedConnectionsFormPart } from './getGrantedConnectionsFormPart.js';

const GrantedConnectionsTable = importLazyComponent(() => import('./GrantedConnectionsTable.js').then(module => module.GrantedConnectionsTable));

export class GrantedConnectionsTabServiceImpl extends Bootstrap {
  private readonly key: string;

  constructor(
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly teamsAdministrationFormService: TeamsAdministrationFormService,
  ) {
    super();
    this.key = 'granted-connections';
  }

  override register(): void {
    this.teamsAdministrationFormService.parts.add({
      key: this.key,
      name: 'administration_teams_team_granted_connections_tab_title',
      title: 'administration_teams_team_granted_connections_tab_title',
      order: 3,
      panel: () => GrantedConnectionsTable,
      isHidden: () => !this.isEnabled(),
      stateGetter: props => () => getGrantedConnectionsFormPart(props.formState),
      getLoader: () => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
    });
  }

  private isEnabled(): boolean {
    return this.projectInfoResource.values.some(isGlobalProject);
  }
}

export type GrantedConnectionsTabService = GrantedConnectionsTabServiceImpl;

export class GrantedConnectionsTabServiceDI extends Context.Service<GrantedConnectionsTabServiceDI, GrantedConnectionsTabServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/Teams/TeamsForm/GrantedConnections/GrantedConnectionsTabService#GrantedConnectionsTabService',
) {
  static readonly implementation = GrantedConnectionsTabServiceImpl;

  static readonly dependencies = () => [ProjectInfoResource, TeamsAdministrationFormService] as const;
  static readonly make: Effect.Effect<
    GrantedConnectionsTabServiceImpl,
    never,
    Context.Service.Identifier<typeof ProjectInfoResource> | Context.Service.Identifier<typeof TeamsAdministrationFormService>
  > = Effect.gen(function* makeGrantedConnectionsTabService() {
    const projectInfoResource = yield* ProjectInfoResource;
    const teamsAdministrationFormService = yield* TeamsAdministrationFormService;

    return new GrantedConnectionsTabServiceImpl(projectInfoResource, teamsAdministrationFormService);
  });
  static readonly layer: Layer.Layer<
    GrantedConnectionsTabServiceDI,
    never,
    Context.Service.Identifier<typeof ProjectInfoResource> | Context.Service.Identifier<typeof TeamsAdministrationFormService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const GrantedConnectionsTabService = GrantedConnectionsTabServiceDI;
