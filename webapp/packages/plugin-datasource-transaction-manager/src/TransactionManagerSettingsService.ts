/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.datasource-transaction-manager.disabled': schemaExtra.stringedBoolean().default(false),
  'plugin.datasource-transaction-manager.allowCommitModeSwitch': schemaExtra.stringedBoolean().default(true),
});

export class TransactionManagerSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('plugin.datasource-transaction-manager.disabled');
  }

  get allowCommitModeSwitch(): boolean {
    return this.settings.getValue('plugin.datasource-transaction-manager.allowCommitModeSwitch');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
  }
}

export type TransactionManagerSettingsService = TransactionManagerSettingsServiceImpl;

export class TransactionManagerSettingsServiceDI extends Context.Service<
  TransactionManagerSettingsServiceDI,
  TransactionManagerSettingsServiceImpl
>()('@cloudbeaver/plugin-datasource-transaction-manager/TransactionManagerSettingsService#TransactionManagerSettingsService') {
  static readonly implementation = TransactionManagerSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService] as const;
  static readonly make: Effect.Effect<TransactionManagerSettingsServiceImpl, never, Context.Service.Identifier<typeof SettingsProviderService>> =
    Effect.gen(function* makeTransactionManagerSettingsService() {
      const settingsProviderService = yield* SettingsProviderService;

      return new TransactionManagerSettingsServiceImpl(settingsProviderService);
    });
  static readonly layer: Layer.Layer<TransactionManagerSettingsServiceDI, never, Context.Service.Identifier<typeof SettingsProviderService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const TransactionManagerSettingsService = TransactionManagerSettingsServiceDI;
