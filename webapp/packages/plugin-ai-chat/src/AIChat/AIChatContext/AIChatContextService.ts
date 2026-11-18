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

@injectable(() => [ConnectionSchemaManagerService, UserInfoResource, ProjectsService, UserDataService])
export class AIChatContextService extends Bootstrap {
  onContextChange: SyncExecutor<IAIChatContextInfo | null>;

  get currentContext(): IAIChatContextInfo | null {
    return this.settings.context;
  }

  private get settings(): { context: IAIChatContextInfo | null } {
    return this.userDataService.getUserData('ai-chat-context', () => ({ context: null }));
  }

  private reactionDisposer: IReactionDisposer | null;

  constructor(
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    userInfoResource: UserInfoResource,
    projectsService: ProjectsService,
    private readonly userDataService: UserDataService,
  ) {
    super();

    this.onContextChange = new SyncExecutor<IAIChatContextInfo | null>();
    this.reactionDisposer = null;

    userInfoResource.onUserChange.addHandler(() => {
      this.onContextChange.execute(this.currentContext);
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
    this.settings.context = context;
    this.onContextChange.execute(this.currentContext);
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

          if (!this.currentContext || !this.isContextsEqual(this.currentContext, newContext)) {
            this.setContext(newContext);
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
