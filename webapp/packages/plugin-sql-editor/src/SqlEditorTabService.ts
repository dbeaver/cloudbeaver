/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

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
  ConnectionInfoResource,
  connectionProvider,
  connectionSetter,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';

import { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlEditorPanel } from './SqlEditorPanel';
import { SqlEditorService } from './SqlEditorService';
import { SqlEditorTab } from './SqlEditorTab';
import { sqlEditorTabHandlerKey } from './sqlEditorTabHandlerKey';
import { SqlExecutionState } from './SqlExecutionState';

@injectable()
export class SqlEditorTabService extends Bootstrap {
  @observable readonly tabExecutionState: Map<string, SqlExecutionState>;
  readonly tabHandler: TabHandler<ISqlEditorTabState>;

  constructor(
    private navigationTabsService: NavigationTabsService,
    private notificationService: NotificationService,
    private sqlEditorService: SqlEditorService,
    private connectionInfo: ConnectionInfoResource,
  ) {
    super();
    this.tabExecutionState = new Map();

    this.tabHandler = this.navigationTabsService
      .registerTabHandler<ISqlEditorTabState>({
      key: sqlEditorTabHandlerKey,
      getTabComponent: () => SqlEditorTab,
      getPanelComponent: () => SqlEditorPanel,
      onRestore: this.handleTabRestore.bind(this),
      onClose: this.handleTabClose.bind(this),
      extensions: [
        connectionProvider(this.getConnectionId.bind(this)),
        objectCatalogProvider(this.getObjectCatalogId.bind(this)),
        objectSchemaProvider(this.getObjectSchemaId.bind(this)),
        connectionSetter(this.setConnectionId.bind(this)),
        objectCatalogSetter(this.setObjectCatalogId.bind(this)),
        objectSchemaSetter(this.setObjectSchemaId.bind(this)),
      ],
    });
  }

  register(): void {
    this.connectionInfo.onItemDelete.addHandler(this.handleConnectionDelete.bind(this));
    this.connectionInfo.onItemAdd.addHandler(this.handleConnectionUpdate.bind(this));
  }

  load(): void {}

  async createNewEditor(
    connectionId?: string,
    catalogId?: string,
    schemaId?: string
  ): Promise<ITabOptions<ISqlEditorTabState> | null> {
    const context = await this.sqlEditorService.initContext(connectionId, catalogId, schemaId);

    if (!context) {
      return null;
    }

    const order = this.getFreeEditorId();

    return {
      handlerId: sqlEditorTabHandlerKey,
      handlerState: {
        query: '',
        order,
        contextId: context.contextId,
        connectionId: context.connectionId,
        objectCatalogId: context.objectCatalogId,
        objectSchemaId: context.objectSchemaId,
        queryTabGroups: [],
        resultTabs: [],
      },
    };
  }

  selectResultTab(tab: ITab<ISqlEditorTabState>, resultId: string): void {
    tab.handlerState.currentResultTabId = resultId;
  }

  async closeResultTab(tab: ITab<ISqlEditorTabState>, resultId: string): Promise<void> {
    const resultTabGroupId = tab.handlerState.resultTabs
      .find(resultTab => resultTab.resultTabId === resultId)?.groupId;

    tab.handlerState.resultTabs.splice(
      tab.handlerState.resultTabs.findIndex(result => result.resultTabId === resultId),
      1
    );

    const isGroupEmpty = !tab.handlerState.resultTabs.some(resultTab => resultTab.groupId === resultTabGroupId);

    if (isGroupEmpty) {
      const group = tab.handlerState.queryTabGroups.splice(
        tab.handlerState.queryTabGroups.findIndex(queryTabGroup => queryTabGroup.groupId === resultTabGroupId),
        1
      )[0];

      await this.sqlEditorService.destroySqlContext(group.sqlQueryParams.connectionId, group.sqlQueryParams.contextId);
    }

    if (tab.handlerState.currentResultTabId === resultId) {
      if (tab.handlerState.resultTabs.length > 0) {
        tab.handlerState.currentResultTabId = tab.handlerState.resultTabs[0].resultTabId;
      } else {
        tab.handlerState.currentResultTabId = '';
      }
    }
  }

