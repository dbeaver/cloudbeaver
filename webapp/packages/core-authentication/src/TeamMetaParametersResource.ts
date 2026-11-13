/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { SessionResource } from '@cloudbeaver/core-root';
import { GraphQLService, type IObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export type TeamMetaParameter = IObjectPropertyInfo;

export class TeamMetaParametersResourceImpl extends CachedDataResource<TeamMetaParameter[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionResource: SessionResource,
  ) {
    super(() => []);

    this.sync(
      sessionResource,
      () => {},
      () => {},
    );
  }

  protected async loader(): Promise<TeamMetaParameter[]> {
    const { parameters } = await this.graphQLService.sdk.getTeamMetaParameters();
    return parameters;
  }
}

export type TeamMetaParametersResource = TeamMetaParametersResourceImpl;

export class TeamMetaParametersResourceDI extends Context.Service<TeamMetaParametersResourceDI, TeamMetaParametersResourceImpl>()(
  '@cloudbeaver/core-authentication/TeamMetaParametersResource#TeamMetaParametersResource',
) {
  static readonly implementation = TeamMetaParametersResourceImpl;

  static readonly dependencies = () => [GraphQLService, SessionResource] as const;
  static readonly make: Effect.Effect<
    TeamMetaParametersResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionResource>
  > = Effect.gen(function* makeTeamMetaParametersResource() {
    const graphQLService = yield* GraphQLService;
    const sessionResource = yield* SessionResource;

    return new TeamMetaParametersResourceImpl(graphQLService, sessionResource);
  });
  static readonly layer: Layer.Layer<
    TeamMetaParametersResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TeamMetaParametersResource = TeamMetaParametersResourceDI;
