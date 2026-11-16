/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Fill, importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';

const ConfigurationWizardTitle = importLazyComponent(() => import('./ConfigurationWizardTitle.js').then(m => m.ConfigurationWizardTitle));

export class WizardTopAppBarServiceImpl {
  readonly placeholder = new PlaceholderContainer();

  constructor() {
    this.placeholder.add(ConfigurationWizardTitle, 1);
    this.placeholder.add(Fill, 3);
  }
}

export type WizardTopAppBarService = WizardTopAppBarServiceImpl;

export class WizardTopAppBarServiceDI extends Context.Service<WizardTopAppBarServiceDI, WizardTopAppBarServiceImpl>()(
  '@cloudbeaver/plugin-administration/AdministrationScreen/ConfigurationWizard/WizardTopAppBar/WizardTopAppBarService#WizardTopAppBarService',
) {
  static readonly implementation = WizardTopAppBarServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<WizardTopAppBarServiceImpl, never, never> = Effect.sync(() => new WizardTopAppBarServiceImpl());
  static readonly layer: Layer.Layer<WizardTopAppBarServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const WizardTopAppBarService = WizardTopAppBarServiceDI;
