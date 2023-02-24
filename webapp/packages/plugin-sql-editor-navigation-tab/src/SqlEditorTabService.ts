/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable, untracked } from 'mobx';

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
  ICatalogData,
  IConnectionExecutorData,
  IConnectionInfoParams,
  objectCatalogProvider,
  objectCatalogSetter,
  objectSchemaProvider,
  objectSchemaSetter,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { objectNavNodeProvider, NodeManagerUtils, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { projectProvider, projectSetter, projectSetterState } from '@cloudbeaver/core-projects';
import { NavNodeInfoFragment, ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { NavigationTabsService, TabHandler, ITab, ITabOptions } from '@cloudbeaver/plugin-navigation-tabs';
import { SqlResultTabsService, ISqlEditorTabState, SqlEditorService, SqlDataSourceService, ESqlDataSourceFeatures } from '@cloudbeaver/plugin-sql-editor';

import { isSQLEditorTab } from './isSQLEditorTab';
import { SqlEditorPanel } from './SqlEditorPanel';
import { SqlEditorTab } from './SqlEditorTab';
import { sqlEditorTabHandlerKey } from './sqlEditorTabHandlerKey';

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
    private readonly containerResource: ContainerResource
  ) {
    super();

    this.onCanClose = new Executor();

    this.tabHandler = this.navigationTabsService
      .registerTabHandler<ISqlEditorTabState>({
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
        objectSchemaProvider(this.getObjectSchemaId.bind(this)),
        projectSetter(this.setProjectId.bind(this)),
        connectionSetter((connectionId, tab) => this.setConnectionId(tab, connectionId)),
        objectCatalogSetter(this.setObjectCatalogId.bind(this)),
        objectSchemaSetter(this.setObjectSchemaId.bind(this)),
      ],
    });

    makeObservable(this, {
      sqlEditorTabs: computed,
    });
  }

  register(): void {
    this.connectionsManagerService.onDisconnect.addHandler(this.disconnectHandler.bind(this));
    this.connectionInfoResource.onItemDelete.addHandler(this.handleConnectionDelete.bind(this));
    this.connectionExecutionContextResource.onItemAdd.addHandler(this.handleExecutionContextUpdate.bind(this));
    this.connectionExecutionContextResource.onItemDelete.addHandler(this.handleExecutionContextDelete.bind(this));
  }

  load(): void { }

  createNewEditor(
    editorId: string,
    dataSourceKey: string,
    name?: string,
    source?: string,
    script?: string,
  ): ITabOptions<ISqlEditorTabState> | null {

    const order = this.getFreeEditorId();

    const handlerState = this.sqlEditorService.getState(
      editorId,
      dataSourceKey,
      order,
      source,
    );

    const datasource = this.sqlDataSourceService.create(handlerState, dataSourceKey, { name, script });

    return {
      id: editorId,
      projectId: datasource.executionContext?.projectId ?? null,
      handlerId: sqlEditorTabHandlerKey,
      handlerState,
    };
  }

  attachToProject(tab: ITab<ISqlEditorTabState>, projectId: string | null): void {
    tab.projectId = projectId;
  }

  resetConnectionInfo(tab: ITab<ISqlEditorTabState>): void {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    dataSource?.setExecutionContext(undefined);
    this.attachToProject(tab, null);
  }

  private async handleConnectionDelete(key: ResourceKey<IConnectionInfoParams>) {
    const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
      isSQLEditorTab(tab => {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

        return !!dataSource?.executionContext;
      })
    );

    for (const tab of tabs) {
      const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

      if (dataSource?.executionContext) {
        const contextConnection = createConnectionParam(
          dataSource.executionContext.projectId,
          dataSource.executionContext.connectionId
        );

        if (this.connectionInfoResource.includes(key, contextConnection)) {
          this.resetConnectionInfo(tab);
        }
      }
    }
  }

  private getNavNode(tab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    if (!dataSource?.executionContext) {
      return;
    }

    const { projectId, connectionId, defaultCatalog, defaultSchema } = dataSource.executionContext;
    const connectionKey = createConnectionParam(projectId, connectionId);

    const connection = this.connectionInfoResource.get(connectionKey);

    if (!connection?.connected) {
      return;
    }

    let catalogData: ICatalogData | undefined;
    let schema: NavNodeInfoFragment | undefined;

    if (defaultCatalog) {
      catalogData = this.containerResource.getCatalogData(
        connectionKey,
        defaultCatalog
      );

      if (catalogData && defaultSchema) {
        schema = catalogData.schemaList.find(schema => schema.name === defaultSchema);
      }
    } else if (defaultSchema) {
      schema = this.containerResource.getSchema(
        connectionKey,
        defaultSchema
      );
    }

    let nodeId = schema?.id ?? catalogData?.catalog.id;

    if (!nodeId) {
      nodeId = NodeManagerUtils.connectionIdToConnectionNodeId(connectionId);
    }

    const parents = this.navNodeInfoResource.getParents(nodeId);

    untracked(() => this.navNodeInfoResource.load(nodeId!));

    return {
      nodeId,
      path: parents,
    };
  }

  private async handleExecutionContextUpdate(key: ResourceKey<string>) {
    const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
      isSQLEditorTab(tab => {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

        return (
          !!dataSource?.executionContext
          && ResourceKeyUtils.includes(key, dataSource.executionContext.id)
        );
      })
    );

    for (const tab of tabs) {
      const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId)!;
      const executionContext = this.connectionExecutionContextService.get(dataSource.executionContext!.id);

      if (!executionContext?.context) {
        if (dataSource.executionContext) {
          const contextConnection = createConnectionParam(
            dataSource.executionContext.projectId,
            dataSource.executionContext.connectionId
          );

          if (!this.connectionInfoResource.has(contextConnection)) {
            this.resetConnectionInfo(tab);
          }
        }
      } else {
        dataSource.setExecutionContext({ ...executionContext.context });
        this.attachToProject(tab, executionContext.context.projectId);
      }
    }
  }

  private async handleExecutionContextDelete(key: ResourceKey<string>) {
    const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
      isSQLEditorTab(tab => {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

        return !!dataSource?.executionContext;
      })
    );

    for (const tab of tabs) {
      const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId)!;

      if (dataSource.executionContext) {
        const contextConnection = createConnectionParam(
          dataSource.executionContext.projectId,
          dataSource.executionContext.connectionId
        );

        if (
          ResourceKeyUtils.includes(key, dataSource.executionContext!.id)
          && !this.connectionInfoResource.has(contextConnection)
        ) {
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
    if (
      typeof tab.handlerState.editorId !== 'string'
      || typeof tab.handlerState.editorId !== 'string'
      || typeof tab.handlerState.order !== 'number'
      || !['string', 'undefined'].includes(typeof tab.handlerState.currentTabId)
      || !['string', 'undefined'].includes(typeof tab.handlerState.source)
      || !['string', 'undefined'].includes(typeof tab.handlerState.currentModeId)
      || !Array.isArray(tab.handlerState.modeState)
      || !Array.isArray(tab.handlerState.tabs)
      || !Array.isArray(tab.handlerState.executionPlanTabs)
      || !Array.isArray(tab.handlerState.resultGroups)
      || !Array.isArray(tab.handlerState.resultTabs)
      || !Array.isArray(tab.handlerState.statisticsTabs)
    ) {
      await this.sqlDataSourceService.destroy(tab.handlerState.editorId);
      return false;
    }

    const dataSource = this.sqlDataSourceService.create(
      tab.handlerState,
      tab.handlerState.datasourceKey
    );

    if (dataSource.executionContext) {
      await this.connectionInfoResource.load(ConnectionInfoActiveProjectKey);

      const contextConnection = createConnectionParam(
        dataSource.executionContext.projectId,
        dataSource.executionContext.connectionId
      );

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

  private getConnectionId(tab: ITab<ISqlEditorTabState>): IConnectionInfoParams | undefined {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    if (!dataSource?.executionContext) {
      return undefined;
    }

    return createConnectionParam(
      dataSource.executionContext.projectId,
      dataSource.executionContext.connectionId
    );
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

  private setProjectId(projectId: string | null, tab: ITab<ISqlEditorTabState>): boolean {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    dataSource?.setProject(projectId);
    this.attachToProject(tab, projectId);

    return true;
  }

  async setConnectionId(
    tab: ITab<ISqlEditorTabState>,
    connectionKey: IConnectionInfoParams,
    catalogId?: string,
    schemaId?: string
  ) {
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
      const context = await executionContext.update(
        containerId,
        dataSource.executionContext.defaultSchema,
      );

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
      const context = await executionContext.update(
        dataSource.executionContext.defaultCatalog,
        containerId
      );

      dataSource.setExecutionContext({ ...context });
      return true;
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor schema');
      return false;
    }
  }

  private async disconnectHandler(
    data: IConnectionExecutorData,
    contexts: IExecutionContextProvider<IConnectionExecutorData>
  ) {
    const connectionsKey = resourceKeyList(data.connections);
    if (data.state === 'before') {
      for (const tab of this.sqlEditorTabs) {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

        if (!dataSource?.executionContext) {
          continue;
        }

        const connectionKey = createConnectionParam(
          dataSource.executionContext.projectId,
          dataSource.executionContext.connectionId
        );

        if (!this.connectionInfoResource.includes(connectionsKey, connectionKey)) {
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

    if (canCloseTabs) {
      const contexts = await this.onCanClose.execute(editorTab);
      if (ExecutorInterrupter.isInterrupted(contexts)) {
        return false;
      }
    }

    const canDestroyDatasource = await this.sqlDataSourceService.canDestroy(editorTab.handlerState.editorId);

    return canDestroyDatasource;
  }

  private async handleTabUnload(editorTab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(editorTab.handlerState.editorId);

    if (dataSource?.executionContext) {
      await this.sqlEditorService.destroyContext(dataSource.executionContext);
    }

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
    await this.sqlDataSourceService.destroy(editorTab.handlerState.editorId);
  }
}

function findMinimalFree(array: number[], base: number): number {
  return array
    .sort((a, b) => b - a)
    .reduceRight((prev, cur) => (prev === cur ? prev + 1 : prev), base);
}
