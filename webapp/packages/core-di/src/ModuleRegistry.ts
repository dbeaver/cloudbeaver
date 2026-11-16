/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Effect } from 'effect';

import type { ServiceType } from './Service.js';

export interface IServiceLifecycle {
  register?(): void | Promise<void> | Effect.Effect<void, unknown>;
  load?(): void | Promise<void> | Effect.Effect<void, unknown>;
}

export interface IModule {
  readonly name: string;
  readonly services?: () => readonly ServiceType[];
  readonly scoped?: () => readonly ServiceType[];
  readonly bootstraps?: () => readonly ServiceType<IServiceLifecycle>[];
  readonly preloads?: () => readonly ServiceType<IServiceLifecycle>[];
}

class Modules implements Iterable<IModule> {
  private readonly modules = new Map<string, IModule>();

  add(module: IModule): IModule {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} is already registered`);
    }

    this.modules.set(module.name, module);

    return module;
  }

  get(name: string): IModule | undefined {
    return this.modules.get(name);
  }

  has(name: string): boolean {
    return this.modules.has(name);
  }

  [Symbol.iterator](): IterableIterator<IModule> {
    return this.modules.values();
  }
}

export const ModuleRegistry = new Modules();
