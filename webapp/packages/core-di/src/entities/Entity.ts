/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { uuid } from '@cloudbeaver/core-utils';

import { DIContainer } from '../DIContainer';
import { IServiceInjector } from '../IApp';
import { InjectionToken } from '../InjectionToken';
import { ITypedConstructor } from '../ITypedConstructor';
import { ServiceInjectorToken } from './ServiceInjectorToken';

export class Entity {
  readonly id: string;

  protected container = new DIContainer();
  @observable.shallow protected children = new Map<string, Entity>()

  private mixins: InjectionToken<any>[] = [];

  constructor(providers: MixinProvider<any>[] = [], id?: string) {
    this.id = id || uuid();
    this.addMixin(Entity, this);
    this.addMixin(ServiceInjectorToken, this.getServiceInjector());
    this.addProviders(providers);
  }

  addChild(entity: Entity) {
    if (this.children.has(entity.id)) {
      throw new Error(`Entity (${this.id}) already contains child entity (${entity.id})`);
    }
    this.children.set(entity.id, entity);
    entity.bindWithParent(this);
  }

  removeChild(id: string) {
    if (!this.children.has(id)) {
      throw new Error(`Child entity (${id}) not found in entity (${this.id})`);
    }
    const entity = this.children.get(id);
    if (entity) {
      entity.destroyEntity();
      this.children.delete(id);
    }
  }

  removeAll() {
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

  protected bindWithParent(entity: Entity) {
    this.container.bindWithParent(entity.container);
  }

  /**
   * Destroy mixins in the reverse order of addition
   */
  destroyEntity() {
    this.mixins.reverse().forEach((token) => {
      const mixin = this.getMixin(token) as IDestroyableMixin;
      if (mixin.destruct) {
        mixin.destruct();
      }
    });
  }

  protected addProviders(providers: MixinProvider<any>[]) {
    providers.forEach((provider) => {
      if (typeof provider === 'function') {
        this.addMixin(provider);
      } else {
        this.addMixin(provider.token, provider.value);
      }
    });
  }

  protected addMixin(ctor: ITypedConstructor<any>): void;
  protected addMixin<T extends object>(token: InjectionToken<T>, value: T): void;
  protected addMixin<T extends object>(ctorOrToken: InjectionToken<T>, value?: T): void {
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

export type MixinProvider<T extends object> = ITypedConstructor<T> | {
  token: InjectionToken<T>;
  value: T;
};

export interface IDestroyableMixin {
  destruct(): void;
}
