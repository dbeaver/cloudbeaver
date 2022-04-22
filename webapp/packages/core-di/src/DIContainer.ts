/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Container } from 'inversify';

import type { IServiceCollection, IServiceConstructor, IServiceInjector } from './IApp';
import type { InjectionToken } from './InjectionToken';
import { isConstructor } from './isConstructor';

export class DIContainer implements IServiceInjector, IServiceCollection {
  protected container = new Container({
    defaultScope: 'Singleton',
    skipBaseClassChecks: true,
  });

  private parent: DIContainer | null = null;

  constructor(parent?: DIContainer) {
    if (parent) {
      this.bindWithParent(parent);
    }
  }

  bindWithParent(parent: DIContainer): void {
    this.container.parent = parent.container;
    this.parent = parent;
  }

  unbindParent(): void {
    this.container.parent = null;
    this.parent = null;
  }

  getParent(): DIContainer | null {
    return this.parent;
  }

  getServiceByClass<T>(ctor: IServiceConstructor<T>): T {
    return this.container.get<T>(ctor);
  }

  getServiceByToken<T>(token: InjectionToken<T>): T {
    return this.container.get<T>(token);
  }

  resolveServiceByClass<T>(ctor: IServiceConstructor<T>): T {
    return this.container.resolve(ctor);
  }

  addServiceByClass(Ctor: IServiceConstructor<any>, value?: any): void {
    if (value) {
      this.container.bind(Ctor).toConstantValue(value);
    } else {
      this.container.bind(Ctor).toSelf();
    }
  }

  addServiceByToken<T extends Record<string, any>>(
    token: InjectionToken<T>, value: T | IServiceConstructor<T>
  ): void {
    if (isConstructor(value)) {
      this.container.bind(token).to(value as IServiceConstructor<T>);
    } else {
      this.container.bind(token).toConstantValue(value);
    }
  }
}
