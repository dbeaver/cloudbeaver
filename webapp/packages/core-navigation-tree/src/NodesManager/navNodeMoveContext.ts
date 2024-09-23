/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';

import type { INodeMoveData } from './NavNodeManagerService.js';

interface INavNodeMoveContext {
  canMove: boolean;
  setCanMove(value: boolean): void;
}

export function navNodeMoveContext(contexts: IExecutionContextProvider<INodeMoveData>, data: INodeMoveData): INavNodeMoveContext {
  return {
    canMove: false,
    setCanMove(value) {
      this.canMove = value;
    },
  };
}
