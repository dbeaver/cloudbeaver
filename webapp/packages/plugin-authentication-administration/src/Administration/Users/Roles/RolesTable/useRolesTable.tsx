/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { compareRoles, RoleInfo, RolesResource } from '@cloudbeaver/core-authentication';
import { ILoadableState, TableState, useMapResource, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-sdk';

interface State {
  tableState: TableState;
  processing: boolean;
  roles: RoleInfo[];
  state: ILoadableState;
  update: () => Promise<void>;
  delete: () => Promise<void>;
}

export function useRolesTable(): Readonly<State> {
  const notificationService = useService(NotificationService);
  const dialogService = useService(CommonDialogService);
  const resource = useMapResource(useRolesTable, RolesResource, CachedMapAllKey);

  const translate = useTranslate();

  return useObservableRef<State>(() => ({
    tableState: new TableState(),
    processing: false,
    state: resource,
    get roles() {
      return resource.resource.values.slice().sort(compareRoles);
    },
    async update() {
      if (this.processing) {
        return;
      }

      try {
        this.processing = true;
        await resource.resource.refreshAll();
        notificationService.logSuccess({ title: 'administration_roles_role_list_update_success' });
      } catch (exception: any) {
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

      const roleNames = deletionList.map(name => `"${name}"`).join(', ');
      const message = `${translate('administration_roles_delete_confirmation')}${roleNames}. ${translate('ui_are_you_sure')}`;
      const result = await dialogService.open(ConfirmationDialogDelete, {
        title: 'ui_data_delete_confirmation',
        message,
        confirmActionText: 'ui_delete',
      });

      if (result === DialogueStateResult.Rejected) {
        return;
      }

      try {
        this.processing = true;
        await resource.resource.deleteRole(resourceKeyList(deletionList));

        this.tableState.unselect();
        this.tableState.unexpand(deletionList);
      } catch (exception: any) {
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
