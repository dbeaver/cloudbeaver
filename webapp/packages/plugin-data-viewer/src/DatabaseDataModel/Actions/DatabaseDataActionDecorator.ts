/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataActionInterface } from '../IDatabaseDataAction';

const ACTION_PARAMS = 'custom:data-viewer/action/params';

export function databaseDataAction<T extends IDatabaseDataActionInterface<any, any, any>>() {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  return <U extends T>(target: U): U => {
    if (Reflect.hasOwnMetadata(ACTION_PARAMS, target)) {
      throw new Error('Duplicate databaseDataAction() decorator');
    }

    const types = Reflect.getMetadata('design:paramtypes', target) || [];
    Reflect.defineMetadata(ACTION_PARAMS, types, target);

    return target;
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function getDependingDataActions(action: IDatabaseDataActionInterface<any, any, any>): Function[] {
  return Reflect.getMetadata(ACTION_PARAMS, action) || [];
}
