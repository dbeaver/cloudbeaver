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
import { ResourceKeyUtils } from '@cloudbeaver/core-resource';

import { getEditorContextSnapshot, matchesEditorSnapshot, type IAIChatEditorSnapshot } from './AIChatEditorContext.js';

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

  private get settings(): IAIChatEditorSnapshot & { context?: IAIChatContextInfo | null } {
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

    connectionInfoResource.onItemDelete.addHandler(key => {
      const context = this.settings.context;

      if (context && ResourceKeyUtils.some(key, key => isConnectionInfoParamEqual(key, context.connectionKey))) {
        this.setContext(null);
      }
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
    Object.assign(this.settings, getEditorContextSnapshot(this.connectionSchemaManagerService));
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
          const editorChanged = this.settings.editorContext !== undefined && !matchesEditorSnapshot(this.settings, newContext);
          Object.assign(this.settings, { editorContext: newContext, editorContextPending: false } satisfies IAIChatEditorSnapshot);

          // Restoring the same editor context must not replace the saved chat selection.
          if ((!this.isContextInitialized || editorChanged) && !matchesEditorSnapshot({ editorContext: this.currentContext }, newContext)) {
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

          return matchesEditorSnapshot({ editorContext: aContext }, bContext);
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

  override dispose(): void {
    if (this.reactionDisposer) {
      this.reactionDisposer();
    }
  }
}
