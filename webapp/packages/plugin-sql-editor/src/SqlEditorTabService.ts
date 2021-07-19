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
  ConnectionExecutionContextResource,
  ConnectionExecutionContextService,
  connectionProvider,
  connectionSetter,
  IConnectionExecutionContextInfo,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import type { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlEditorPanel } from './SqlEditorPanel';
import { SqlEditorService } from './SqlEditorService';
import { SqlEditorTab } from './SqlEditorTab';
import { sqlEditorTabHandlerKey } from './sqlEditorTabHandlerKey';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService';

@injectable()
export class SqlEditorTabService extends Bootstrap {
  readonly tabHandler: TabHandler<ISqlEditorTabState>;

  constructor(
    private navigationTabsService: NavigationTabsService,
    private notificationService: NotificationService,
    private sqlEditorService: SqlEditorService,
    private readonly sqlResultTabsService: SqlResultTabsService,
    private connectionExecutionContextService: ConnectionExecutionContextService,
    private connectionExecutionContextResource: ConnectionExecutionContextResource
  ) {
    super();

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
    this.connectionExecutionContextResource.onItemAdd.addHandler(this.handleExecutionContextUpdate.bind(this));
    this.connectionExecutionContextResource.onItemDelete.addHandler(this.handleExecutionContextUpdate.bind(this));
  }

  load(): void {}

  async createNewEditor(
    connectionId?: string,
    catalogId?: string,
    schemaId?: string
  ): Promise<ITabOptions<ISqlEditorTabState> | null> {
    const executionContext = await this.sqlEditorService.initContext(connectionId, catalogId, schemaId);

    if (!executionContext?.context) {
      return null;
    }

    const order = this.getFreeEditorId();

    return {
      handlerId: sqlEditorTabHandlerKey,
      handlerState: {
        query: '',
        order,
        executionContext: { ...executionContext.context },
        tabs: [],
        resultGroups: [],
        resultTabs: [],
        executionPlanTabs: [],
      },
    };
  }

  selectResultTab(state: ISqlEditorTabState, resultId: string): void {
    state.currentTabId = resultId;
  }

  resetConnectionInfo(state: ISqlEditorTabState): void {
    state.executionContext = undefined;
  }

  private async handleExecutionContextUpdate() {
    const tabs = this.navigationTabsService.findTabs<ISqlEditorTabState>(
      isSQLEditorTab(tab => !!tab.handlerState.executionContext)
    );

    for (const tab of tabs) {
      const executionContext = this.connectionExecutionContextService.get(tab.handlerState.executionContext!.baseId);
      if (!executionContext) {
        this.resetConnectionInfo(tab.handlerState);
      }
    }
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
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.executionContext?.id)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.executionContext?.baseId)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.executionContext?.defaultCatalog)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.executionContext?.defaultSchema)
        || !['string', 'undefined', 'object'].includes(typeof tab.handlerState.currentTabId)
        || !Array.isArray(tab.handlerState.tabs)
        || !Array.isArray(tab.handlerState.executionPlanTabs)
        || !Array.isArray(tab.handlerState.resultGroups)
        || !Array.isArray(tab.handlerState.resultTabs)
    ) {
      return false;
    }

    if (tab.handlerState.executionContext) {
      const executionContext = this.connectionExecutionContextService.get(tab.handlerState.executionContext.baseId);

      if (!executionContext) {
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
    return tab.handlerState.executionContext?.defaultCatalog;
  }

  private getObjectSchemaId(tab: ITab<ISqlEditorTabState>) {
    return tab.handlerState.executionContext?.defaultSchema;
  }

  private async setConnectionId(connectionId: string, tab: ITab<ISqlEditorTabState>) {
    try {
      const executionContext = await this.sqlEditorService.initContext(connectionId);

      if (!executionContext?.context) {
        return false;
      }

      const previousContext = tab.handlerState.executionContext;
      tab.handlerState.executionContext = { ...executionContext.context };

      if (previousContext) {
        await this.destroyContext(previousContext);
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

    const executionContext = this.connectionExecutionContextService.get(tab.handlerState.executionContext.baseId);

    if (!executionContext) {
      return false;
    }

    try {
      await executionContext.update(
        containerId,
        tab.handlerState.executionContext?.defaultSchema,
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

    const executionContext = this.connectionExecutionContextService.get(tab.handlerState.executionContext.baseId);

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

  private async handleTabClose(editorTab: ITab<ISqlEditorTabState>) {
    if (editorTab.handlerState.executionContext) {
      await this.destroyContext(editorTab.handlerState.executionContext);
    }
    for (const tab of editorTab.handlerState.tabs) {
      await this.sqlResultTabsService.removeResultTab(editorTab.handlerState, tab.id);
    }
  }

  private async destroyContext(contextInfo: IConnectionExecutionContextInfo) {
    const executionContext = this.connectionExecutionContextService.get(contextInfo.baseId);

    if (executionContext) {
      try {
        await executionContext.destroy();
      } catch (exception) {
        this.notificationService.logException(exception, `Failed to destroy SQL-context ${executionContext.context?.baseId}`, '', true);
      }
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
