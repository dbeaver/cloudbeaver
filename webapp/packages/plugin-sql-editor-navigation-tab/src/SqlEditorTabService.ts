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
  ITabOptions
} from '@cloudbeaver/core-app';
import {
  ConnectionExecutionContextResource,
  ConnectionExecutionContextService,
  ConnectionInfoResource,
  connectionProvider,
  connectionSetter,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapAllKey, ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { SqlResultTabsService, ISqlEditorTabState, SqlEditorService, getSqlEditorName } from '@cloudbeaver/plugin-sql-editor';

import { SqlEditorPanel } from './SqlEditorPanel';
import { SqlEditorTab } from './SqlEditorTab';
import { sqlEditorTabHandlerKey } from './sqlEditorTabHandlerKey';

@injectable()
export class SqlEditorTabService extends Bootstrap {
  get sqlEditorTabs(): ITab<ISqlEditorTabState>[] {
    return Array.from(this.navigationTabsService.findTabs<ISqlEditorTabState>(isSQLEditorTab));
  }

  readonly tabHandler: TabHandler<ISqlEditorTabState>;

  constructor(
    private readonly navigationTabsService: NavigationTabsService,
    private readonly notificationService: NotificationService,
    private readonly sqlEditorService: SqlEditorService,
    private readonly sqlResultTabsService: SqlResultTabsService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super();

    this.tabHandler = this.navigationTabsService
      .registerTabHandler<ISqlEditorTabState>({
      key: sqlEditorTabHandlerKey,
      getTabComponent: () => SqlEditorTab,
      getPanelComponent: () => SqlEditorPanel,
      onRestore: this.handleTabRestore.bind(this),
      onClose: this.handleTabClose.bind(this),
      canClose: this.handleCanTabClose.bind(this),
      extensions: [
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
    this.connectionExecutionContextResource.onItemAdd.addHandler(this.handleExecutionContextUpdate.bind(this));
    this.connectionExecutionContextResource.onItemDelete.addHandler(this.handleExecutionContextDelete.bind(this));
  }

  load(): void {}

  getName(tabState: ISqlEditorTabState): string {
    const connection = this.connectionInfoResource.get(tabState.executionContext?.connectionId || '');

    return getSqlEditorName(tabState, connection);
  }

  createNewEditor(
    name?: string,
    source?: string,
  ): ITabOptions<ISqlEditorTabState> | null {

    const order = this.getFreeEditorId();

    return {
      handlerId: sqlEditorTabHandlerKey,
      handlerState: this.sqlEditorService.getState(order, name, source),
    };
  }

  resetConnectionInfo(state: ISqlEditorTabState): void {
    state.executionContext = undefined;
  }

  private async handleExecutionContextUpdate(key: ResourceKey<string>) {
    const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
      isSQLEditorTab(tab => !!tab.handlerState.executionContext)
    );

    for (const tab of tabs) {
      const executionContext = this.connectionExecutionContextService.get(tab.handlerState.executionContext!.id);

      if (!executionContext?.context) {
        if (!this.connectionInfoResource.has(tab.handlerState.executionContext?.connectionId || '')) {
          this.resetConnectionInfo(tab.handlerState);
        }
      } else {
        tab.handlerState.executionContext = { ...executionContext.context };
      }
    }
  }

  private async handleExecutionContextDelete(key: ResourceKey<string>) {
    const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
      isSQLEditorTab(tab => !!tab.handlerState.executionContext)
    );

    for (const tab of tabs) {
      if (
        ResourceKeyUtils.includes(key, tab.handlerState.executionContext!.id) 
        && !this.connectionInfoResource.has(tab.handlerState.executionContext!.connectionId)
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
    if (typeof tab.handlerState.query !== 'string'
        || typeof tab.handlerState.order !== 'number'
        || !['undefined', 'object'].includes(typeof tab.handlerState.executionContext)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.executionContext?.connectionId)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.executionContext?.id)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.executionContext?.defaultCatalog)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.executionContext?.defaultSchema)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.currentTabId)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.name)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.source)
        || !Array.isArray(tab.handlerState.tabs)
        || !Array.isArray(tab.handlerState.executionPlanTabs)
        || !Array.isArray(tab.handlerState.resultGroups)
        || !Array.isArray(tab.handlerState.resultTabs)
        || !Array.isArray(tab.handlerState.statisticsTabs)
    ) {
      return false;
    }

    if (tab.handlerState.executionContext) {
      await this.connectionInfoResource.load(CachedMapAllKey);

      if (!this.connectionInfoResource.has(tab.handlerState.executionContext.connectionId)) {
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
    return tab.handlerState.executionContext?.connectionId;
  }

  private getObjectCatalogId(tab: ITab<ISqlEditorTabState>) {
    const context = this.connectionExecutionContextResource.get(tab.handlerState.executionContext?.id ?? '');
    return context?.defaultCatalog;
  }

  private getObjectSchemaId(tab: ITab<ISqlEditorTabState>) {
    const context = this.connectionExecutionContextResource.get(tab.handlerState.executionContext?.id ?? '');
    return context?.defaultSchema;
  }

  async setConnectionId(
    tab: ITab<ISqlEditorTabState>, 
    connectionId: string, 
    catalogId?: string,
    schemaId?: string
  ) {
    try {
      const executionContext = await this.sqlEditorService.initContext(connectionId, catalogId, schemaId);

      if (!executionContext?.context) {
        return false;
      }

      const previousContext = tab.handlerState.executionContext;
      tab.handlerState.executionContext = { ...executionContext.context };

      if (previousContext) {
        await this.sqlEditorService.destroyContext(previousContext);
      }

      return true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor connection');
      return false;
    }
  }

  private async setObjectCatalogId(containerId: string, tab: ITab<ISqlEditorTabState>) {
    if (!tab.handlerState.executionContext) {
      return false;
    }

    const executionContext = this.connectionExecutionContextService.get(tab.handlerState.executionContext.id);

    if (!executionContext) {
      return false;
    }

    try {
      await executionContext.update(
        containerId,
        tab.handlerState.executionContext.defaultSchema,
      );
      tab.handlerState.executionContext.defaultCatalog = containerId;
      return true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor catalog');
      return false;
    }
  }

  private async setObjectSchemaId(containerId: string, tab: ITab<ISqlEditorTabState>) {
    if (!tab.handlerState.executionContext) {
      return false;
    }

    const executionContext = this.connectionExecutionContextService.get(tab.handlerState.executionContext.id);

    if (!executionContext) {
      return false;
    }

    try {
      await executionContext.update(
        tab.handlerState.executionContext.defaultCatalog,
        containerId
      );
      tab.handlerState.executionContext.defaultSchema = containerId;
      return true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor schema');
      return false;
    }
  }

  private async handleCanTabClose(editorTab: ITab<ISqlEditorTabState>) {
    return await this.sqlResultTabsService.canCloseResultTabs(editorTab.handlerState);
  }

  private async handleTabClose(editorTab: ITab<ISqlEditorTabState>) {
    if (editorTab.handlerState.executionContext) {
      await this.sqlEditorService.destroyContext(editorTab.handlerState.executionContext);
    }

    this.sqlResultTabsService.removeResultTabs(editorTab.handlerState);
  }
}

function findMinimalFree(array: number[], base: number): number {
  return array
    .sort((a, b) => b - a)
    .reduceRight((prev, cur) => (prev === cur ? prev + 1 : prev), base);
}

export function isSQLEditorTab(tab: ITab): tab is ITab<ISqlEditorTabState>;
export function isSQLEditorTab(
  predicate: (tab: ITab<ISqlEditorTabState>) => boolean
): (tab: ITab) => tab is ITab<ISqlEditorTabState>;
export function isSQLEditorTab(
  tab: ITab | ((tab: ITab<ISqlEditorTabState>) => boolean)
): boolean | ((tab: ITab) => tab is ITab<ISqlEditorTabState>) {
  if (typeof tab === 'function') {
    const predicate = tab;
    return (tab: ITab): tab is ITab<ISqlEditorTabState> => {
      const sqlEditorTab = tab.handlerId === sqlEditorTabHandlerKey;
      if (!predicate || !sqlEditorTab) {
        return sqlEditorTab;
      }
      return predicate(tab);
    };
  }
  return tab.handlerId === sqlEditorTabHandlerKey;
}
