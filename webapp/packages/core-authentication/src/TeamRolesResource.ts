/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';

export const USER_TEAM_ROLE_SUPERVISOR = 'Supervisor';

export class TeamRolesResourceImpl extends CachedDataResource<string[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super(() => []);

    sessionPermissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  async assignTeamRoleToUser(userId: string, teamId: string, teamRole: string | null) {
    const { result } = await this.graphQLService.sdk.updateUserTeamRole({
      userId,
      teamId,
      teamRole: teamRole ?? undefined,
    });

    return result;
  }

  protected async loader(): Promise<string[]> {
    const { roles } = await this.graphQLService.sdk.getTeamRoles();
    return roles;
  }
}

export type TeamRolesResource = TeamRolesResourceImpl;

export class TeamRolesResourceDI extends Context.Service<TeamRolesResourceDI, TeamRolesResourceImpl>()(
  '@cloudbeaver/core-authentication/TeamRolesResource#TeamRolesResource',
) {
  static readonly implementation = TeamRolesResourceImpl;

  static readonly dependencies = () => [GraphQLService, SessionPermissionsResource] as const;
  static readonly make: Effect.Effect<
    TeamRolesResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Effect.gen(function* makeTeamRolesResource() {
    const graphQLService = yield* GraphQLService;
    const sessionPermissionsResource = yield* SessionPermissionsResource;

    return new TeamRolesResourceImpl(graphQLService, sessionPermissionsResource);
  });
  static readonly layer: Layer.Layer<
    TeamRolesResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TeamRolesResource = TeamRolesResourceDI;
