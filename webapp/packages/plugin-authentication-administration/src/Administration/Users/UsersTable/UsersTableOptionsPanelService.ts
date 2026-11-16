/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UsersResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { BaseOptionsPanelService, OptionsPanelService } from '@cloudbeaver/core-ui';

const UsersTableOptionsPanel = importLazyComponent(() => import('./UsersTableOptionsPanel.js').then(m => m.UsersTableOptionsPanel));
const panelGetter = () => UsersTableOptionsPanel;

export class UsersTableOptionsPanelServiceImpl extends BaseOptionsPanelService<string> {
  constructor(
    optionsPanelService: OptionsPanelService,
    private readonly usersResource: UsersResource,
  ) {
    super(optionsPanelService, panelGetter);

    this.usersResource.onItemDelete.addHandler(data => {
      if (data === this.itemId) {
        this.close();
      }
    });
  }
}

export type UsersTableOptionsPanelService = UsersTableOptionsPanelServiceImpl;

export class UsersTableOptionsPanelServiceDI extends Context.Service<UsersTableOptionsPanelServiceDI, UsersTableOptionsPanelServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/UsersTable/UsersTableOptionsPanelService#UsersTableOptionsPanelService',
) {
  static readonly implementation = UsersTableOptionsPanelServiceImpl;

  static readonly dependencies = () => [OptionsPanelService, UsersResource] as const;
  static readonly make: Effect.Effect<
    UsersTableOptionsPanelServiceImpl,
    never,
    Context.Service.Identifier<typeof OptionsPanelService> | Context.Service.Identifier<typeof UsersResource>
  > = Effect.gen(function* makeUsersTableOptionsPanelService() {
    const optionsPanelService = yield* OptionsPanelService;
    const usersResource = yield* UsersResource;

    return new UsersTableOptionsPanelServiceImpl(optionsPanelService, usersResource);
  });
  static readonly layer: Layer.Layer<
    UsersTableOptionsPanelServiceDI,
    never,
    Context.Service.Identifier<typeof OptionsPanelService> | Context.Service.Identifier<typeof UsersResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UsersTableOptionsPanelService = UsersTableOptionsPanelServiceDI;
