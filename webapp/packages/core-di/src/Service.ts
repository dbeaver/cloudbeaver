/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Layer } from 'effect';

export { Context, Effect, Layer, ManagedRuntime, Scope } from 'effect';

export type ServiceType<T = unknown> = Context.Key<any, T> & {
  readonly name?: string;
  readonly layer?: Layer.Layer<never, unknown, unknown>;
  readonly dependencies?: () => readonly ServiceType[];
};

export async function disposeService(value: unknown): Promise<void> {
  if (typeof value !== 'object' || value === null) {
    return;
  }

  if (Symbol.asyncDispose in value && typeof value[Symbol.asyncDispose] === 'function') {
    await (value as AsyncDisposable)[Symbol.asyncDispose]();
  } else if (Symbol.dispose in value && typeof value[Symbol.dispose] === 'function') {
    (value as Disposable)[Symbol.dispose]();
  } else if ('dispose' in value && typeof value.dispose === 'function') {
    await value.dispose();
  }
}
