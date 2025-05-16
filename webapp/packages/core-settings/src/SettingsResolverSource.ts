/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import type { ISettingsResolverSource } from './ISettingsResolverSource.js';
import type { ISettingChangeData, ISettingsSource } from './ISettingsSource.js';
import type { ISettingsLayer } from './SettingsLayer.js';

interface ISettingsSourcesLayer {
  layer: ISettingsLayer;
  sources: ISettingsSource[];
}

export class SettingsResolverSource implements ISettingsResolverSource {
  readonly onChange: ISyncExecutor<ISettingChangeData>;
  protected get sources(): ISettingsSource[] {
    return this.layers
      .slice()
      .sort((a, b) => a.layer.level - b.layer.level)
      .flatMap(layer => layer.sources)
      .reverse();
  }
  protected layers: ISettingsSourcesLayer[];
  private updating: boolean;

  constructor() {
    this.onChange = new SyncExecutor();
    this.layers = [];
    this.updating = false;
    makeObservable<this, 'layers' | 'sources' | 'update'>(this, {
      layers: observable.shallow,
      sources: computed,
      update: action,
    });
  }

  hasResolver(layer: ISettingsLayer, resolver: ISettingsSource): boolean {
    return this.tryGetLayerSources(layer)?.sources.includes(resolver) || false;
  }

  removeResolver(layer: ISettingsLayer, resolver: ISettingsSource): void {
    const layerSources = this.getLayerSources(layer);

    const index = layerSources.sources.indexOf(resolver);

    if (index !== -1) {
      layerSources.sources.splice(index, 1);
      resolver.onChange.removeNext(this.onChange);
    }
  }

  addResolver(layer: ISettingsLayer, ...resolvers: ISettingsSource[]): void {
    if (resolvers.some(this.hasResolver.bind(this, layer))) {
      return;
    }

    const layerSources = this.getOrCreateLayerSources(layer);

    layerSources.sources.push(...resolvers);

    for (const resolver of resolvers) {
      resolver.onChange.next(
        this.onChange,
        data => {
          if (resolver.has(data.key)) {
            return data;
          }
          return { ...data, value: this.getValue(data.key) };
        },
        data => !resolver.has(data.key) || this.sources.find(r => r.has(data.key)) === resolver,
      );
    }
  }

  clearResolvers(): void {
    this.layers = [];
  }

  isOverrideDefaults(): boolean {
    return this.sources.some(r => r.isOverrideDefaults?.());
  }

  isEdited(key?: any): boolean {
    return this.sources.find(r => r.has(key))?.isEdited(key) || false;
  }

  isReadOnly(key: any, stopAt?: ISettingsSource): boolean {
    for (const source of this.sources) {
      if (!source.has(key)) {
        continue;
      }

      if (source === stopAt) {
        break;
      }

      if (source.isReadOnly(key)) {
        return true;
      }
    }
    return false;
  }

  has(key: any): boolean {
    return this.sources.some(r => r.has(key));
  }

  getEditedValue(key: any): any {
    return this.sources.find(r => r.has(key) && isNotNullDefined(r.getEditedValue(key)))?.getEditedValue(key);
  }

  getValue(key: any): any {
    return this.sources.find(r => r.has(key) && isNotNullDefined(r.getValue(key)))?.getValue(key);
  }

  setValue(key: any, value: any): void {
    for (const source of this.sources) {
      const readonly = source.isReadOnly(key);

      if (source.has(key) && readonly) {
        throw new Error(`Can't set value for key ${key}`);
      }

      if (!readonly) {
        source.setValue(key, value);
        return;
      }
    }
  }

  async save(): Promise<void> {
    for (const source of this.sources) {
      if (source.isEdited()) {
        await source.save();
      }
    }
  }

  clear(): void {
    for (const resolver of this.sources) {
      resolver.clear();
    }
  }

  protected getOrCreateLayerSources(layer: ISettingsLayer): ISettingsSourcesLayer {
    if (!this.tryGetLayerSources(layer)) {
      this.layers.push(observable({ layer, sources: [] }, { sources: observable.shallow }));
    }

    return this.getLayerSources(layer);
  }

  protected tryGetLayerSources(layer: ISettingsLayer): ISettingsSourcesLayer | undefined {
    const layerSources = this.layers.find(layerSources => layerSources.layer === layer);

    return layerSources;
  }

  protected getLayerSources(layer: ISettingsLayer): ISettingsSourcesLayer {
    const layerSources = this.tryGetLayerSources(layer);

    if (!layerSources) {
      throw new Error('Resolver not found');
    }

    return layerSources;
  }

  protected getSnapshot(): Record<string, any> {
    return {};
  }

  protected update(action: () => void) {
    if (this.updating) {
      action();
      return;
    }

    this.updating = true;
    try {
      const snapshot = this.getSnapshot();
      action();
      const newSnapshot = this.getSnapshot();

      for (const [key, value] of Object.entries(newSnapshot)) {
        if (snapshot[key] !== value) {
          this.onChange.execute({ key, value });
        }
      }

      for (const key of Object.keys(snapshot)) {
        if (!(key in newSnapshot)) {
          this.onChange.execute({ key, value: undefined });
        }
      }
    } finally {
      this.updating = false;
    }
  }
}
