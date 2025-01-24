/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { TeamsAdministrationFormService } from '../TeamsAdministrationFormService.js';
import { getTeamOptionsFormPart } from './getTeamOptionsFormPart.js';

const TeamOptions = React.lazy(async () => {
  const { TeamOptions } = await import('./TeamOptions.js');
  return { default: TeamOptions };
});

@injectable()
export class TeamOptionsTabService extends Bootstrap {
  constructor(private readonly teamsAdministrationFormService: TeamsAdministrationFormService) {
    super();
  }

  override register(): void {
    this.teamsAdministrationFormService.parts.add({
      key: 'options',
      name: 'ui_options',
      order: 1,
      stateGetter: props => () => getTeamOptionsFormPart(props.formState),
      panel: () => TeamOptions,
    });
  }
}
