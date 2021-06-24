/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

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
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlEditorPanel } from './SqlEditorPanel';
import { SqlEditorService } from './SqlEditorService';
import { SqlEditorTab } from './SqlEditorTab';
import { sqlEditorTabHandlerKey } from './sqlEditorTabHandlerKey';
import { SqlExecutionState } from './SqlExecutionState';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService';

@injectable()
export class SqlEditorTabService extends Bootstrap {
  readonly tabExecutionState: MetadataMap<string, SqlExecutionState>;
  readonly tabHandler: TabHandler<ISqlEditorTabState>;

  constructor(
    private navigationTabsService: NavigationTabsService,
    private notificationService: NotificationService,
    private sqlEditorService: SqlEditorService,
    private connectionInfo: ConnectionInfoResource,
    private readonly sqlResultTabsService: SqlResultTabsService
  ) {
    super();

    this.tabExecutionState = new MetadataMap(() => new SqlExecutionState());

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
    const executionContext = await this.sqlEditorService.initContext(connectionId, catalogId, schemaId);

    if (!executionContext) {
      return null;
    }

    const order = this.getFreeEditorId();

    return {
      handlerId: sqlEditorTabHandlerKey,
      handlerState: {
        query: '',
        order,
        executionContext,
        tabs: [],
        resultGroups: [],
        resultTabs: [],
        executionPlanTabs: [],
      },
    };
  }

  selectResultTab(tab: ITab<ISqlEditorTabState>, resultId: string): void {
    tab.handlerState.currentTabId = resultId;
  }

  resetConnectionInfo(state: ISqlEditorTabState): void {
    state.executionContext = undefined;
  }

  private async handleConnectionUpdate(key: ResourceKey<string>) {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
        isSQLEditorTab(tab => tab.handlerState.executionContext?.connectionId === key)
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
        isSQLEditorTab(tab => tab.handlerState.executionContext?.connectionId === key)
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
        || !['undefined', 'object'].includes(typeof tab.handlerState.executionContext)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.executionContext?.connectionId)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.executionContext?.contextId)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.executionContext?.objectCatalogId)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.currentTabId)
        || !Array.isArray(tab.handlerState.tabs)
        || !Array.isArray(tab.handlerState.executionPlanTabs)
        || !Array.isArray(tab.handlerState.resultGroups)
        || !Array.isArray(tab.handlerState.resultTabs)
    ) {
      return false;
    }

    if (tab.handlerState.executionContext) {
      const connection = this.connectionInfo.get(tab.handlerState.executionContext.connectionId);

      if (!connection?.connected) {
        this.resetConnectionInfo(tab.handlerState);
      }
    }

    tab.handlerState.currentTabId = '';
    tab.handlerState.tabs = []; // clean old results
    tab.handlerState.resultGroups = []; // clean old results
    tab.handlerState.resultTabs = []; // clean old results
    tab.handlerState.executionPlanTabs = []; // clean old results

    return true;
  }

  private getConnectionId(tab: ITab<ISqlEditorTabState>) {
    return tab.handlerState.executionContext?.connectionId;
  }

  private getObjectCatalogId(tab: ITab<ISqlEditorTabState>) {
    return tab.handlerState.executionContext?.objectCatalogId;
  }

  private getObjectSchemaId(tab: ITab<ISqlEditorTabState>) {
    return tab.handlerState.executionContext?.objectSchemaId;
  }

  private async setConnectionId(connectionId: string, tab: ITab<ISqlEditorTabState>) {
    try {
      const context = await this.sqlEditorService.initContext(connectionId);

      if (!context) {
        return false;
      }

      if (tab.handlerState.executionContext) {
      // when new context created - destroy old one silently
        await this.sqlEditorService.destroySqlContext(tab.handlerState.executionContext);
      }

      tab.handlerState.executionContext = context;
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
    try {
      await this.sqlEditorService.updateSqlContext(
        tab.handlerState.executionContext?.connectionId,
        tab.handlerState.executionContext?.contextId,
        containerId
      );
      tab.handlerState.executionContext.objectCatalogId = containerId;
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
    try {
      await this.sqlEditorService.updateSqlContext(
        tab.handlerState.executionContext.connectionId,
        tab.handlerState.executionContext.contextId,
        tab.handlerState.executionContext.objectCatalogId,
        containerId
      );
      tab.handlerState.executionContext.objectSchemaId = containerId;
      return true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor schema');
      return false;
    }
  }

  private async handleTabClose(editorTab: ITab<ISqlEditorTabState>) {
    this.tabExecutionState.delete(editorTab.id);
    if (editorTab.handlerState.executionContext) {
      await this.sqlEditorService.destroySqlContext(editorTab.handlerState.executionContext);
    }
    for (const tab of editorTab.handlerState.tabs) {
      await this.sqlResultTabsService.removeResultTab(editorTab.handlerState, tab.id);
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
