/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  Table,
  TableHeader,
  TableColumnHeader,
  TableBody,
  TableItem,
  TableColumnValue,
  TableItemSelect,
  TextPlaceholder,
  Loader,
  useTab
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionFormController } from '../ConnectionFormController';
import { IConnectionFormModel } from '../IConnectionFormModel';
import { Controller } from './Controller';

const styles = composes(
  css`
    Table {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    box {
      position: relative;
      display: flex;
      flex: 1;
    }
    Table {
      flex: 1;
    }
    TableColumnHeader {
      border-top: solid 1px;
    }
  `
);

interface Props {
  tabId: string;
  model: IConnectionFormModel;
  controller: ConnectionFormController;
  className?: string;
}

export const ConnectionAccess = observer(function ConnectionAccess({
  tabId,
  model,
  controller: formController,
  className,
}: Props) {
  const style = useStyles(styles);
  const controller = useController(Controller, model, formController);
  const { selected } = useTab(tabId, controller.load);
  const translate = useTranslate();
  const disabled = controller.isLoading;

  const handleSelect = useCallback((item: string, state: boolean) => {
    controller.select(item, state);
    controller.change();
  }, [controller]);

  if (!selected) {
    return null;
  }

  if (controller.isLoading) {
    return styled(style)(
      <box as='div'>
        <Loader />
      </box>
    );
  }

  if (!model.grantedSubjects || (controller.users.length === 0 && controller.roles.length)) {
    return styled(style)(
      <box as='div'>
        <TextPlaceholder>{translate('connections_administration_connection_access_empty')}</TextPlaceholder>
      </box>
    );
  }

  return styled(style)(
    <box as='div'>
      <Table selectedItems={controller.selectedSubjects} className={className} onSelect={handleSelect}>
        <TableHeader>
          <TableColumnHeader min />
          <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
          <TableColumnHeader />
        </TableHeader>
        <TableBody>
          {controller.roles.map(role => (
            <TableItem key={role.roleId} item={role.roleId} selectDisabled={disabled}>
              <TableColumnValue centerContent flex>
                <TableItemSelect disabled={disabled} />
              </TableColumnValue>
              <TableColumnValue>{role.roleName}</TableColumnValue>
              <TableColumnValue />
            </TableItem>
          ))}
          {controller.users.map(user => (
            <TableItem key={user.userId} item={user.userId} selectDisabled={disabled}>
              <TableColumnValue centerContent flex>
                <TableItemSelect disabled={disabled} />
              </TableColumnValue>
              <TableColumnValue>{user.userId}</TableColumnValue>
              <TableColumnValue />
            </TableItem>
          ))}
        </TableBody>
      </Table>
      <Loader loading={controller.isLoading} overlay />
    </box>
  );
});
