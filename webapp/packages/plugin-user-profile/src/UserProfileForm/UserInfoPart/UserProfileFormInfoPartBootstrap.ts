/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { UserProfileTabsService } from '../../UserProfileTabsService.js';

const UserProfileFormInfo = importLazyComponent(() => import('./UserProfileFormInfo.js').then(m => m.UserProfileFormInfo));

export class UserProfileFormInfoPartBootstrapImpl extends Bootstrap {
  constructor(
    private readonly userProfileTabsService: UserProfileTabsService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super();
  }

  override register(): void {
    this.userProfileTabsService.tabContainer.add({
      key: 'user_info',
      name: 'plugin_user_profile_info',
      icon: '/icons/plugin_user_profile_info.svg',
      order: 1,
      isHidden: () => this.userInfoResource.isAnonymous(),
      panel: () => UserProfileFormInfo,
    });
  }
}

export type UserProfileFormInfoPartBootstrap = UserProfileFormInfoPartBootstrapImpl;

export class UserProfileFormInfoPartBootstrapDI extends Context.Service<UserProfileFormInfoPartBootstrapDI, UserProfileFormInfoPartBootstrapImpl>()(
  '@cloudbeaver/plugin-user-profile/UserProfileForm/UserInfoPart/UserProfileFormInfoPartBootstrap#UserProfileFormInfoPartBootstrap',
) {
  static readonly implementation = UserProfileFormInfoPartBootstrapImpl;

  static readonly dependencies = () => [UserProfileTabsService, UserInfoResource] as const;
  static readonly make: Effect.Effect<
    UserProfileFormInfoPartBootstrapImpl,
    never,
    Context.Service.Identifier<typeof UserProfileTabsService> | Context.Service.Identifier<typeof UserInfoResource>
  > = Effect.gen(function* makeUserProfileFormInfoPartBootstrap() {
    const userProfileTabsService = yield* UserProfileTabsService;
    const userInfoResource = yield* UserInfoResource;

    return new UserProfileFormInfoPartBootstrapImpl(userProfileTabsService, userInfoResource);
  });
  static readonly layer: Layer.Layer<
    UserProfileFormInfoPartBootstrapDI,
    never,
    Context.Service.Identifier<typeof UserProfileTabsService> | Context.Service.Identifier<typeof UserInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserProfileFormInfoPartBootstrap = UserProfileFormInfoPartBootstrapDI;
