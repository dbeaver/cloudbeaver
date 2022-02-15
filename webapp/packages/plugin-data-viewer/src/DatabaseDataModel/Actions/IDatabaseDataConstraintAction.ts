/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataAction } from '../IDatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';
import type { Order } from '../Order';

export interface IDatabaseDataConstraintAction<TResult extends IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  readonly filterConstraints: SqlDataFilterConstraint[];
  readonly orderConstraints: SqlDataFilterConstraint[];
  readonly supported: boolean;
  setFilter: (attributePosition: number, operator: string, value?: any) => void;
  setOrder: (attributePosition: number, order: Order, multiple: boolean) => void;
  deleteAll: () => void;
  deleteFilter: (attributePosition: number) => void;
  deleteFilters: () => void;
  deleteOrder: (attributePosition: number) => void;
  deleteOrders: () => void;
  deleteDataFilters: () => void;
  deleteData: () => void;
  get: (attributePosition: number) => SqlDataFilterConstraint | undefined;
  getOrder: (attributePosition: number) => Order;
}
