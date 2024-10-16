/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor, type ISyncContextLoader } from '@cloudbeaver/core-executor';

import { type ISessionAction, SessionResource } from './SessionResource.js';

interface ISessionActionContext {
  processed: boolean;
  process(): void;
}

@injectable()
export class SessionActionService {
  private actionToProcess: ISessionAction | null;
  readonly onAction: IExecutor<ISessionAction | null>;

  constructor(readonly session: SessionResource) {
    this.actionToProcess = session.processAction();
    this.onAction = new Executor<ISessionAction | null>(undefined, (a, b) => a === b);
    this.onAction
      .setInitialDataGetter(() => this.actionToProcess)
      .addPostHandler((data, contexts) => {
        const processInfo = contexts.getContext(sessionActionContext);

        if (processInfo.processed) {
          this.actionToProcess = null;
        }
      });

    this.session.onDataUpdate.addHandler(() => {
      const action = this.session.processAction();

      if (action) {
        this.actionToProcess = action;
      }

      this.onAction.execute(action);
    });
  }
}

export const sessionActionContext: ISyncContextLoader<ISessionActionContext, ISessionAction | null> = function sessionActionContext(contexts, data) {
  return {
    processed: false,
    process() {
      this.processed = true;
    },
  };
};
