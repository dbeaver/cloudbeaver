/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, isResourceAlias, resourceKeyList, ResourceKeyUtils, type ResourceKey } from '@cloudbeaver/core-resource';
import { GraphQLService, type GetUserGrantedTeamsQuery } from '@cloudbeaver/core-sdk';

import { UsersResource } from './UsersResource.js';

type UserGrantedTeams = GetUserGrantedTeamsQuery['user']['grantedTeamsInfo'];

export class UsersGrantedTeamsResourceImpl extends CachedMapResource<string, UserGrantedTeams> {
  constructor(
    private readonly graphQLService: GraphQLService,
    usersResource: UsersResource,
  ) {
    super();

    this.sync(usersResource);
    usersResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, UserGrantedTeams>> {
    if (this.aliases.isAlias(originalKey, CachedMapAllKey)) {
      throw new Error('Loading all users is prohibited');
    }

    const keys = resourceKeyList<string>([]);
    const grants: UserGrantedTeams[] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      if (isResourceAlias(key)) {
        return;
      }

      const { user } = await this.graphQLService.sdk.getUserGrantedTeams({ userId: key });
      keys.push(key);
      grants.push(user.grantedTeamsInfo);
    });

    this.set(keys, grants);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export type UsersGrantedTeamsResource = UsersGrantedTeamsResourceImpl;

export class UsersGrantedTeamsResourceDI extends Context.Service<UsersGrantedTeamsResourceDI, UsersGrantedTeamsResourceImpl>()(
  '@cloudbeaver/core-authentication/UsersGrantedTeamsResource#UsersGrantedTeamsResource',
) {
  static readonly implementation = UsersGrantedTeamsResourceImpl;

  static readonly dependencies = () => [GraphQLService, UsersResource] as const;
  static readonly make: Effect.Effect<
    UsersGrantedTeamsResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof UsersResource>
  > = Effect.gen(function* makeUsersGrantedTeamsResource() {
    const graphQLService = yield* GraphQLService;
    const usersResource = yield* UsersResource;

    return new UsersGrantedTeamsResourceImpl(graphQLService, usersResource);
  });
  static readonly layer: Layer.Layer<
    UsersGrantedTeamsResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof UsersResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UsersGrantedTeamsResource = UsersGrantedTeamsResourceDI;
