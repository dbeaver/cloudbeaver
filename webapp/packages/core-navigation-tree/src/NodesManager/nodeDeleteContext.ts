/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { ResourceKey } from '@cloudbeaver/core-sdk';

export interface INodeDeleteContext {
  confirmed: boolean;
  confirm(): void;
}

export function nodeDeleteContext(contexts: IExecutionContextProvider<ResourceKey<string>>, data: ResourceKey<string>): INodeDeleteContext {
  return {
    confirmed: false,
    confirm() {
      this.confirmed = true;
    },
  };
}
