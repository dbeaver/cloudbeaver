/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { SESSION_SETTINGS_LAYER } from '@cloudbeaver/core-root';
import { UserSettingsResolverService } from '@cloudbeaver/core-settings';

import { UserSettingsService } from './UserSettingsService.js';

export class SettingsUserBootstrapImpl extends Bootstrap {
  constructor(
    private readonly userSettingsResolverService: UserSettingsResolverService,
    private readonly userSettingsService: UserSettingsService,
  ) {
    super();
  }

  override register(): void {
    this.userSettingsResolverService.addResolver(SESSION_SETTINGS_LAYER, this.userSettingsService);
  }
}

export type SettingsUserBootstrap = SettingsUserBootstrapImpl;

export class SettingsUserBootstrapDI extends Context.Service<SettingsUserBootstrapDI, SettingsUserBootstrapImpl>()(
  '@cloudbeaver/core-settings-user/SettingsUserBootstrap#SettingsUserBootstrap',
) {
  static readonly implementation = SettingsUserBootstrapImpl;

  static readonly dependencies = () => [UserSettingsResolverService, UserSettingsService] as const;
  static readonly make: Effect.Effect<
    SettingsUserBootstrapImpl,
    never,
    Context.Service.Identifier<typeof UserSettingsResolverService> | Context.Service.Identifier<typeof UserSettingsService>
  > = Effect.gen(function* makeSettingsUserBootstrap() {
    const userSettingsResolverService = yield* UserSettingsResolverService;
    const userSettingsService = yield* UserSettingsService;

    return new SettingsUserBootstrapImpl(userSettingsResolverService, userSettingsService);
  });
  static readonly layer: Layer.Layer<
    SettingsUserBootstrapDI,
    never,
    Context.Service.Identifier<typeof UserSettingsResolverService> | Context.Service.Identifier<typeof UserSettingsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SettingsUserBootstrap = SettingsUserBootstrapDI;
