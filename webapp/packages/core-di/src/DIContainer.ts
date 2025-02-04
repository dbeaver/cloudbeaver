/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Container, type interfaces } from 'inversify';

import type { IServiceCollection, IServiceConstructor, IServiceInjector } from './IApp.js';

function logger(planAndResolve: interfaces.Next): interfaces.Next {
  return (args: interfaces.NextArgs) => {
    try {
      return planAndResolve(args);
    } catch (exception: any) {
      // @ts-ignore
      let metadata: Array<() => void> = Reflect.getMetadata('design:paramtypes', args.serviceIdentifier) || [];
      const matchIndex = /argument\s(\d+)/.exec((exception as Error).message);
      const matchDependency = /(serviceIdentifier:|class)\s([\w]+)/.exec((exception as Error).message);
      let index = parseInt(matchIndex?.[1] ?? '-1');
      const dep = metadata.find(service => service.name === matchDependency?.[2]);

      if (!dep) {
        throw exception;
      }

      let serviceName =
        typeof args.serviceIdentifier === 'function' && 'name' in args.serviceIdentifier
          ? args.serviceIdentifier.name
          : args.serviceIdentifier.toString();

      let notFoundElement = dep;

      if (index !== -1) {
        // @ts-ignore
        metadata = Reflect.getMetadata('design:paramtypes', dep) || [];
        serviceName = dep.name;
        notFoundElement = metadata[index]!;
      } else {
        index = metadata.indexOf(notFoundElement);
      }

      function getName(element: any | (() => void)) {
        return typeof element === 'function' && 'name' in element ? element.name : String(element);
      }

      const notFoundServiceName = getName(notFoundElement);

      const dependenciesList = metadata.map((value, i) => `${i} - ${getName(value)}`);

      throw new Error(
        `Can't find dependency ${notFoundServiceName}(${index}) \n\rin ${serviceName}(\n\r  ${dependenciesList.join(', \n\r  ')}\n\r)\r\n${
          exception.message
        }`,
        { cause: exception },
      );
    }
  };
}

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
    this.container.applyMiddleware(logger);
  }

  bindWithParent(parent: DIContainer): void {
    this.container.parent = parent.container;
    this.parent = parent;
  }

  unbindAll() {
    this.container.unbindAll();
  }

  unbindParent(): void {
    this.container.parent = null;
    this.parent = null;
  }

  getParent(): DIContainer | null {
    return this.parent;
  }

  hasServiceByClass<T>(ctor: IServiceConstructor<T>): boolean {
    return this.container.isBound(ctor);
  }

  getServiceByClass<T>(ctor: IServiceConstructor<T>): T {
    return this.container.get<T>(ctor);
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
}
