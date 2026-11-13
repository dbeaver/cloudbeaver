/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable, untracked } from 'mobx';

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { Context, Disposable, Effect, IServiceProvider, Layer, disposeService, type IServiceScope, type ServiceType } from '@cloudbeaver/core-di';
import { DatabaseMetadataAction } from './Actions/General/DatabaseMetadataAction.js';
import { IDatabaseDataMetadataAction } from './Actions/IDatabaseDataMetadataAction.js';
import type { DatabaseActionImplementation, IDatabaseDataAction } from './IDatabaseDataAction.js';
import type { IDatabaseDataActions } from './IDatabaseDataActions.js';
import { IDatabaseDataResult } from './IDatabaseDataResult.js';
import { IDatabaseDataSource } from './IDatabaseDataSource.js';

export class DatabaseDataActionsImpl<TOptions, TResult extends IDatabaseDataResult>
  extends Disposable
  implements IDatabaseDataActions<TOptions, TResult>
{
  readonly registeredActions: Map<ServiceType<unknown>, ServiceType<unknown>[]>;
  private resultScopes: Map<string, IServiceScope>;

  constructor(
    private readonly source: IDatabaseDataSource<TOptions, TResult>,
    private readonly serviceProvider: IServiceProvider,
  ) {
    super();
    this.registeredActions = new Map();
    this.resultScopes = new Map();

    makeObservable<this, 'resultScopes'>(this, {
      updateResults: action,
      resultScopes: observable.shallow,
    });
  }

  registerAction<T>(service: ServiceType<any>, implementation: ServiceType<T>): this {
    let implementations = this.registeredActions.get(service);

    if (!implementations) {
      implementations = [];
      this.registeredActions.set(service, implementations);
    }

    if (!implementations.includes(implementation)) {
      implementations.push(implementation);
    }

    return this;
  }
  unregisterAction<T>(service: ServiceType<any>, implementation: ServiceType<T>): this {
    const implementations = this.registeredActions.get(service);

    if (implementations) {
      const index = implementations.indexOf(implementation);

      if (index !== -1) {
        implementations.splice(index, 1);
      }
    }

    return this;
  }

  getConstructor<T extends IDatabaseDataAction<TOptions, TResult>>(service: ServiceType<T>): ServiceType<T> {
    const possibleImplementations = this.registeredActions
      .get(service)
      ?.filter(action => isActionSupportsFormat(action as any, this.source.dataFormat));

    const impl = possibleImplementations?.[possibleImplementations.length - 1];

    if (!impl) {
      throw new Error(`Action ${service.name} not found for format ${this.source.dataFormat}`);
    }

    return impl as ServiceType<T>;
  }

  tryGet<T>(result: TResult, Action: ServiceType<T>): T | undefined;
  tryGet<T>(result: TResult, Action: ServiceType<unknown>, implementation: DatabaseActionImplementation<T>): T | undefined;
  tryGet<T>(result: TResult, Action: ServiceType<T>, implementation?: DatabaseActionImplementation<unknown>): T | undefined {
    try {
      return this.get(result, Action, implementation!) as T;
    } catch {
      return undefined;
    }
  }

  get<T>(result: TResult, Action: ServiceType<T>): T;
  get<T>(result: TResult, Action: ServiceType<unknown>, implementation: DatabaseActionImplementation<T>): T;
  get<T>(result: TResult, Action: ServiceType<T>, implementation?: DatabaseActionImplementation<unknown>): T {
    const scope = this.resultScopes.get(result.uniqueResultId);

    if (!scope) {
      throw new Error(`Result ${result.uniqueResultId} not found in the source`);
    }

    const value = untracked(() => scope.serviceProvider.acquireService(Action, Context.make(IDatabaseDataResult, result)));

    if (implementation) {
      const constructor =
        typeof implementation === 'function' && !('implementation' in implementation)
          ? implementation
          : (implementation as { implementation?: abstract new (...args: any[]) => unknown }).implementation;

      if (!constructor || !(value instanceof constructor)) {
        throw new Error(`Action ${Action.name} not found for format ${this.source.dataFormat}`);
      }
    }

    return value;
  }

  updateResults(results: TResult[]): this {
    const scopes = Array.from(this.resultScopes.entries()).filter(([key]) => !results.find(result => result.uniqueResultId === key));

    for (const [key, scope] of scopes) {
      scope[Symbol.dispose]?.();
      this.resultScopes.delete(key);
    }

    for (const result of results) {
      if (!this.resultScopes.has(result.uniqueResultId)) {
        this.resultScopes.set(result.uniqueResultId, this.serviceProvider.createScope({ aliases: () => this.getAliases() }));
      }
    }

    return this;
  }

  protected override async dispose(): Promise<void> {
    await Promise.all([...this.resultScopes.values()].map(scope => scope[Symbol.asyncDispose]()));
    this.resultScopes.clear();
  }

  private getAliases(): ReadonlyMap<string, ServiceType> {
    const aliases = new Map<string, ServiceType>([[IDatabaseDataMetadataAction.key, DatabaseMetadataAction]]);

    for (const [key, implementations] of this.registeredActions) {
      const implementation = implementations.filter(action => isActionSupportsFormat(action, this.source.dataFormat)).at(-1);

      if (implementation) {
        aliases.set(key.key, implementation);
      }
    }

    return aliases;
  }
}

export type DatabaseDataActions<TOptions, TResult extends IDatabaseDataResult> = DatabaseDataActionsImpl<TOptions, TResult>;

export class DatabaseDataActionsDI extends Context.Service<DatabaseDataActionsDI, DatabaseDataActionsImpl<any, any>>()(
  '@cloudbeaver/plugin-data-viewer/DatabaseDataModel/DatabaseDataActions#DatabaseDataActions',
) {
  static readonly implementation = DatabaseDataActionsImpl;

  static readonly dependencies = () => [IDatabaseDataSource, IServiceProvider] as const;
  static readonly make: Effect.Effect<
    DatabaseDataActionsImpl<any, any>,
    never,
    Context.Service.Identifier<typeof IDatabaseDataSource> | Context.Service.Identifier<typeof IServiceProvider>
  > = Effect.gen(function* makeDatabaseDataActions() {
    const source = yield* IDatabaseDataSource;
    const serviceProvider = yield* IServiceProvider;

    return new DatabaseDataActionsImpl(source, serviceProvider);
  });
  static readonly layer: Layer.Layer<
    DatabaseDataActionsDI,
    never,
    Context.Service.Identifier<typeof IDatabaseDataSource> | Context.Service.Identifier<typeof IServiceProvider>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DatabaseDataActions = DatabaseDataActionsDI;

function isActionSupportsFormat(action: ServiceType, format: ResultDataFormat): boolean {
  const dataFormat = (action as { dataFormat?: ResultDataFormat[] | null }).dataFormat;
  return !dataFormat || dataFormat.includes(format);
}
