/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type PasswordPolicyFragment } from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource.js';

export type PasswordPolicy = PasswordPolicyFragment['passwordPolicyConfiguration'];

export class PasswordPolicyResourceImpl extends CachedDataResource<PasswordPolicy | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => null, undefined, []);
    this.sync(serverConfigResource);
  }

  protected async loader(): Promise<PasswordPolicy> {
    const { passwordPolicy } = await this.graphQLService.sdk.getPasswordPolicy();

    return passwordPolicy.passwordPolicyConfiguration;
  }
}

export type PasswordPolicyResource = PasswordPolicyResourceImpl;

export class PasswordPolicyResourceDI extends Context.Service<PasswordPolicyResourceDI, PasswordPolicyResourceImpl>()(
  '@cloudbeaver/core-root/PasswordPolicyResource#PasswordPolicyResource',
) {
  static readonly implementation = PasswordPolicyResourceImpl;

  static readonly dependencies = () => [GraphQLService, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    PasswordPolicyResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makePasswordPolicyResource() {
    const graphQLService = yield* GraphQLService;
    const serverConfigResource = yield* ServerConfigResource;

    return new PasswordPolicyResourceImpl(graphQLService, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    PasswordPolicyResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PasswordPolicyResource = PasswordPolicyResourceDI;
