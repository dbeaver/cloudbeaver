/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { TeamsResource } from './TeamsResource.js';

export class TeamsManagerServiceImpl {
  constructor(readonly teamsResource: TeamsResource) {}
}

export type TeamsManagerService = TeamsManagerServiceImpl;

export class TeamsManagerServiceDI extends Context.Service<TeamsManagerServiceDI, TeamsManagerServiceImpl>()(
  '@cloudbeaver/core-authentication/TeamsManagerService#TeamsManagerService',
) {
  static readonly implementation = TeamsManagerServiceImpl;

  static readonly dependencies = () => [TeamsResource] as const;
  static readonly make: Effect.Effect<TeamsManagerServiceImpl, never, Context.Service.Identifier<typeof TeamsResource>> = Effect.gen(
    function* makeTeamsManagerService() {
      const teamsResource = yield* TeamsResource;

      return new TeamsManagerServiceImpl(teamsResource);
    },
  );
  static readonly layer: Layer.Layer<TeamsManagerServiceDI, never, Context.Service.Identifier<typeof TeamsResource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TeamsManagerService = TeamsManagerServiceDI;
