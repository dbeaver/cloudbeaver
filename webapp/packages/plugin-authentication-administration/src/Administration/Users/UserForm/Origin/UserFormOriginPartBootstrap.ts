/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { FormMode } from '@cloudbeaver/core-ui';

import { AdministrationUserFormService } from '../AdministrationUserFormService.js';

const UserFormOriginInfoPanel = React.lazy(async () => {
  const { UserFormOriginInfoPanel } = await import('./UserFormOriginInfoPanel.js');
  return { default: UserFormOriginInfoPanel };
});

const UserFormOriginInfoTab = React.lazy(async () => {
  const { UserFormOriginInfoTab } = await import('./UserFormOriginInfoTab.js');
  return { default: UserFormOriginInfoTab };
});

export class UserFormOriginPartBootstrapImpl extends Bootstrap {
  constructor(private readonly administrationUserFormService: AdministrationUserFormService) {
    super();
  }

  override register(): void {
    this.administrationUserFormService.parts.add({
      key: 'origin',
      order: 2,
      isHidden: (tabId, props) => props?.formState?.mode !== FormMode.Edit,
      panel: () => UserFormOriginInfoPanel,
      tab: () => UserFormOriginInfoTab,
    });
  }
}

export type UserFormOriginPartBootstrap = UserFormOriginPartBootstrapImpl;

export class UserFormOriginPartBootstrapDI extends Context.Service<UserFormOriginPartBootstrapDI, UserFormOriginPartBootstrapImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/UserForm/Origin/UserFormOriginPartBootstrap#UserFormOriginPartBootstrap',
) {
  static readonly implementation = UserFormOriginPartBootstrapImpl;

  static readonly dependencies = () => [AdministrationUserFormService] as const;
  static readonly make: Effect.Effect<UserFormOriginPartBootstrapImpl, never, Context.Service.Identifier<typeof AdministrationUserFormService>> =
    Effect.gen(function* makeUserFormOriginPartBootstrap() {
      const administrationUserFormService = yield* AdministrationUserFormService;

      return new UserFormOriginPartBootstrapImpl(administrationUserFormService);
    });
  static readonly layer: Layer.Layer<UserFormOriginPartBootstrapDI, never, Context.Service.Identifier<typeof AdministrationUserFormService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const UserFormOriginPartBootstrap = UserFormOriginPartBootstrapDI;
