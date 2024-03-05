/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';

export interface IElementsTreeLoadData {
  nodeId: string;
  manual: boolean;
}

@injectable()
export class ElementsTreeService {
  readonly onLoad: IExecutor<IElementsTreeLoadData>;

  constructor() {
    this.onLoad = new Executor();
  }
}
