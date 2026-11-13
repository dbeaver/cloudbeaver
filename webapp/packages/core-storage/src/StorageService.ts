/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { LocalStorageSaveService, type LocalStorageType } from '@cloudbeaver/core-browser';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { ISyncExecutor } from '@cloudbeaver/core-executor';

export class StorageServiceImpl {
  readonly onStorageChange: ISyncExecutor<LocalStorageType>;
  constructor(private readonly localStorageSaveService: LocalStorageSaveService) {
    this.onStorageChange = this.localStorageSaveService.onStorageChange;
  }

  /**
   * if autosaved value exits the settings object will be populated with this value
   * @param key
   * @param settings - observable object expected
   */
  registerSettings<T extends Record<any, any> | Map<any, any>>(
    storeId: string,
    store: T,
    defaultValue: () => T extends any ? T : never,
    remap?: (savedStore: T) => T,
    onUpdate?: () => void,
    storageType?: LocalStorageType,
  ): void {
    this.localStorageSaveService.withAutoSave(storeId, store, defaultValue, remap, onUpdate, storageType);
  }
}

export type StorageService = StorageServiceImpl;

export class StorageServiceDI extends Context.Service<StorageServiceDI, StorageServiceImpl>()(
  '@cloudbeaver/core-storage/StorageService#StorageService',
) {
  static readonly implementation = StorageServiceImpl;

  static readonly dependencies = () => [LocalStorageSaveService] as const;
  static readonly make: Effect.Effect<StorageServiceImpl, never, Context.Service.Identifier<typeof LocalStorageSaveService>> = Effect.gen(
    function* makeStorageService() {
      const localStorageSaveService = yield* LocalStorageSaveService;

      return new StorageServiceImpl(localStorageSaveService);
    },
  );
  static readonly layer: Layer.Layer<StorageServiceDI, never, Context.Service.Identifier<typeof LocalStorageSaveService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const StorageService = StorageServiceDI;
