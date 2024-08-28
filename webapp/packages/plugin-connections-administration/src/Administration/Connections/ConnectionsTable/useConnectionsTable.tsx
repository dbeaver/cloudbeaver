/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { ConfirmationDialogDelete, TableState, useObservableRef, useResource, useTable } from '@cloudbeaver/core-blocks';
import {
  compareConnectionsInfo,
  compareNewConnectionsInfo,
  Connection,
  ConnectionInfoActiveProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
  DBDriverResource,
  IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { isGlobalProject, isSharedProject, ProjectInfoResource, projectInfoSortByName, ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-resource';
import { isArraysEqual, isDefined, isObjectsEqual } from '@cloudbeaver/core-utils';

export interface IConnectionsTableState {
  readonly connections: Connection[];
  readonly keys: IConnectionInfoParams[];
  readonly shouldDisplayProjects: boolean;
  table: TableState<IConnectionInfoParams>;
  loading: boolean;
  getProjectName: (projectId: string) => string | undefined;
  getConnectionIcon: (connection: Connection) => string | undefined;
  update: () => Promise<void>;
  delete: () => Promise<void>;
}

export function useConnectionsTable() {
  const connectionInfoResource = useResource(
    useConnectionsTable,
    ConnectionInfoResource,
    {
      key: ConnectionInfoActiveProjectKey,
      includes: ['customIncludeOptions'],
    },
    { forceSuspense: true },
  );
  const projectInfoResource = useResource(useConnectionsTable, ProjectInfoResource, CachedMapAllKey, { forceSuspense: true });
  const dbDriverResource = useResource(useConnectionsTable, DBDriverResource, CachedMapAllKey, { forceSuspense: true });

  const notificationService = useService(NotificationService);
  const localizationService = useService(LocalizationService);
  const commonDialogService = useService(CommonDialogService);
  const projectService = useService(ProjectsService);

  const table = useTable<IConnectionInfoParams>();

  const state: IConnectionsTableState = useObservableRef(
    () => ({
      get connections() {
        return this.connectionInfoResource.resource
          .get(ConnectionInfoActiveProjectKey)
          .filter((connection): connection is Connection => {
            if (!isDefined(connection)) {
              return false;
            }

            const project = this.projectInfoResource.resource.get(connection.projectId);

            return connection.template && !!project && (isSharedProject(project) || isGlobalProject(project));
          })
          .sort((a, b) => {
            const compareNew = compareNewConnectionsInfo(a, b);
            const projectA = this.projectInfoResource.resource.get(a.projectId);
            const projectB = this.projectInfoResource.resource.get(b.projectId);

            if (compareNew !== 0) {
              return compareNew;
            }

            if (projectA && projectB) {
              const projectSort = projectInfoSortByName(projectA, projectB);

              if (projectSort !== 0) {
                return projectSort;
              }
            }

            return compareConnectionsInfo(a, b);
          });
      },
      get keys() {
        return this.connections.map(createConnectionParam);
      },
      get shouldDisplayProjects() {
        return this.projectService.activeProjects.filter(project => isGlobalProject(project) || isSharedProject(project)).length > 1;
      },
      loading: false,
      getProjectName(projectId: string) {
        return this.projectInfoResource.resource.get(projectId)?.name;
      },
      getConnectionIcon(connection: Connection) {
        return this.dbDriverResource.resource.get(connection.driverId)?.icon;
      },
      async update() {
        if (this.loading) {
          return;
        }
        this.loading = true;
        try {
          await this.connectionInfoResource.resource.refresh(ConnectionInfoActiveProjectKey);
          this.connectionInfoResource.resource.cleanNewFlags();
          this.notificationService.logSuccess({ title: 'connections_administration_tools_refresh_success' });
        } catch (exception: any) {
          this.notificationService.logException(exception, 'connections_administration_tools_refresh_fail');
        } finally {
          this.loading = false;
        }
      },
      async delete() {
        if (this.loading) {
          return;
        }

        const deletionList = Array.from(this.table.selected)
          .filter(([_, value]) => value)
          .map(([connectionId]) => connectionId);

        if (deletionList.length === 0) {
          return;
        }

        const connectionNames = deletionList.map(id => this.connectionInfoResource.resource.get(id)?.name).filter(Boolean);
        const nameList = connectionNames.map(name => `"${name}"`).join(', ');
        const message = `${this.localizationService.translate(
          'connections_administration_delete_confirmation',
        )}${nameList}. ${this.localizationService.translate('ui_are_you_sure')}`;

        const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
          title: 'ui_data_delete_confirmation',
          message,
          confirmActionText: 'ui_delete',
        });

        if (result === DialogueStateResult.Rejected) {
          return;
        }

        this.loading = true;

        try {
          await this.connectionInfoResource.resource.deleteConnection(resourceKeyList(deletionList));
          this.table.unselect();

          for (const id of deletionList) {
            this.table.expand(id, false);
          }
        } catch (exception: any) {
          this.notificationService.logException(exception, 'connections_administration_connection_create_error');
        } finally {
          this.loading = false;
        }
      },
    }),
    {
      connections: computed<Connection[]>({ equals: (a, b) => isArraysEqual(a, b) }),
      keys: computed<IConnectionInfoParams[]>({ equals: (a, b) => isArraysEqual(a, b, isObjectsEqual) }),
      shouldDisplayProjects: computed,
      loading: observable.ref,
      getProjectName: action.bound,
      getConnectionIcon: action.bound,
      update: action.bound,
      delete: action.bound,
    },
    {
      table,
      connectionInfoResource,
      projectInfoResource,
      dbDriverResource,
      notificationService,
      localizationService,
      commonDialogService,
      projectService,
    },
  );

  return state;
}
