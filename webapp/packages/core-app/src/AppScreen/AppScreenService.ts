/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

export const PANEL_ID_LEFT_SIDEBAR = 'dbeaver-left-sidebar';
export const PANEL_ID_RIGHT_SIDEBAR = 'dbeaver-right-sidebar';
export const PANEL_ID_MAIN_CONTENT = 'dbeaver-main-content';

export class AppScreenServiceImpl {
  static screenName = 'app';
  readonly placeholder: PlaceholderContainer;
  readonly rightAreaTop: PlaceholderContainer;
  readonly rightAreaBottom: PlaceholderContainer;

  constructor() {
    this.placeholder = new PlaceholderContainer();
    this.rightAreaTop = new PlaceholderContainer();
    this.rightAreaBottom = new PlaceholderContainer();
  }
}

export type AppScreenService = AppScreenServiceImpl;

export class AppScreenServiceDI extends Context.Service<AppScreenServiceDI, AppScreenServiceImpl>()(
  '@cloudbeaver/core-app/AppScreen/AppScreenService#AppScreenService',
) {
  static readonly implementation = AppScreenServiceImpl;
  static readonly screenName = AppScreenServiceImpl.screenName;
  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<AppScreenServiceImpl, never, never> = Effect.sync(() => new AppScreenServiceImpl());
  static readonly layer: Layer.Layer<AppScreenServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AppScreenService = AppScreenServiceDI;
