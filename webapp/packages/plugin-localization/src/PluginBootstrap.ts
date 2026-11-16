/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { autorun, type IReactionDisposer } from 'mobx';

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { schemaExtra } from '@cloudbeaver/core-utils';

export class PluginBootstrapImpl extends Bootstrap {
  private reactionDisposer: IReactionDisposer | null;
  constructor(private readonly localizationService: LocalizationService) {
    super();
    this.reactionDisposer = null;
  }

  override register(): void {
    this.reactionDisposer = autorun(() => schemaExtra.setLocale(this.localizationService.currentLanguage));
    this.localizationService.addProvider(async locale => {
      await schemaExtra.loadLocale(locale);
      return [];
    });
  }

  override dispose(): void {
    this.reactionDisposer?.();
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-localization/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [LocalizationService] as const;
  static readonly make: Effect.Effect<PluginBootstrapImpl, never, Context.Service.Identifier<typeof LocalizationService>> = Effect.gen(
    function* makePluginBootstrap() {
      const localizationService = yield* LocalizationService;

      return new PluginBootstrapImpl(localizationService);
    },
  );
  static readonly layer: Layer.Layer<PluginBootstrapDI, never, Context.Service.Identifier<typeof LocalizationService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
