/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';

import { AdministrationUsersManagementService } from '../../../AdministrationUsersManagementService.js';
import { UsersAdministrationService } from '../UsersAdministrationService.js';

const CreateUserButton = importLazyComponent(() => import('./CreateUserButton.js').then(m => m.CreateUserButton));

export class CreateUserBootstrapImpl extends Bootstrap {
  constructor(
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly usersAdministrationService: UsersAdministrationService,
    private readonly administrationUsersManagementService: AdministrationUsersManagementService,
  ) {
    super();
  }

  override register(): void {
    this.usersAdministrationService.actions.add(
      CreateUserButton,
      2,
      () => this.administrationUsersManagementService.externalUserProviderEnabled || !this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID),
      () => [
        getCachedMapResourceLoaderState(this.authProvidersResource, () => CachedMapAllKey),
        ...this.administrationUsersManagementService.loaders,
      ],
    );
  }
}

export type CreateUserBootstrap = CreateUserBootstrapImpl;

export class CreateUserBootstrapDI extends Context.Service<CreateUserBootstrapDI, CreateUserBootstrapImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/UsersTable/CreateUserBootstrap#CreateUserBootstrap',
) {
  static readonly implementation = CreateUserBootstrapImpl;

  static readonly dependencies = () => [AuthProvidersResource, UsersAdministrationService, AdministrationUsersManagementService] as const;
  static readonly make: Effect.Effect<
    CreateUserBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof AuthProvidersResource>
    | Context.Service.Identifier<typeof UsersAdministrationService>
    | Context.Service.Identifier<typeof AdministrationUsersManagementService>
  > = Effect.gen(function* makeCreateUserBootstrap() {
    const authProvidersResource = yield* AuthProvidersResource;
    const usersAdministrationService = yield* UsersAdministrationService;
    const administrationUsersManagementService = yield* AdministrationUsersManagementService;

    return new CreateUserBootstrapImpl(authProvidersResource, usersAdministrationService, administrationUsersManagementService);
  });
  static readonly layer: Layer.Layer<
    CreateUserBootstrapDI,
    never,
    | Context.Service.Identifier<typeof AuthProvidersResource>
    | Context.Service.Identifier<typeof UsersAdministrationService>
    | Context.Service.Identifier<typeof AdministrationUsersManagementService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const CreateUserBootstrap = CreateUserBootstrapDI;
