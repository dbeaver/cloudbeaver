/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import type { IAction } from '../../Action/IAction';
import type { IDataContextProvider } from '../../DataContext/IDataContextProvider';
import type { IKeyBindingHandler } from './IKeyBindingHandler';

@injectable()
export class KeyBindingService {
  private handlers: Map<string, IKeyBindingHandler>;

  constructor() {
    this.handlers = new Map();
  }

  addKeyBindingHandler(handler: IKeyBindingHandler): void {
    if (this.handlers.has(handler.id)) {
      throw new Error(`Key binding handler with same id (${handler.id}) already exists`);
    }
    this.handlers.set(handler.id, handler);
  }

  getKeyBindingHandler(context: IDataContextProvider, action: IAction): IKeyBindingHandler | null {
    for (const handler of this.handlers.values()) {
      if (handler.isBindingApplicable(context, action)) {
        return handler;
      }
    }

    return null;
  }
}
