/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import type { ISettingsResolverSource } from './ISettingsResolverSource';
import type { ISettingsSource } from './ISettingsSource';

export abstract class SettingsResolverSource implements ISettingsResolverSource {
  protected get mainResolver(): ISettingsSource | undefined {
    if (this.resolvers.length === 0) {
      return undefined;
    }
    return this.resolvers[0];
  }
  protected resolvers: ISettingsSource[];

  constructor() {
    this.resolvers = [];
    makeObservable<this, 'resolvers' | 'mainResolver'>(this, {
      resolvers: observable.shallow,
      mainResolver: computed,
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

  addResolver(resolver: ISettingsSource): void {
    if (this.hasResolver(resolver)) {
      return;
    }

    this.resolvers.unshift(resolver);
  }

  has(key: any): boolean {
    return this.resolvers.some(r => r.has(key));
  }

  getValue(key: any): any {
    return this.resolvers.find(r => r.has(key))?.getValue(key);
  }

  setValue(key: any, value: any): void {
    this.mainResolver?.setValue(key, value);
  }

  clear(): void {
    this.resolvers = [];
  }
}
