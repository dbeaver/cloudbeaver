/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable, untracked } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { IResourceManagerMoveData, IResourceManagerParams, isResourceManagerParamEqual, ResourceManagerResource } from '@cloudbeaver/core-resource-manager';
import { NetworkStateService, WindowEventsService } from '@cloudbeaver/core-root';
import { CachedMapAllKey, ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';
import { throttle } from '@cloudbeaver/core-utils';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import { NavResourceNodeService, ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';
import { getSqlEditorName, SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';
import { SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import type { IResourceSqlDataSourceState } from './IResourceSqlDataSourceState';
import { ResourceSqlDataSource } from './ResourceSqlDataSource';
import { SqlEditorTabResourceService } from './SqlEditorTabResourceService';

const RESOURCE_TAB_STATE = 'sql_editor_resource_tab_state';
const SYNC_DELAY = 5 * 60 * 1000;

@injectable()
export class ResourceSqlDataSourceBootstrap extends Bootstrap {
  private readonly dataSourceStateState = new Map<string, IResourceSqlDataSourceState>();

  constructor(
    private readonly networkStateService: NetworkStateService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly commonDialogService: CommonDialogService,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly notificationService: NotificationService,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly resourceManagerResource: ResourceManagerResource,
    private readonly projectInfoResource: ProjectInfoResource,
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
            !['undefined', 'object'].includes(typeof value.resourceKey)
            || !['string', 'undefined'].includes(typeof value.resourceKey?.name)
            || !['string', 'undefined'].includes(typeof value.resourceKey?.projectId)
            || !['string', 'undefined'].includes(typeof value.resourceKey?.path)
            || !['undefined', 'object'].includes(typeof value.executionContext)
            || !['string', 'undefined'].includes(typeof value.executionContext?.connectionId)
            || !['string', 'undefined'].includes(typeof value.executionContext?.id)
            || !['string', 'undefined'].includes(typeof value.executionContext?.defaultCatalog)
            || !['string', 'undefined'].includes(typeof value.executionContext?.defaultSchema)
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
    this.resourceManagerResource.onItemDelete.addHandler(this.resourceDeleteHandler.bind(this));
    this.resourceManagerResource.onMove.addHandler(this.resourceMoveHandler.bind(this));

    this.sqlDataSourceService.register({
      key: ResourceSqlDataSource.key,
      getDataSource: (editorId, options) => {
        const dataSource = new ResourceSqlDataSource(
          this.resourceManagerResource,
          this.createState(
            editorId,
          )
        );

        if (options?.executionContext) {
          dataSource.setExecutionContext(options.executionContext);
        }

        if (options?.script) {
          dataSource.setScript(options.script);
        }

        if (options?.name) {
          dataSource.setName(options.name);
        }

        dataSource.setActions({
          rename: this.rename.bind(this),
          read: this.read.bind(this),
          write: this.write.bind(this),
          getProperties: this.getProperties.bind(this),
          setProperties: this.setProperties.bind(this),
        });

        dataSource.setInfo({
          isReadonly: (dataSource: ResourceSqlDataSource) => {
            if (!dataSource.resourceKey) {
              return true;
            }

            untracked(() => this.projectInfoResource.load(CachedMapAllKey));
            const project = this.projectInfoResource.get(dataSource.resourceKey.projectId);

            return !this.networkStateService.state || !project?.canEditResources;
          },
        });

        return dataSource;
      },
      onDestroy: (_, editorId) => this.deleteState(editorId),
      onUnload: async dataSource => {
        if (dataSource instanceof ResourceSqlDataSource) {
          await dataSource.write();
        }
      },
      canDestroy: async (dataSource, editorId) => {
        try {
          if (dataSource instanceof ResourceSqlDataSource) {
            await dataSource.write();
          }
        } catch {
          const tab = this.sqlEditorTabService.sqlEditorTabs.find(tab => tab.handlerState.editorId === editorId);
          let name: string | undefined = undefined;

          if (tab) {
            name = getSqlEditorName(tab.handlerState, dataSource);
          }

          const result = await this.commonDialogService.open(ConfirmationDialog, {
            title: 'plugin_sql_editor_navigation_tab_resource_save_script_error_confirmation_title',
            message: 'plugin_sql_editor_navigation_tab_resource_save_script_error_confirmation_message',
            subTitle: name,
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
    resourceKey?: IResourceManagerParams
  ): IResourceSqlDataSourceState {
    let state = this.dataSourceStateState.get(editorId);

    if (!state) {
      state = observable<IResourceSqlDataSourceState>({
        resourceKey,
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

  private resourceMoveHandler(data: IResourceManagerMoveData) {
    if (!this.resourceManagerService.enabled) {
      return;
    }

    const dataSource = this.sqlDataSourceService.dataSources
      .filter(([, dataSource]) => (
        dataSource instanceof ResourceSqlDataSource
      ))
      .map(([,dataSource]) => dataSource as ResourceSqlDataSource)
      .find(ds => ds.resourceKey && isResourceManagerParamEqual(ds.resourceKey, data.from, true));

    dataSource?.setResourceKey(data.to);
  }

  private resourceDeleteHandler(keyObj: ResourceKey<IResourceManagerParams>) {
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

  private async rename(
    dataSource: ResourceSqlDataSource,
    resourceKey: IResourceManagerParams,
    newResourceKey: IResourceManagerParams
  ): Promise<IResourceManagerParams> {
    if (!this.resourceManagerService.enabled) {
      throw new Error('Resource Manager disabled');
    }

    try {
      await this.navResourceNodeService.move(resourceKey, newResourceKey);
      return newResourceKey;
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_sql_editor_navigation_tab_resource_update_script_error');
      throw exception;
    }
  }

  private async write(
    dataSource: ResourceSqlDataSource,
    resourceKey: IResourceManagerParams,
    value: string
  ): Promise<void> {
    if (!this.resourceManagerService.enabled) {
      return;
    }

    try {

      await this.navResourceNodeService.write(resourceKey, value);
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_sql_editor_navigation_tab_resource_update_script_error');
      throw exception;
    }
  }

  private async getProperties(
    dataSource: ResourceSqlDataSource,
    resourceKey: IResourceManagerParams
  ): Promise<Record<string, any>> {
    try {
      const resource = await this.resourceManagerResource.load(resourceKey, ['includeProperties']);

      return resource[0].properties ?? {};
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_sql_editor_navigation_tab_resource_sync_script_error');
      throw exception;
    }
  }

  private async setProperties(
    dataSource: ResourceSqlDataSource,
    resourceKey: IResourceManagerParams,
    diff: Record<string, any>
  ): Promise<Record<string, any>> {
    if (!this.resourceManagerService.enabled) {
      return {};
    }

    try {
      return await this.navResourceNodeService.setProperties(resourceKey, diff);
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_sql_editor_navigation_tab_resource_update_script_error');
      throw exception;
    }
  }

  private async read(dataSource: ResourceSqlDataSource, resourceKey: IResourceManagerParams): Promise<string> {
    try {
      const data = await this.navResourceNodeService.read(resourceKey);
      return data;
    } catch (exception) {
      this.notificationService.logException(exception as any, 'plugin_sql_editor_navigation_tab_resource_sync_script_error');
      throw exception;
    }
  }
}