/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ADMINISTRATION_ITEM_USER_CREATE_PARAM } from './ADMINISTRATION_ITEM_USER_CREATE_PARAM.js';

export enum EUsersAdministrationSub {
  Users = 'users',
  Teams = 'teams',
  MetaProperties = 'metaProperties',
  Permissions = 'permissions',
}

export class UsersAdministrationNavigationServiceImpl {
  static ItemName = 'users';

  constructor(private readonly administrationScreenService: AdministrationScreenService) {
    this.navToRoot = this.navToRoot.bind(this);
  }

  navToRoot(): void {
    this.administrationScreenService.navigateToItem(UsersAdministrationNavigationServiceImpl.ItemName);
  }

  navToCreate(): void {
    this.navToSub(EUsersAdministrationSub.Users, ADMINISTRATION_ITEM_USER_CREATE_PARAM);
  }

  navToSub(sub: EUsersAdministrationSub | string, param?: string): void {
    this.administrationScreenService.navigateToItemSub(UsersAdministrationNavigationServiceImpl.ItemName, sub, param);
  }
}

export type UsersAdministrationNavigationService = UsersAdministrationNavigationServiceImpl;

export class UsersAdministrationNavigationServiceDI extends Context.Service<
  UsersAdministrationNavigationServiceDI,
  UsersAdministrationNavigationServiceImpl
>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/UsersAdministrationNavigationService#UsersAdministrationNavigationService',
) {
  static readonly implementation = UsersAdministrationNavigationServiceImpl;
  static readonly ItemName = UsersAdministrationNavigationServiceImpl.ItemName;
  static readonly dependencies = () => [AdministrationScreenService] as const;
  static readonly make: Effect.Effect<
    UsersAdministrationNavigationServiceImpl,
    never,
    Context.Service.Identifier<typeof AdministrationScreenService>
  > = Effect.gen(function* makeUsersAdministrationNavigationService() {
    const administrationScreenService = yield* AdministrationScreenService;

    return new UsersAdministrationNavigationServiceImpl(administrationScreenService);
  });
  static readonly layer: Layer.Layer<UsersAdministrationNavigationServiceDI, never, Context.Service.Identifier<typeof AdministrationScreenService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const UsersAdministrationNavigationService = UsersAdministrationNavigationServiceDI;
