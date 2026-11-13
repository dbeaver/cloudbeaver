/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { AdministrationUserFormService } from '../AdministrationUserFormService.js';
import { getUserFormInfoPart } from './getUserFormInfoPart.js';

const UserFormInfo = importLazyComponent(() => import('./UserFormInfo.js').then(m => m.UserFormInfo));

export class UserFormInfoPartBootstrapImpl extends Bootstrap {
  constructor(private readonly administrationUserFormService: AdministrationUserFormService) {
    super();
  }

  override register(): void {
    this.administrationUserFormService.parts.add({
      key: 'info',
      name: 'authentication_administration_user_info',
      title: 'authentication_administration_user_info',
      order: 1,
      panel: () => UserFormInfo,
      stateGetter: props => () => getUserFormInfoPart(props.formState),
    });
  }
}

export type UserFormInfoPartBootstrap = UserFormInfoPartBootstrapImpl;

export class UserFormInfoPartBootstrapDI extends Context.Service<UserFormInfoPartBootstrapDI, UserFormInfoPartBootstrapImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/UserForm/Info/UserFormInfoPartBootstrap#UserFormInfoPartBootstrap',
) {
  static readonly implementation = UserFormInfoPartBootstrapImpl;

  static readonly dependencies = () => [AdministrationUserFormService] as const;
  static readonly make: Effect.Effect<UserFormInfoPartBootstrapImpl, never, Context.Service.Identifier<typeof AdministrationUserFormService>> =
    Effect.gen(function* makeUserFormInfoPartBootstrap() {
      const administrationUserFormService = yield* AdministrationUserFormService;

      return new UserFormInfoPartBootstrapImpl(administrationUserFormService);
    });
  static readonly layer: Layer.Layer<UserFormInfoPartBootstrapDI, never, Context.Service.Identifier<typeof AdministrationUserFormService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const UserFormInfoPartBootstrap = UserFormInfoPartBootstrapDI;
