/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService, type IAdministrationItemRoute } from '@cloudbeaver/core-administration';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type IActiveView, View } from '@cloudbeaver/core-view';

export class AdministrationViewServiceImpl extends View<IAdministrationItemRoute | null> {
  constructor(private readonly administrationScreenService: AdministrationScreenService) {
    super();
    this.getView = this.getView.bind(this);
  }

  getView(): IActiveView<IAdministrationItemRoute | null> | null {
    return {
      context: this.administrationScreenService.activeScreen,
      extensions: [],
    };
  }
}

export type AdministrationViewService = AdministrationViewServiceImpl;

export class AdministrationViewServiceDI extends Context.Service<AdministrationViewServiceDI, AdministrationViewServiceImpl>()(
  '@cloudbeaver/plugin-administration/Administration/AdministrationViewService#AdministrationViewService',
) {
  static readonly implementation = AdministrationViewServiceImpl;

  static readonly dependencies = () => [AdministrationScreenService] as const;
  static readonly make: Effect.Effect<AdministrationViewServiceImpl, never, Context.Service.Identifier<typeof AdministrationScreenService>> =
    Effect.gen(function* makeAdministrationViewService() {
      const administrationScreenService = yield* AdministrationScreenService;

      return new AdministrationViewServiceImpl(administrationScreenService);
    });
  static readonly layer: Layer.Layer<AdministrationViewServiceDI, never, Context.Service.Identifier<typeof AdministrationScreenService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const AdministrationViewService = AdministrationViewServiceDI;
