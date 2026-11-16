/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { TeamsAdministrationFormService } from '../TeamsAdministrationFormService.js';
import { getTeamOptionsFormPart } from './getTeamOptionsFormPart.js';

const TeamOptions = React.lazy(async () => {
  const { TeamOptions } = await import('./TeamOptions.js');
  return { default: TeamOptions };
});

export class TeamOptionsTabServiceImpl extends Bootstrap {
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

export type TeamOptionsTabService = TeamOptionsTabServiceImpl;

export class TeamOptionsTabServiceDI extends Context.Service<TeamOptionsTabServiceDI, TeamOptionsTabServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/Teams/TeamsForm/Options/TeamOptionsTabService#TeamOptionsTabService',
) {
  static readonly implementation = TeamOptionsTabServiceImpl;

  static readonly dependencies = () => [TeamsAdministrationFormService] as const;
  static readonly make: Effect.Effect<TeamOptionsTabServiceImpl, never, Context.Service.Identifier<typeof TeamsAdministrationFormService>> =
    Effect.gen(function* makeTeamOptionsTabService() {
      const teamsAdministrationFormService = yield* TeamsAdministrationFormService;

      return new TeamOptionsTabServiceImpl(teamsAdministrationFormService);
    });
  static readonly layer: Layer.Layer<TeamOptionsTabServiceDI, never, Context.Service.Identifier<typeof TeamsAdministrationFormService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const TeamOptionsTabService = TeamOptionsTabServiceDI;