  private async handleConnectionUpdate(key: ResourceKey<string>) {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
        isSQLEditorTab(tab => tab.handlerState.connectionId === key)
      );
      const connection = this.connectionInfo.get(key);

      if (!connection?.connected) {
        for (const tab of tabs) {
          this.resetConnectionInfo(tab.handlerState);
        }
      }
    });
  }

  private async handleConnectionDelete(key: ResourceKey<string>) {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
        isSQLEditorTab(tab => tab.handlerState.connectionId === key)
      );

      for (const tab of tabs) {
        this.resetConnectionInfo(tab.handlerState);
      }
    });
  }

  private getFreeEditorId() {
    const editorTabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(isSQLEditorTab);
    const ordered = Array.from(editorTabs).map(tab => tab.handlerState.order);
    return findMinimalFree(ordered, 1);
  }

  private async handleTabRestore(tab: ITab<ISqlEditorTabState>): Promise<boolean> {
    if (typeof tab.handlerState.query !== 'string'
        || typeof tab.handlerState.order !== 'number'
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.connectionId)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.contextId)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.objectCatalogId)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.currentResultTabId)
        || !Array.isArray(tab.handlerState.queryTabGroups)
        || !Array.isArray(tab.handlerState.resultTabs)
    ) {
      return false;
    }

    if (tab.handlerState.connectionId) {
      const connection = this.connectionInfo.get(tab.handlerState.connectionId);

      if (!connection?.connected) {
        this.resetConnectionInfo(tab.handlerState);
      }
    }

    tab.handlerState.currentResultTabId = '';
    tab.handlerState.queryTabGroups = []; // clean old results
    tab.handlerState.resultTabs = []; // clean old results

    this.tabExecutionState.set(tab.id, new SqlExecutionState());

    return true;
  }

  private getConnectionId(tab: ITab<ISqlEditorTabState>) {
    return tab.handlerState.connectionId;
  }

  private getObjectCatalogId(tab: ITab<ISqlEditorTabState>) {
    return tab.handlerState.objectCatalogId;
  }

  private getObjectSchemaId(tab: ITab<ISqlEditorTabState>) {
    return tab.handlerState.objectSchemaId;
  }

  private resetConnectionInfo(state: ISqlEditorTabState) {
    state.connectionId = undefined;
    state.contextId = undefined;
    state.objectCatalogId = undefined;
    state.currentResultTabId = undefined;
  }

  private async setConnectionId(connectionId: string, tab: ITab<ISqlEditorTabState>) {
    try {
      const context = await this.sqlEditorService.initContext(connectionId);

      if (!context) {
        return false;
      }

      // when new context created - destroy old one silently
      await this.sqlEditorService.destroySqlContext(tab.handlerState.connectionId, tab.handlerState.contextId);

      tab.handlerState.connectionId = context.connectionId;
      tab.handlerState.contextId = context.contextId;
      tab.handlerState.objectCatalogId = context.objectCatalogId;
      tab.handlerState.objectSchemaId = context.objectSchemaId;
      return true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor connection');
      return false;
    }
  }

  private async setObjectCatalogId(containerId: string, tab: ITab<ISqlEditorTabState>) {
    if (!tab.handlerState.connectionId) {
      return false;
    }
    try {
      await this.sqlEditorService.updateSqlContext(
        tab.handlerState.connectionId,
        tab.handlerState.contextId,
        containerId
      );
      tab.handlerState.objectCatalogId = containerId;
      return true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor catalog');
      return false;
    }
  }

  private async setObjectSchemaId(containerId: string, tab: ITab<ISqlEditorTabState>) {
    if (!tab.handlerState.connectionId) {
      return false;
    }
    try {
      await this.sqlEditorService.updateSqlContext(
        tab.handlerState.connectionId,
        tab.handlerState.contextId,
        tab.handlerState.objectCatalogId,
        containerId
      );
      tab.handlerState.objectSchemaId = containerId;
      return true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor schema');
      return false;
    }
  }

  private async handleTabClose(tab: ITab<ISqlEditorTabState>) {
    this.tabExecutionState.delete(tab.id);
    await this.sqlEditorService.destroySqlContext(tab.handlerState.connectionId, tab.handlerState.contextId);
    for (const resultTab of tab.handlerState.resultTabs) {
      await this.closeResultTab(tab, resultTab.resultTabId);
    }
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
