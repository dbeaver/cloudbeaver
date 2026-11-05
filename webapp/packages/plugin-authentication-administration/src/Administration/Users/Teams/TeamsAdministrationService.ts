/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TeamInfo } from '@cloudbeaver/core-authentication';
import { importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

const DeleteTeamsButton = importLazyComponent(() => import('./TeamsTable/DeleteTeamsButton.js').then(m => m.DeleteTeamsButton));
const CreateTeamButton = importLazyComponent(() => import('./TeamsTable/CreateTeamButton.js').then(m => m.CreateTeamButton));

export interface ITeamDetailsInfoProps {
  team: TeamInfo;
}

@injectable()
export class TeamsAdministrationService {
  readonly teamDetailsInfoPlaceholder = new PlaceholderContainer<ITeamDetailsInfoProps>();
  readonly actions = new PlaceholderContainer();

  register(): void {
    this.actions.add(DeleteTeamsButton, 0);
    this.actions.add(CreateTeamButton, 1);
  }
}
