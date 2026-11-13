/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { AdministrationTopAppBarService } from '@cloudbeaver/plugin-administration';
import { HolidayActionButtonLazy } from '@cloudbeaver/plugin-holidays';

export class HolidayAdministrationBootstrapImpl extends Bootstrap {
  constructor(private readonly administrationTopAppBarService: AdministrationTopAppBarService) {
    super();
  }

  override register() {
    this.administrationTopAppBarService.placeholder.add(HolidayActionButtonLazy, 4);
  }
}

export type HolidayAdministrationBootstrap = HolidayAdministrationBootstrapImpl;

export class HolidayAdministrationBootstrapDI extends Context.Service<HolidayAdministrationBootstrapDI, HolidayAdministrationBootstrapImpl>()(
  '@cloudbeaver/plugin-holidays-administration/PluginBootstrap#HolidayAdministrationBootstrap',
) {
  static readonly implementation = HolidayAdministrationBootstrapImpl;

  static readonly dependencies = () => [AdministrationTopAppBarService] as const;
  static readonly make: Effect.Effect<HolidayAdministrationBootstrapImpl, never, Context.Service.Identifier<typeof AdministrationTopAppBarService>> =
    Effect.gen(function* makeHolidayAdministrationBootstrap() {
      const administrationTopAppBarService = yield* AdministrationTopAppBarService;

      return new HolidayAdministrationBootstrapImpl(administrationTopAppBarService);
    });
  static readonly layer: Layer.Layer<HolidayAdministrationBootstrapDI, never, Context.Service.Identifier<typeof AdministrationTopAppBarService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const HolidayAdministrationBootstrap = HolidayAdministrationBootstrapDI;
