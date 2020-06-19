/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Container } from 'inversify';

import { IServiceCollection, IServiceConstructor, IServiceInjector } from './IApp';
import { InjectionToken } from './InjectionToken';
import { isConstructor } from './isConstructor';

export class DIContainer implements IServiceInjector, IServiceCollection {
  protected container = new Container({
    defaultScope: 'Singleton',
  });

  private parent: DIContainer | null = null

  constructor(parent?: DIContainer) {
    if (parent) {
      this.bindWithParent(parent);
    }
  }

  bindWithParent(parent: DIContainer) {
    this.container.parent = parent.container;
    this.parent = parent;
  }

  unbindParent() {
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

  addServiceByClass(Ctor: IServiceConstructor<any>): void {
    this.container.bind(Ctor).toSelf();
  }

  addServiceByToken<T extends object>(token: InjectionToken<T>, value: T | IServiceConstructor<T>): void {
    if (isConstructor(value)) {
      this.container.bind(token).to(value as IServiceConstructor<T>);
    } else {
      this.container.bind(token).toConstantValue(value);
    }
  }
}
