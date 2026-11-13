/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { createSettingsLayer, EditableSettingsSource, ROOT_SETTINGS_LAYER } from '@cloudbeaver/core-settings';

export const PRODUCT_SETTINGS_LAYER = createSettingsLayer(ROOT_SETTINGS_LAYER, 'product');

export class ProductSettingsServiceImpl extends EditableSettingsSource {
  private readonly settings: Map<string, any>;

  constructor() {
    super();
    this.settings = new Map();
    makeObservable<this, 'settings'>(this, {
      settings: observable.shallow,
    });
  }

  override has(key: any): boolean {
    return this.settings.has(key) || super.has(key) || false;
  }

  isReadOnly(): boolean {
    return true;
  }

  getValue(key: any): any {
    return this.settings.get(key);
  }

  override setValue(key: any, value: any): void {
    this.update(() => {
      this.settings.set(key, value);
    });
  }

  setSettingsObject(settings: Record<string, any>): void {
    this.update(() => {
      if (settings && typeof settings === 'object') {
        for (const [key, value] of Object.entries(settings)) {
          this.setValue(key, value);
        }
      }
    });
  }

  override clear(): void {
    this.update(() => {
      super.clear();
      this.settings.clear();
    });
  }

  async save(): Promise<void> {}

  protected getSnapshot(): Record<string, any> {
    return Object.fromEntries(this.settings.entries());
  }
}

export type ProductSettingsService = ProductSettingsServiceImpl;

export class ProductSettingsServiceDI extends Context.Service<ProductSettingsServiceDI, ProductSettingsServiceImpl>()(
  '@cloudbeaver/core-product/ProductSettingsService#ProductSettingsService',
) {
  static readonly implementation = ProductSettingsServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<ProductSettingsServiceImpl, never, never> = Effect.sync(() => new ProductSettingsServiceImpl());
  static readonly layer: Layer.Layer<ProductSettingsServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ProductSettingsService = ProductSettingsServiceDI;
