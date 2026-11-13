/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { Executor, type IExecutor, type ISyncContextLoader } from '@cloudbeaver/core-executor';

import { type ISessionAction, SessionResource } from './SessionResource.js';

interface ISessionActionContext {
  processed: boolean;
  process(): void;
}

export class SessionActionServiceImpl {
  private actionToProcess: ISessionAction | null;
  readonly onAction: IExecutor<ISessionAction | null>;

  constructor(readonly sessionResource: SessionResource) {
    this.actionToProcess = sessionResource.processAction();
    this.onAction = new Executor<ISessionAction | null>(undefined, (a, b) => a === b);
    this.onAction
      .setInitialDataGetter(() => this.actionToProcess)
      .addPostHandler((data, contexts) => {
        const processInfo = contexts.getContext(sessionActionContext);

        if (processInfo.processed) {
          this.actionToProcess = null;
        }
      });

    this.sessionResource.onDataUpdate.addHandler(() => {
      const action = this.sessionResource.processAction();

      if (action) {
        this.actionToProcess = action;
      }

      this.onAction.execute(action);
    });
  }
}

export type SessionActionService = SessionActionServiceImpl;

export class SessionActionServiceDI extends Context.Service<SessionActionServiceDI, SessionActionServiceImpl>()(
  '@cloudbeaver/core-root/SessionActionService#SessionActionService',
) {
  static readonly implementation = SessionActionServiceImpl;

  static readonly dependencies = () => [SessionResource] as const;
  static readonly make: Effect.Effect<SessionActionServiceImpl, never, Context.Service.Identifier<typeof SessionResource>> = Effect.gen(
    function* makeSessionActionService() {
      const sessionResource = yield* SessionResource;

      return new SessionActionServiceImpl(sessionResource);
    },
  );
  static readonly layer: Layer.Layer<SessionActionServiceDI, never, Context.Service.Identifier<typeof SessionResource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionActionService = SessionActionServiceDI;

export const sessionActionContext: ISyncContextLoader<ISessionActionContext, ISessionAction | null> = function sessionActionContext(contexts, data) {
  return {
    processed: false,
    process() {
      this.processed = true;
    },
  };
};
