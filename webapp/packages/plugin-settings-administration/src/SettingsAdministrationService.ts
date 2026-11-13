/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { IEditableSettingsSource } from '@cloudbeaver/core-settings';
import { TabsContainer } from '@cloudbeaver/core-ui';

export interface IAdministrationSettingsOptions {
  source: IEditableSettingsSource;
  accessor: string[];
}

export class SettingsAdministrationServiceImpl {
  readonly tabsContainer: TabsContainer<void, IAdministrationSettingsOptions>;
  constructor() {
    this.tabsContainer = new TabsContainer('layer');
  }
}

export type SettingsAdministrationService = SettingsAdministrationServiceImpl;

export class SettingsAdministrationServiceDI extends Context.Service<SettingsAdministrationServiceDI, SettingsAdministrationServiceImpl>()(
  '@cloudbeaver/plugin-settings-administration/SettingsAdministrationService#SettingsAdministrationService',
) {
  static readonly implementation = SettingsAdministrationServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<SettingsAdministrationServiceImpl, never, never> = Effect.sync(() => new SettingsAdministrationServiceImpl());
  static readonly layer: Layer.Layer<SettingsAdministrationServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SettingsAdministrationService = SettingsAdministrationServiceDI;
