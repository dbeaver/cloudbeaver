/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { inject as inversifyInject, injectable as inversifyInjectable } from 'inversify';
import type { DecoratorTarget } from 'inversify/lib/annotation/decorator_utils';

import type { ValueToken } from './InjectionToken';

export function injectable(): (target: any) => any {
  return inversifyInjectable();
}

export function inject<T>(token: ValueToken<T>): (target: DecoratorTarget<T>, targetKey: string, index?: number) => void {
  return inversifyInject<T>(token);
}
