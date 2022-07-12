/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import {
  NavigationTabsService,
  TabHandler,
  ITab,
  objectSchemaProvider,
  objectCatalogProvider,
  objectCatalogSetter,
  objectSchemaSetter,
  ITabOptions,
  objectNavNodeProvider,
  NodeManagerUtils,
  NavNodeManagerService
} from '@cloudbeaver/core-app';
import {
  ConnectionExecutionContextResource,
  ConnectionExecutionContextService,
  ConnectionInfoResource,
  connectionProvider,
  connectionSetter,
  ConnectionsManagerService,
  ContainerResource,
  ICatalogData,
  IConnectionExecutorData,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { CachedMapAllKey, NavNodeInfoFragment, ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { SqlResultTabsService, ISqlEditorTabState, SqlEditorService, getSqlEditorName, SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';

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
    private readonly navNodeManagerService: NavNodeManagerService,
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
      onClose: this.handleTabClose.bind(this),
      canClose: this.handleCanTabClose.bind(this),
      extensions: [
        objectNavNodeProvider(this.getNavNode.bind(this)),
        connectionProvider(this.getConnectionId.bind(this)),
        objectCatalogProvider(this.getObjectCatalogId.bind(this)),
        objectSchemaProvider(this.getObjectSchemaId.bind(this)),
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

    this.sqlDataSourceService.create(handlerState, dataSourceKey, { name, script });

    return {
      id: editorId,
      handlerId: sqlEditorTabHandlerKey,
      handlerState,
    };
  }

  resetConnectionInfo(state: ISqlEditorTabState): void {
    const dataSource = this.sqlDataSourceService.get(state.editorId);

    dataSource?.setExecutionContext(undefined);
  }

  private async handleConnectionDelete(key: ResourceKey<string>) {
    const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
      isSQLEditorTab(tab => {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

        return !!dataSource?.executionContext;
      })
    );

    for (const tab of tabs) {
      const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
      if (ResourceKeyUtils.includes(key, dataSource?.executionContext?.connectionId)) {
        this.resetConnectionInfo(tab.handlerState);
      }
    }
  }

  private getNavNode(tab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

    if (!dataSource?.executionContext) {
      return;
    }

    const { connectionId, defaultCatalog, defaultSchema } = dataSource.executionContext;

    let catalogData: ICatalogData | undefined;
    let schema: NavNodeInfoFragment | undefined;

    if (defaultCatalog) {
      catalogData = this.containerResource.getCatalogData(connectionId, defaultCatalog);
    }

    if (catalogData && defaultSchema) {
      schema = catalogData.schemaList.find(schema => schema.name === defaultSchema);
    }

    let nodeId = schema?.id ?? catalogData?.catalog.id;

    if (!nodeId) {
      nodeId = NodeManagerUtils.connectionIdToConnectionNodeId(connectionId);
    }

    const connection = this.connectionInfoResource.getConnectionForNode(nodeId);

    if (connection?.connected === false) {
      return;
    }

    const parents = NodeManagerUtils.parentsFromPath(nodeId);
    const parent = this.navNodeManagerService.getNode(parents[0]);

    if (parent) {
      parents.unshift(parent.parentId);
    }

    return {
      nodeId,
      path: parents,
    };
  }

  private async handleExecutionContextUpdate(key: ResourceKey<string>) {
    const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
      isSQLEditorTab(tab => {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

        return !!dataSource?.executionContext;
      })
    );

    for (const tab of tabs) {
      const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId)!;
      const executionContext = this.connectionExecutionContextService.get(dataSource.executionContext!.id);

      if (!executionContext?.context) {
        if (!this.connectionInfoResource.has(dataSource.executionContext?.connectionId || '')) {
          this.resetConnectionInfo(tab.handlerState);
        }
      } else {
        dataSource.setExecutionContext({ ...executionContext.context });
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
      if (
        ResourceKeyUtils.includes(key, dataSource.executionContext!.id)
        && !this.connectionInfoResource.has(dataSource.executionContext!.connectionId)
      ) {
        this.resetConnectionInfo(tab.handlerState);
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
      || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.currentTabId)
      || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.source)
      || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.currentModeId)
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
      await this.connectionInfoResource.load(CachedMapAllKey);

      if (!this.connectionInfoResource.has(dataSource.executionContext.connectionId)) {
        this.resetConnectionInfo(tab.handlerState);
      }
    }

    // clean old results
    tab.handlerState.currentTabId = '';
    tab.handlerState.tabs = [];
    tab.handlerState.resultGroups = [];
    tab.handlerState.resultTabs = [];
    tab.handlerState.executionPlanTabs = [];
    tab.handlerState.statisticsTabs = [];

    return true;
  }

  private getConnectionId(tab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
    return dataSource?.executionContext?.connectionId;
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

  async setConnectionId(
    tab: ITab<ISqlEditorTabState>,
    connectionId: string,
    catalogId?: string,
    schemaId?: string
  ) {
    return await this.sqlEditorService.setConnection(tab.handlerState, connectionId, catalogId, schemaId);
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
    if (data.state === 'before') {
      for (const tab of this.sqlEditorTabs) {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

        if (!data.connections.includes(dataSource?.executionContext?.connectionId ?? '')) {
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

  private async handleTabClose(editorTab: ITab<ISqlEditorTabState>) {
    const dataSource = this.sqlDataSourceService.get(editorTab.handlerState.editorId);

    if (dataSource?.executionContext) {
      await this.sqlEditorService.destroyContext(dataSource.executionContext);
    }

    await this.sqlDataSourceService.destroy(editorTab.handlerState.editorId);

    this.sqlResultTabsService.removeResultTabs(editorTab.handlerState);
  }
}

function findMinimalFree(array: number[], base: number): number {
  return array
    .sort((a, b) => b - a)
    .reduceRight((prev, cur) => (prev === cur ? prev + 1 : prev), base);
}
