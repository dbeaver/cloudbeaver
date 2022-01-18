/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable as inversifyInjectable, inject as inversifyInject } from 'inversify';

import type { ValueToken } from './InjectionToken';

export function injectable(): (target: any) => any {
  return inversifyInjectable();
}

export function inject<T>(token: ValueToken<T>): (target: T, targetKey: string, index?: number | undefined) => void {
  return inversifyInject(token);
}
