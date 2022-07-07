/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { NavigationTabsService, NavTreeResource } from '@cloudbeaver/core-app';
import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { WindowEventsService } from '@cloudbeaver/core-root';
import { ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';
import { throttle } from '@cloudbeaver/core-utils';
import { NavResourceNodeService, ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';
import { SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';
import { SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import type { IResourceNodeInfo, IResourceSqlDataSourceState } from './IResourceSqlDataSourceState';
import { ResourceSqlDataSource } from './ResourceSqlDataSource';
import { SqlEditorTabResourceService } from './SqlEditorTabResourceService';

const RESOURCE_TAB_STATE = 'sql_editor_resource_tab_state';
const SYNC_DELAY = 5 * 60 * 1000;

@injectable()
export class ResourceSqlDataSourceBootstrap extends Bootstrap {
  private readonly dataSourceStateState = new Map<string, IResourceSqlDataSourceState>();

  constructor(
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly commonDialogService: CommonDialogService,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly notificationService: NotificationService,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly navTreeResource: NavTreeResource,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly windowEventsService: WindowEventsService,
    private readonly sqlEditorTabResourceService: SqlEditorTabResourceService,
    localStorageSaveService: LocalStorageSaveService,
  ) {
    super();
    this.dataSourceStateState = new Map();
    this.focusChangeHandler = throttle(this.focusChangeHandler.bind(this), SYNC_DELAY, false);

    makeObservable<this, 'dataSourceStateState' | 'createState'>(this, {
      createState: action,
      dataSourceStateState: observable,
    });

    localStorageSaveService.withAutoSave(
      this.dataSourceStateState,
      RESOURCE_TAB_STATE,
      map => {
        for (const [key, value] of Array.from(map.entries())) {
          if (
            !['undefined', 'object'].includes(typeof value.nodeInfo)
            || !['string', 'undefined', 'object'].includes(typeof value.nodeInfo?.nodeId)
            || !['undefined', 'object'].includes(typeof value.nodeInfo?.parents)
            || !['undefined', 'object'].includes(typeof value.executionContext)
            || !['string', 'undefined', 'object'].includes(typeof value.executionContext?.connectionId)
            || !['string', 'undefined', 'object'].includes(typeof value.executionContext?.id)
            || !['string', 'undefined', 'object'].includes(typeof value.executionContext?.defaultCatalog)
            || !['string', 'undefined', 'object'].includes(typeof value.executionContext?.defaultSchema)
          ) {
            map.delete(key);
          }
        }
        return map;
      }
    );
  }

  register(): void | Promise<void> {
    this.windowEventsService.onFocusChange.addHandler(this.focusChangeHandler.bind(this));
    this.navTreeResource.onItemDelete.addHandler(this.nodeDeleteHandler.bind(this));

    this.sqlDataSourceService.register({
      key: ResourceSqlDataSource.key,
      getDataSource: (editorId, script, executionContext) => {
        const dataSource = new ResourceSqlDataSource(this.createState(
          editorId,
          executionContext,
        ));

        if (script) {
          dataSource.setScript(script);
        }

        dataSource.setActions({
          read: this.read.bind(this),
          write: this.write.bind(this),
        });

        return dataSource;
      },
      onDestroy: (_, editorId) => this.deleteState(editorId),
      canDestroy: async (dataSource, editorId) => {
        try {
          if (dataSource instanceof ResourceSqlDataSource) {
            await dataSource.write();
          }
        } catch {
          const tab = this.sqlEditorTabService.sqlEditorTabs.find(tab => tab.handlerState.editorId === editorId);

          const result = await this.commonDialogService.open(ConfirmationDialog, {
            title: 'plugin_resource_manager_save_script_error_confirmation_title',
            message: 'plugin_resource_manager_save_script_error_confirmation_message',
            subTitle: tab?.handlerState.name,
            confirmActionText: 'ui_close',
          });

          if (result === DialogueStateResult.Rejected) {
            return false;
          }
        }
        return true;
      },
    });
  }

  load(): void | Promise<void> { }

  private createState(
    editorId: string,
    executionContext?: IConnectionExecutionContextInfo,
    nodeInfo?: IResourceNodeInfo
  ): IResourceSqlDataSourceState {
    let state = this.dataSourceStateState.get(editorId);

    if (!state) {
      state = observable<IResourceSqlDataSourceState>({
        executionContext,
        nodeInfo,
      });

      this.dataSourceStateState.set(editorId, state);
    }

    return state;
  }

  private deleteState(editorId: string): void {
    this.dataSourceStateState.delete(editorId);
  }

  private async focusChangeHandler(focused: boolean) {
    if (!this.resourceManagerService.enabled) {
      return;
    }

    if (focused) {
      const dataSources = this.sqlDataSourceService.dataSources
        .filter(([, dataSource]) => (
          dataSource instanceof ResourceSqlDataSource
        ))
        .map(([,dataSource]) => dataSource as ResourceSqlDataSource);

      for (const dataSource of dataSources) {
        dataSource.markOutdated();
      }
    }
  }

  private nodeDeleteHandler(keyObj: ResourceKey<string>) {
    if (!this.resourceManagerService.enabled) {
      return;
    }

    const tabs: string[] = [];

    ResourceKeyUtils.forEach(keyObj, key => {
      const tab = this.sqlEditorTabResourceService.getResourceTab(key);

      if (tab) {
        tabs.push(tab.id);
      }
    });

    this.navigationTabsService.closeTabSilent(resourceKeyList(tabs), true);
  }

  private async write(nodeId: string, value: string): Promise<void> {
    if (!this.resourceManagerService.enabled) {
      return;
    }

    try {
      const resourceData = this.navResourceNodeService.getResourceData(nodeId);

      if (!resourceData) {
        return;
      }

      await this.navResourceNodeService.write(resourceData, value);
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_resource_manager_update_script_error');
      throw exception;
    }
  }

  private async read(nodeId: string): Promise<string> {
    try {
      const resourceData = this.navResourceNodeService.getResourceData(nodeId);

      if (!resourceData) {
        throw new Error('Can\'t find resource');
      }

      const data = await this.navResourceNodeService.read(resourceData);

      return data;
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_resource_manager_sync_script_error');
      throw exception;
    }
  }
}