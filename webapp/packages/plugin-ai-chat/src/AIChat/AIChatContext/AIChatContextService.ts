/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { reaction, type IReactionDisposer } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';
import {
  ConnectionInfoActiveProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
  isConnectionInfoParamEqual,
  type IConnectionExecutionContextInfo,
  type IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import { UserDataService, UserInfoResource } from '@cloudbeaver/core-authentication';

export interface IAIChatContextInfo {
  connectionKey: IConnectionInfoParams;
  catalog?: string;
  schema?: string;
}

const SYNC_CONTEXT_DELAY = 500;

@injectable(() => [ConnectionSchemaManagerService, UserInfoResource, ProjectsService, UserDataService, ConnectionInfoResource])
export class AIChatContextService extends Bootstrap {
  onContextChange: SyncExecutor<IAIChatContextInfo | null>;

  get currentContext(): IAIChatContextInfo | null {
    const context = this.settings.context;

    return context && this.connectionInfoResource.has(context.connectionKey) ? context : null;
  }

  get isContextInitialized(): boolean {
    return this.settings.context !== undefined;
  }

  get isContextReady(): boolean {
    return !this.settings.context || this.currentContext !== null;
  }

  private get settings(): { context?: IAIChatContextInfo | null; editorContext?: IAIChatContextInfo | null } {
    return this.userDataService.getUserData('ai-chat-context', () => ({}));
  }

  private reactionDisposer: IReactionDisposer | null;

  constructor(
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    userInfoResource: UserInfoResource,
    projectsService: ProjectsService,
    private readonly userDataService: UserDataService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super();

    this.onContextChange = new SyncExecutor<IAIChatContextInfo | null>();
    this.reactionDisposer = null;

    userInfoResource.onUserChange.addHandler(() => {
      this.onContextChange.execute(this.currentContext);
    });

    connectionInfoResource.onDataUpdate.addHandler(() => {
      const context = this.settings.context;

      if (
        context &&
        connectionInfoResource.isLoaded(ConnectionInfoActiveProjectKey) &&
        !connectionInfoResource.isOutdated(ConnectionInfoActiveProjectKey) &&
        !connectionInfoResource.has(context.connectionKey)
      ) {
        this.setContext(null);
      }
    });

    projectsService.onActiveProjectChange.addHandler(data => {
      if (data.type === 'after' && data.projects.length > 0 && this.currentContext) {
        const hasProject = data.projects.includes(this.currentContext.connectionKey.projectId);

        if (!hasProject) {
          this.setContext(null);
        }
      }
    });
  }

  setContext(context: IAIChatContextInfo | null): void {
    const connectionKey = this.connectionSchemaManagerService.currentConnectionKey;

    // Include a pending editor selection so its asynchronous completion cannot undo this choice.
    this.settings.editorContext = connectionKey
      ? {
          connectionKey,
          catalog: this.connectionSchemaManagerService.currentObjectCatalogId,
          schema: this.connectionSchemaManagerService.currentObjectSchemaId,
        }
      : null;

    this.updateContext(context);
  }

  getContext(): IAIChatContextInfo | null {
    const context = this.connectionSchemaManagerService.activeExecutionContext;

    if (context) {
      return this.transformContext(context);
    }

    return null;
  }

  override register(): void | Promise<void> {
    this.reactionDisposer = reaction(
      () => this.connectionSchemaManagerService.activeExecutionContext,
      context => {
        if (context) {
          const newContext = this.transformContext(context);
          const previousEditorContext = this.settings.editorContext;
          this.settings.editorContext = newContext;

          // Restoring the same editor context must not replace the saved chat selection.
          if (
            !this.isContextInitialized ||
            (previousEditorContext !== undefined &&
              (!previousEditorContext ||
                !isConnectionInfoParamEqual(previousEditorContext.connectionKey, newContext.connectionKey) ||
                (previousEditorContext.catalog !== undefined && previousEditorContext.catalog !== newContext.catalog) ||
                (previousEditorContext.schema !== undefined && previousEditorContext.schema !== newContext.schema)) &&
              (!this.currentContext || !this.isContextsEqual(this.currentContext, newContext)))
          ) {
            this.updateContext(newContext);
          }
        }
      },
      {
        delay: SYNC_CONTEXT_DELAY,
        equals: (a, b) => {
          if (!a || !b) {
            return a === b;
          }

          const aContext = this.transformContext(a);
          const bContext = this.transformContext(b);

          return this.isContextsEqual(aContext, bContext);
        },
      },
    );
  }

  private updateContext(context: IAIChatContextInfo | null): void {
    this.settings.context = context;
    this.onContextChange.execute(this.currentContext);
  }

  private transformContext(executionContext: IConnectionExecutionContextInfo): IAIChatContextInfo {
    return {
      connectionKey: createConnectionParam(executionContext.projectId, executionContext.connectionId),
      catalog: executionContext.defaultCatalog,
      schema: executionContext.defaultSchema,
    };
  }

  private isContextsEqual(contextA: IAIChatContextInfo, contextB: IAIChatContextInfo): boolean {
    return (
      isConnectionInfoParamEqual(contextA.connectionKey, contextB.connectionKey) &&
      contextA.catalog === contextB.catalog &&
      contextA.schema === contextB.schema
    );
  }

  override dispose(): void {
    if (this.reactionDisposer) {
      this.reactionDisposer();
    }
  }
}
