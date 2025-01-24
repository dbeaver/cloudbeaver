/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';

import { TeamsAdministrationFormService } from '../TeamsAdministrationFormService.js';
import { getGrantedConnectionsFormPart } from './getGrantedConnectionsFormPart.js';

const GrantedConnections = importLazyComponent(() => import('./GrantedConnections.js').then(module => module.GrantedConnections));

@injectable()
export class GrantedConnectionsTabService extends Bootstrap {
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
      panel: () => GrantedConnections,
      isHidden: () => !this.isEnabled(),
      stateGetter: props => () => getGrantedConnectionsFormPart(props.formState),
      getLoader: () => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
    });
  }

  private isEnabled(): boolean {
    return this.projectInfoResource.values.some(isGlobalProject);
  }
}
