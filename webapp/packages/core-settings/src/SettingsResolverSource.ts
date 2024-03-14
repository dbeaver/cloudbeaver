/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import type { ISettingsResolverSource } from './ISettingsResolverSource';
import type { ISettingsSource } from './ISettingsSource';
import type { ISettingsLayer } from './SettingsLayer';

interface ISettingsSourcesLayer {
  layer: ISettingsLayer;
  sources: ISettingsSource[];
}

export abstract class SettingsResolverSource implements ISettingsResolverSource {
  protected get sources(): ISettingsSource[] {
    return this.layers
      .slice()
      .sort((a, b) => a.layer.level - b.layer.level)
      .flatMap(layer => layer.sources)
      .reverse();
  }
  protected layers: ISettingsSourcesLayer[];

  constructor() {
    this.layers = [];
    makeObservable<this, 'layers' | 'sources'>(this, {
      layers: observable.shallow,
      sources: computed,
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
    }
  }

  addResolver(layer: ISettingsLayer, ...resolvers: ISettingsSource[]): void {
    if (resolvers.some(this.hasResolver.bind(this, layer))) {
      return;
    }

    const layerSources = this.getOrCreateLayerSources(layer);

    layerSources.sources.push(...resolvers);
  }

  clearResolvers(): void {
    this.layers = [];
  }

  isEdited(key?: any): boolean {
    for (const source of this.sources) {
      if (source.has(key) && source.isReadOnly(key)) {
        break;
      }

      if (source.isEdited(key)) {
        return true;
      }
    }
    return false;
  }

  isReadOnly(key: any): boolean {
    for (const source of this.sources) {
      if (source.isReadOnly(key)) {
        if (source.has(key)) {
          return true;
        }
      } else {
        return false;
      }
    }
    return true;
  }

  has(key: any): boolean {
    return this.sources.some(r => r.has(key));
  }

  getEditedValue(key: any): any {
    const source = this.sources.find(r => r.has(key));

    if (source?.isEdited(key)) {
      return source.getEditedValue(key);
    }

    return this.getValue(key);
  }

  getValue(key: any): any {
    return this.sources.find(r => r.has(key))?.getValue(key);
  }

  setValue(key: any, value: any): void {
    for (const source of this.sources) {
      if (source.has(key) && source.isReadOnly(key)) {
        throw new Error(`Can't set value for key ${key}`);
      }

      if (!source.isReadOnly(key)) {
        source.setValue(key, value);
        return;
      }
    }
  }

  async save(): Promise<void> {
    for (const source of this.sources) {
      if (source.isEdited()) {
        await source.save();
        return;
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
}
