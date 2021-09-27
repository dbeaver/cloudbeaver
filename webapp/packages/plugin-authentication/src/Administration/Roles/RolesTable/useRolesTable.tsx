/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { compareRoles, RoleInfo, RolesResource } from '@cloudbeaver/core-authentication';
import { TableState, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

interface State {
  tableState: TableState;
  processing: boolean;
  roles: RoleInfo[];
  update: () => Promise<void>;
  delete: () => Promise<void>;
}

export function useRolesTable(): Readonly<State> {
  const notificationService = useService(NotificationService);
  const dialogService = useService(CommonDialogService);
  const resource = useService(RolesResource);

  return useObservableRef<State>(() => ({
    tableState: new TableState(),
    processing: false,
    get roles() {
      return resource.values.slice().sort(compareRoles);
    },
    async update() {
      if (this.processing) {
        return;
      }

      try {
        this.processing = true;
        await resource.refreshAll();
        notificationService.logSuccess({ title: 'administration_roles_role_list_update_success' });
      } catch (exception) {
        notificationService.logException(exception, 'administration_roles_role_list_update_fail');
      } finally {
        this.processing = false;
      }
    },
    async delete() {
      if (this.processing) {
        return;
      }

      const deletionList = this.tableState.selectedList;

      if (deletionList.length === 0) {
        return;
      }

      const result = await dialogService.open(ConfirmationDialog, {
        title: 'ui_data_delete_confirmation',
        message: `You're going to delete these roles: ${deletionList.map(name => `"${name}"`).join(', ')}. Are you sure?`,
        confirmActionText: 'ui_delete',
      });

      if (result === DialogueStateResult.Rejected) {
        return;
      }

      try {
        this.processing = true;
        await resource.deleteRole(resourceKeyList(deletionList));

        this.tableState.unselect();
        this.tableState.unexpand(deletionList);
      } catch (exception) {
        notificationService.logException(exception, 'Roles delete Error');
      } finally {
        this.processing = false;
      }
    },
  }), {
    processing: observable.ref,
    roles: computed,
  }, false, ['update', 'delete']);
}
