/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { uuid } from '@cloudbeaver/core-utils';

import { DIContainer } from '../DIContainer';
import type { IServiceInjector } from '../IApp';
import type { InjectionToken } from '../InjectionToken';
import type { ITypedConstructor } from '../ITypedConstructor';
import { ServiceInjectorToken } from './ServiceInjectorToken';

export class Entity {
  readonly id: string;

  protected container = new DIContainer();
  protected children = new Map<string, Entity>();

  private mixins: Array<InjectionToken<any>> = [];

  constructor(providers: Array<MixinProvider<any>> = [], id?: string) {
    makeObservable<Entity, 'children'>(this, {
      children: observable.shallow,
    });

    this.id = id || uuid();
    this.addMixin(Entity, this);
    this.addMixin(ServiceInjectorToken, this.getServiceInjector());
    this.addProviders(providers);
  }

  addChild(entity: Entity): void {
    if (this.children.has(entity.id)) {
      this.removeChild(entity.id);
      // throw new Error(`Entity (${this.id}) already contains child entity (${entity.id})`);
    }
    this.children.set(entity.id, entity);
    entity.bindWithParent(this);
  }

  removeChild(id: string): void {
    if (!this.children.has(id)) {
      return;
      // throw new Error(`Child entity (${id}) not found in entity (${this.id})`);
    }
    const entity = this.children.get(id);
    if (entity) {
      entity.destroyEntity();
      this.children.delete(id);
    }
  }

  removeAll(): void {
    const ids: string[] = [];

    for (const [key, value] of this.children) {
      ids.push(key);
      value.destroyEntity();
    }

    for (const id of ids) {
      this.children.delete(id);
    }
  }

  getChild(id: string): Entity | undefined {
    return this.children.get(id);
  }

  /**
   * to use for creation of nested React context
   */
  getServiceInjector(): IServiceInjector {
    return this.container;
  }

  protected bindWithParent(entity: Entity): void {
    this.container.bindWithParent(entity.container);
  }

  /**
   * Destroy mixins in the reverse order of addition
   */
  destroyEntity(): void {
    this.mixins.reverse().forEach(token => {
      const mixin = this.getMixin(token) as IDestroyableMixin;
      if (mixin.destruct) {
        mixin.destruct();
      }
    });
  }

  protected addProviders(providers: Array<MixinProvider<any>>): void {
    providers.forEach(provider => {
      if (typeof provider === 'function') {
        this.addMixin(provider);
      } else {
        this.addMixin(provider.token, provider.value);
      }
    });
  }

  protected addMixin(ctor: ITypedConstructor<any>): void;
  protected addMixin<T extends Record<string, any>>(token: InjectionToken<T>, value: T): void;
  protected addMixin<T extends Record<string, any>>(ctorOrToken: InjectionToken<T>, value?: T): void {
    this.mixins.push(ctorOrToken as InjectionToken<any>);
    if (value !== undefined) {
      this.container.addServiceByToken(ctorOrToken, value);
      return;
    }
    this.container.addServiceByClass(ctorOrToken as ITypedConstructor<any>);
  }

  getMixin<T>(token: InjectionToken<T>): T {
    return this.container.getServiceByToken<T>(token);
  }
}

export type MixinProvider<T extends Record<string, any>> = ITypedConstructor<T> | {
  token: InjectionToken<T>;
  value: T;
};

export interface IDestroyableMixin {
  destruct: () => void;
}
