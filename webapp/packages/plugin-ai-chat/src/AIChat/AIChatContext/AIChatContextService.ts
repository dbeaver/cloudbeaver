/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { comparer, computed, makeObservable, reaction, type IReactionDisposer } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';
import {
  ConnectionInfoActiveProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
  type IConnectionExecutionContextInfo,
  type IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import { UserConfigurationStorage, UserDataService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import { SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';
import { isSQLEditorTab } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

export interface IAIChatContextInfo {
  connectionKey: IConnectionInfoParams;
  catalog?: string;
  schema?: string;
}

interface ISettings {
  context?: IAIChatContextInfo | null;
}

@injectable(() => [
  ConnectionSchemaManagerService,
  UserInfoResource,
  ProjectsService,
  UserDataService,
  UserConfigurationStorage,
  ConnectionInfoResource,
  NavigationTabsService,
  SqlDataSourceService,
])
export class AIChatContextService extends Bootstrap {
  onContextChange: SyncExecutor<IAIChatContextInfo | null>;

  get currentContext(): IAIChatContextInfo | null {
    if (!this.isContextReady) {
      return null;
    }

    const context = this.settings.context;

    if (
      context &&
      this.projectsService.activeProjects.some(project => project.id === context.connectionKey.projectId) &&
      this.connectionInfoResource.has(context.connectionKey)
    ) {
      return context;
    }

    return null;
  }

  get isContextReady(): boolean {
    return (
      this.userInfoResource.hasAccess() &&
      (!this.userConfigurationStorage.isAvailable() || this.userConfigurationStorage.isLoaded()) &&
      this.connectionInfoResource.isLoaded(ConnectionInfoActiveProjectKey)
    );
  }

  private get settings(): ISettings {
    return this.userDataService.withStorage(this.userConfigurationStorage).getUserData<ISettings>('ai-chat-context', () => ({}));
  }

  private reactionDisposer: IReactionDisposer | null;
  private editorDisposer: IReactionDisposer | null;

  constructor(
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly userInfoResource: UserInfoResource,
    private readonly projectsService: ProjectsService,
    private readonly userDataService: UserDataService,
    private readonly userConfigurationStorage: UserConfigurationStorage,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly sqlDataSourceService: SqlDataSourceService,
  ) {
    super();

    this.onContextChange = new SyncExecutor<IAIChatContextInfo | null>();
    this.reactionDisposer = null;
    this.editorDisposer = null;

    makeObservable(this, {
      currentContext: computed,
      isContextReady: computed,
    });
  }

  setContext(context: IAIChatContextInfo | null): void {
    this.settings.context = context;
  }

  initialize(): void {
    if (this.isContextReady && !this.settings.context) {
      this.setContext(this.getContext());
    }
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
      () => [this.userInfoResource.getId(), this.currentContext] as const,
      ([, context]) => {
        this.onContextChange.execute(context);
      },
      { equals: comparer.shallow },
    );

    let previousKey: IConnectionInfoParams | null | undefined;

    this.editorDisposer = reaction(
      () => ({
        userId: this.userInfoResource.getId(),
        ready: this.isContextReady,
        context: this.getEditorContext(),
      }),
      ({ userId, ready, context }, previous) => {
        if (!ready || userId !== previous?.userId) {
          previousKey = undefined;
        }

        if (!ready || context === undefined) {
          return;
        }

        const connectionKey = context?.connectionKey ?? null;

        if (previousKey !== undefined && !comparer.structural(previousKey, connectionKey)) {
          this.setContext(context);
        }

        previousKey = connectionKey;
      },
      { equals: comparer.structural, fireImmediately: true },
    );
  }

  private getEditorContext(): IAIChatContextInfo | null | undefined {
    const tab = this.navigationTabsService.currentTab;

    // The datasource is removed before the closing editor stops being the active tab.
    if (tab && isSQLEditorTab(tab) && !this.sqlDataSourceService.get(tab.handlerState.editorId)) {
      return undefined;
    }

    // null means "No connection"; undefined means the active tab has no connection selector.
    return this.getContext() ?? (this.connectionSchemaManagerService.isConnectionChangeable ? null : undefined);
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

    if (this.editorDisposer) {
      this.editorDisposer();
    }
  }
}
