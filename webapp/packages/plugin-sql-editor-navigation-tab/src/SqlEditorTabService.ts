/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import {
  ConnectionExecutionContextResource,
  ConnectionExecutionContextService,
  ConnectionInfoActiveProjectKey,
  ConnectionInfoResource,
  connectionProvider,
  connectionSetter,
  ConnectionsManagerService,
  ContainerResource,
  createConnectionParam,
  executionContextProvider,
  type ICatalogData,
  type IConnectionExecutorData,
  type IConnectionInfoParams,
  objectCatalogProvider,
  objectCatalogSetter,
  objectLoaderProvider,
  objectSchemaProvider,
  objectSchemaSetter,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { NavNodeInfoResource, NodeManagerUtils, objectNavNodeProvider } from '@cloudbeaver/core-navigation-tree';
import { projectProvider, projectSetter, projectSetterState } from '@cloudbeaver/core-projects';
import { getCachedMapResourceLoaderState, resourceKeyList, type ResourceKeySimple, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import type { NavNodeInfoFragment } from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';
import { type ITab, type ITabOptions, NavigationTabsService, TabHandler } from '@cloudbeaver/plugin-navigation-tabs';
import {
  ESqlDataSourceFeatures,
  type ISQLDatasourceUpdateData,
  type ISqlEditorTabState,
  SQL_EDITOR_TAB_STATE_SCHEMA,
  SqlDataSourceService,
  SqlEditorService,
  SqlResultTabsService,
} from '@cloudbeaver/plugin-sql-editor';

import { isSQLEditorTab } from './isSQLEditorTab.js';
import { sqlEditorTabHandlerKey } from './sqlEditorTabHandlerKey.js';

const SqlEditorPanel = importLazyComponent(() => import('./SqlEditorPanel.js').then(m => m.SqlEditorPanel));
const SqlEditorTab = importLazyComponent(() => import('./SqlEditorTab.js').then(m => m.SqlEditorTab));

@injectable()
export class SqlEditorTabService extends Bootstrap {
  get sqlEditorTabs(): ITab<ISqlEditorTabState>[] {
    return Array.from(this.navigationTabsService.findTabs<ISqlEditorTabState>(isSQLEditorTab));
  }

  readonly tabHandler: TabHandler<ISqlEditorTabState>;
  readonly onCanClose: Executor<ITab<ISqlEditorTabState>>;

  constructor(
    private readonly navigationTabsService: NavigationTabsService,
    private readonly notificationService: NotificationService,
    private readonly sqlEditorService: SqlEditorService,
    private readonly sqlResultTabsService: SqlResultTabsService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly containerResource: ContainerResource,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();

    this.onCanClose = new Executor();

    this.tabHandler = this.navigationTabsService.registerTabHandler<ISqlEditorTabState>({
      key: sqlEditorTabHandlerKey,
      getTabComponent: () => SqlEditorTab,
      getPanelComponent: () => SqlEditorPanel,
      onRestore: this.handleTabRestore.bind(this),
      onUnload: this.handleTabUnload.bind(this),
      onClose: this.handleTabClose.bind(this),
      onCloseSilent: this.handleTabCloseSilent.bind(this),
      canClose: this.handleCanTabClose.bind(this),
      extensions: [
        objectNavNodeProvider(this.getNavNode.bind(this)),
        projectSetterState(this.getProjectSetState.bind(this)),
        projectProvider(this.getProjectId.bind(this)),
        connectionProvider(this.getConnectionId.bind(this)),
        objectCatalogProvider(this.getObjectCatalogId.bind(this)),
        objectLoaderProvider(this.getObjectLoader.bind(this)),
        objectSchemaProvider(this.getObjectSchemaId.bind(this)),
        executionContextProvider(this.getExecutionContext.bind(this)),
        projectSetter(this.setProjectId.bind(this)),
        connectionSetter((connectionId, tab) => this.setConnectionId(tab, connectionId)),
        objectCatalogSetter(this.setObjectCatalogId.bind(this)),
        objectSchemaSetter(this.setObjectSchemaId.bind(this)),
      ],
    });

    makeObservable(this, {
      sqlEditorTabs: computed<ITab<ISqlEditorTabState>[]>({
        equals: (a, b) => isArraysEqual(a, b),
      }),
    });
  }

  override register(): void {
    this.sqlDataSourceService.onUpdate.addHandler(this.syncDatasourceUpdate.bind(this));
    this.connectionsManagerService.onDisconnect.addHandler(this.disconnectHandler.bind(this));
    this.connectionInfoResource.onItemDelete.addHandler(this.handleConnectionDelete.bind(this));
    this.connectionExecutionContextResource.onItemUpdate.addHandler(this.handleExecutionContextUpdate.bind(this));
    this.connectionExecutionContextResource.onItemDelete.addHandler(this.handleExecutionContextDelete.bind(this));
  }

  createNewEditor(editorId: string, dataSourceKey: string, name?: string, source?: string, script?: string): ITabOptions<ISqlEditorTabState> | null {
    const order = this.getFreeEditorId();

    const handlerState = this.sqlEditorService.getState(editorId, dataSourceKey, order, source);

    const datasource = this.sqlDataSourceService.create(handlerState, dataSourceKey, { name, script });

    return {
      id: editorId,
      projectId: datasource.executionContext?.projectId ?? null,
      handlerId: sqlEditorTabHandlerKey,
      handlerState,
    };
  }

  attachToProject(tab: ITab<ISqlEditorTabState>, projectId: string | null): void {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    projectId = dataSource?.projectId ?? projectId;
    tab.projectId = projectId;
  }

  resetConnectionInfo(tab: ITab<ISqlEditorTabState>): void {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    dataSource?.setExecutionContext(undefined);
    this.attachToProject(tab, null);
  }

  getConnectionId(tab: ITab<ISqlEditorTabState>): IConnectionInfoParams | undefined {
    const context = this.sqlDataSourceService.get(tab.handlerState.editorId)?.executionContext;

    if (!context) {
      return undefined;
    }

    return createConnectionParam(context.projectId, context.connectionId);
  }

  private async handleConnectionDelete(key: ResourceKeySimple<IConnectionInfoParams>) {
    const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
      isSQLEditorTab(tab => {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

        return !!dataSource?.executionContext;
      }),
    );

    for (const tab of tabs) {
      const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
      const executionContext = dataSource?.executionContext;

      if (executionContext) {
        const contextConnection = createConnectionParam(executionContext.projectId, executionContext.connectionId);

        if (this.connectionInfoResource.isIntersect(key, contextConnection)) {
          this.resetConnectionInfo(tab);
        }
      }
    }
  }

  private getNavNode(tab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
    const executionContext = dataSource?.executionContext;

    if (!executionContext) {
      return;
    }

    const { projectId, connectionId, defaultCatalog, defaultSchema } = executionContext;
    const connectionKey = createConnectionParam(projectId, connectionId);

    if (!this.connectionInfoResource.isConnected(connectionKey)) {
      return;
    }

    let catalogData: ICatalogData | undefined;
    let schema: NavNodeInfoFragment | undefined;

    if (defaultCatalog) {
      catalogData = this.containerResource.getCatalogData(connectionKey, defaultCatalog);

      if (catalogData && defaultSchema) {
        schema = catalogData.schemaList.find(schema => schema.name === defaultSchema);
      }
    } else if (defaultSchema) {
      schema = this.containerResource.getSchema(connectionKey, defaultSchema);
    }

    let nodeId = schema?.id ?? catalogData?.catalog.id;

    if (!nodeId) {
      nodeId = NodeManagerUtils.connectionIdToConnectionNodeId(connectionId);
    }

    const parents = this.navNodeInfoResource.getParents(nodeId);

    return {
      nodeId,
      path: parents,
    };
  }

  private async handleExecutionContextUpdate(key: ResourceKeySimple<string>) {
    const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
      isSQLEditorTab(tab => {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

        return !!dataSource?.executionContext && ResourceKeyUtils.isIntersect(key, dataSource.executionContext.id);
      }),
    );

    for (const tab of tabs) {
      const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId)!;
      const executionContext = this.connectionExecutionContextService.get(dataSource.executionContext!.id)?.context;

      if (!executionContext) {
        const executionContext = dataSource.executionContext;
        if (executionContext) {
          const contextConnection = createConnectionParam(executionContext.projectId, executionContext.connectionId);

          if (!this.connectionInfoResource.has(contextConnection)) {
            this.resetConnectionInfo(tab);
          }
        }
      } else {
        dataSource.setExecutionContext({ ...executionContext });
        this.attachToProject(tab, executionContext.projectId);
      }
    }
  }

  private async handleExecutionContextDelete(key: ResourceKeySimple<string>) {
    const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
      isSQLEditorTab(tab => {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

        return !!dataSource?.executionContext;
      }),
    );

    for (const tab of tabs) {
      const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId)!;
      const executionContext = dataSource.executionContext;

      if (executionContext) {
        const contextConnection = createConnectionParam(executionContext.projectId, executionContext.connectionId);

        if (ResourceKeyUtils.isIntersect(key, executionContext.id) && !this.connectionInfoResource.has(contextConnection)) {
          this.resetConnectionInfo(tab);
        }
      }
    }
  }

  private getFreeEditorId() {
    const ordered = this.sqlEditorTabs.map(tab => tab.handlerState.order);
    return findMinimalFree(ordered, 1);
  }

  private async handleTabRestore(tab: ITab<ISqlEditorTabState>): Promise<boolean> {
    if (!SQL_EDITOR_TAB_STATE_SCHEMA.safeParse(tab.handlerState).success) {
      await this.sqlDataSourceService.destroy(tab.handlerState.editorId);
      return false;
    }

    const dataSource = this.sqlDataSourceService.create(tab.handlerState, tab.handlerState.datasourceKey);
    const executionContext = dataSource.executionContext;

    if (executionContext) {
      await this.connectionInfoResource.load(ConnectionInfoActiveProjectKey);

      const contextConnection = createConnectionParam(executionContext.projectId, executionContext.connectionId);

      if (!this.connectionInfoResource.has(contextConnection)) {
        this.resetConnectionInfo(tab);
      }
    }

    // clean old results
    tab.handlerState.currentTabId = '';
    tab.handlerState.tabs = observable([]);
    tab.handlerState.resultGroups = observable([]);
    tab.handlerState.resultTabs = observable([]);
    tab.handlerState.executionPlanTabs = observable([]);
    tab.handlerState.statisticsTabs = observable([]);
    tab.handlerState.outputLogsTab = undefined;

    return true;
  }

  private getProjectId(tab: ITab<ISqlEditorTabState>): string | undefined {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    return dataSource?.projectId ?? undefined;
  }

  private getProjectSetState(tab: ITab<ISqlEditorTabState>): boolean {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    return !!dataSource?.hasFeature(ESqlDataSourceFeatures.setProject);
  }

  private getObjectLoader(tab: ITab<ISqlEditorTabState>) {
    const executionContextComputed = computed(() => this.sqlDataSourceService.get(tab.handlerState.editorId)?.executionContext);

    const connectionKeyComputed = computed(() => {
      const executionContext = executionContextComputed.get();

      if (!executionContext) {
        return null;
      }

      return createConnectionParam(executionContext.projectId, executionContext.connectionId);
    });

    return [
      getCachedMapResourceLoaderState(this.connectionInfoResource, () => connectionKeyComputed.get()),
      getCachedMapResourceLoaderState(this.connectionExecutionContextResource, () => executionContextComputed.get()?.id || null),
      getCachedMapResourceLoaderState(this.containerResource, () => connectionKeyComputed.get()),
      // TODO: maybe we need it for this.getNavNode to work properly, but it's seems working without it
      // getCachedMapResourceLoaderState(this.navNodeInfoResource, () => {
      //   if (this.containerResource.isLoadable(connectionKey)) {
      //     return null;
      //   }
      //   console.log('node:', this.getNavNode(tab)?.nodeId || null);
      //   return this.getNavNode(tab)?.nodeId || null;
      // }),
    ];
  }

  private getObjectCatalogId(tab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
    const context = this.connectionExecutionContextResource.get(dataSource?.executionContext?.id ?? '');
    return context?.defaultCatalog;
  }

  private getObjectSchemaId(tab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
    const context = this.connectionExecutionContextResource.get(dataSource?.executionContext?.id ?? '');
    return context?.defaultSchema;
  }

  private getExecutionContext(tab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
    return dataSource?.executionContext;
  }

  private setProjectId(projectId: string | null, tab: ITab<ISqlEditorTabState>): boolean {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    dataSource?.setProject(projectId);
    this.attachToProject(tab, projectId);

    return true;
  }

  async setConnectionId(tab: ITab<ISqlEditorTabState>, connectionKey: IConnectionInfoParams, catalogId?: string, schemaId?: string) {
    const state = await this.sqlEditorService.setConnection(tab.handlerState, connectionKey, catalogId, schemaId);

    if (state) {
      this.attachToProject(tab, connectionKey.projectId);
    }

    return state;
  }

  private async setObjectCatalogId(containerId: string, tab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    if (!dataSource?.executionContext) {
      return false;
    }

    const executionContext = this.connectionExecutionContextService.get(dataSource.executionContext.id);

    if (!executionContext) {
      return false;
    }

    try {
      const context = await executionContext.update(containerId, dataSource.executionContext.defaultSchema);

      dataSource.setExecutionContext({ ...context });
      return true;
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor catalog');
      return false;
    }
  }

  private async setObjectSchemaId(containerId: string, tab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    if (!dataSource?.executionContext) {
      return false;
    }

    const executionContext = this.connectionExecutionContextService.get(dataSource.executionContext.id);

    if (!executionContext) {
      return false;
    }

    try {
      const context = await executionContext.update(dataSource.executionContext.defaultCatalog, containerId);

      dataSource.setExecutionContext({ ...context });
      return true;
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor schema');
      return false;
    }
  }

  private async syncDatasourceUpdate(data: ISQLDatasourceUpdateData) {
    const tab = this.sqlEditorTabs.find(tab => tab.handlerState.editorId === data.editorId);

    if (tab) {
      this.attachToProject(tab, data.datasource.projectId);
    }
  }

  private async disconnectHandler(data: IConnectionExecutorData, contexts: IExecutionContextProvider<IConnectionExecutorData>) {
    const connectionsKey = resourceKeyList(data.connections);
    if (data.state === 'before') {
      for (const tab of this.sqlEditorTabs) {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
        const executionContext = dataSource?.executionContext;

        if (!executionContext) {
          continue;
        }

        const connectionKey = createConnectionParam(executionContext.projectId, executionContext.connectionId);

        if (!this.connectionInfoResource.isIntersect(connectionsKey, connectionKey)) {
          continue;
        }

        const canDisconnect = await this.handleCanTabClose(tab);

        if (!canDisconnect) {
          ExecutorInterrupter.interrupt(contexts);
          return;
        }
      }
    }
  }

  private async handleCanTabClose(editorTab: ITab<ISqlEditorTabState>) {
    const canCloseTabs = await this.sqlResultTabsService.canCloseResultTabs(editorTab.handlerState);

    if (!canCloseTabs) {
      return false;
    }

    const contexts = await this.onCanClose.execute(editorTab);
    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return false;
    }

    const dataSource = this.sqlDataSourceService.get(editorTab.handlerState.editorId);

    if (dataSource?.isSaved === false && !dataSource?.isReadonly()) {
      const result = await this.commonDialogService.open(ConfirmationDialog, {
        title: 'plugin_sql_editor_navigation_tab_data_source_save_confirmation_title',
        subTitle: dataSource.name ?? undefined,
        message: 'plugin_sql_editor_navigation_tab_data_source_save_confirmation_message',
        confirmActionText: 'ui_yes',
        extraStatus: 'no',
      });

      if (result === DialogueStateResult.Rejected) {
        return false;
      } else if (result === DialogueStateResult.Resolved) {
        await dataSource.save();
      } else {
        await dataSource.reset();
      }
    }

    const canDestroyDatasource = await this.sqlDataSourceService.canDestroy(editorTab.handlerState.editorId);

    return canDestroyDatasource;
  }

  private async handleTabUnload(editorTab: ITab<ISqlEditorTabState>) {
    await this.sqlDataSourceService.unload(editorTab.handlerState.editorId);

    this.sqlResultTabsService.removeResultTabs(editorTab.handlerState);
  }

  private async handleTabCloseSilent(editorTab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(editorTab.handlerState.editorId);

    if (dataSource?.executionContext) {
      await this.sqlEditorService.destroyContext(dataSource.executionContext);
    }

    await this.sqlDataSourceService.destroySilent(editorTab.handlerState.editorId);
    this.sqlResultTabsService.removeResultTabs(editorTab.handlerState);
  }

  private async handleTabClose(editorTab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(editorTab.handlerState.editorId);

    if (dataSource?.executionContext) {
      await this.sqlEditorService.destroyContext(dataSource.executionContext);
    }
    await this.sqlDataSourceService.destroy(editorTab.handlerState.editorId);
  }
}

function findMinimalFree(array: number[], base: number): number {
  return array.sort((a, b) => b - a).reduceRight((prev, cur) => (prev === cur ? prev + 1 : prev), base);
}
