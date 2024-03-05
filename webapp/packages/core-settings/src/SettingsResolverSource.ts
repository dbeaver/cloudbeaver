/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import type { ISettingsResolverSource } from './ISettingsResolverSource';
import type { ISettingsSource } from './ISettingsSource';

export abstract class SettingsResolverSource implements ISettingsResolverSource {
  protected resolvers: ISettingsSource[];

  constructor() {
    this.resolvers = [];
    makeObservable<this, 'resolvers'>(this, {
      resolvers: observable.shallow,
    });
  }

  hasResolver(resolver: ISettingsSource): boolean {
    return this.resolvers.includes(resolver);
  }

  removeResolver(resolver: ISettingsSource): void {
    const index = this.resolvers.indexOf(resolver);

    if (index !== -1) {
      this.resolvers.splice(index, 1);
    }
  }

  addResolver(...resolvers: ISettingsSource[]): void {
    if (resolvers.some(this.hasResolver.bind(this))) {
      return;
    }

    this.resolvers.push(...resolvers);
  }

  clearResolvers(): void {
    this.resolvers = [];
  }

  isReadOnly(key: any): boolean {
    return this.resolvers.every(r => r.isReadOnly(key));
  }

  has(key: any): boolean {
    return this.resolvers.some(r => r.has(key));
  }

  getDefaultValue(key: any): any {
    return this.resolvers.find(r => r.getDefaultValue(key) !== undefined)?.getDefaultValue(key);
  }

  getValue(key: any): any {
    return this.resolvers.find(r => r.has(key))?.getValue(key);
  }

  setValue(key: any, value: any): void {
    for (const resolver of this.resolvers) {
      if (!resolver.isReadOnly(key)) {
        resolver.setValue(key, value);
        return;
      }
    }

    throw new Error(`Can't set value for key ${key}`);
  }

  clear(): void {
    for (const resolver of this.resolvers) {
      resolver.clear();
    }
  }
}
