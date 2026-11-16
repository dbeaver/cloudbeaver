/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { AdministrationUserFormService } from '../AdministrationUserFormService.js';
import { getUserFormConnectionAccessPart } from './getUserFormConnectionAccessPart.js';

const UserConnectionAccessTable = importLazyComponent(() => import('./UserConnectionAccessTable.js').then(m => m.UserConnectionAccessTable));

export class UserFormConnectionAccessPartBootstrapImpl extends Bootstrap {
  constructor(
    private readonly administrationUserFormService: AdministrationUserFormService,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    super();
  }

  override register(): void {
    this.administrationUserFormService.parts.add({
      key: 'connections_access',
      name: 'authentication_administration_user_connections_access',
      title: 'authentication_administration_user_connections_access',
      order: 3,
      panel: () => UserConnectionAccessTable,
      isHidden: () => !this.projectInfoResource.values.some(isGlobalProject),
      stateGetter: props => () => getUserFormConnectionAccessPart(props.formState),
      getLoader: () => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
    });
  }
}

export type UserFormConnectionAccessPartBootstrap = UserFormConnectionAccessPartBootstrapImpl;

export class UserFormConnectionAccessPartBootstrapDI extends Context.Service<
  UserFormConnectionAccessPartBootstrapDI,
  UserFormConnectionAccessPartBootstrapImpl
>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/UserForm/ConnectionAccess/UserFormConnectionAccessPartBootstrap#UserFormConnectionAccessPartBootstrap',
) {
  static readonly implementation = UserFormConnectionAccessPartBootstrapImpl;

  static readonly dependencies = () => [AdministrationUserFormService, ProjectInfoResource] as const;
  static readonly make: Effect.Effect<
    UserFormConnectionAccessPartBootstrapImpl,
    never,
    Context.Service.Identifier<typeof AdministrationUserFormService> | Context.Service.Identifier<typeof ProjectInfoResource>
  > = Effect.gen(function* makeUserFormConnectionAccessPartBootstrap() {
    const administrationUserFormService = yield* AdministrationUserFormService;
    const projectInfoResource = yield* ProjectInfoResource;

    return new UserFormConnectionAccessPartBootstrapImpl(administrationUserFormService, projectInfoResource);
  });
  static readonly layer: Layer.Layer<
    UserFormConnectionAccessPartBootstrapDI,
    never,
    Context.Service.Identifier<typeof AdministrationUserFormService> | Context.Service.Identifier<typeof ProjectInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserFormConnectionAccessPartBootstrap = UserFormConnectionAccessPartBootstrapDI;
