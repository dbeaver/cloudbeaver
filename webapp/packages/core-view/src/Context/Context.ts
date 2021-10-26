/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ContextGetter } from './ContextGetter';
import type { IContext } from './IContext';

export class Context implements IContext {
  private map: Map<ContextGetter<any>, any>;

  constructor() {
    this.map = new Map();
  }

  has(context: ContextGetter<any>): boolean {
    return this.map.has(context);
  }

  set<T>(context: ContextGetter<T>, value: T): this {
    this.map.set(context, value);

    return this;
  }

  get<T>(context: ContextGetter<T>): T {
    if (!this.map.has(context)) {
      throw new Error('Context doesn\'t exists');
    }

    return this.map.get(context);
  }

  tryGet<T>(context: ContextGetter<T>): T | undefined {
    return this.map.get(context);
  }
}
