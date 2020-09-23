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
  Table, TableHeader, TableColumnHeader, TableBody, TableItem, TableColumnValue, TableItemSelect, TextPlaceholder
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { IConnectionFormModel } from '../IConnectionFormModel';
import { Controller } from './Controller';

const styles = composes(
  css`
    box {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    box {
      flex: 1;
    }
    TableColumnHeader {
      border-top: solid 1px;
    }
  `
);

type Props = {
  model: IConnectionFormModel;
  disabled: boolean;
  onChange?: () => void;
  className?: string;
}

export const ConnectionAccess = observer(function ConnectionAccess({
  model,
  disabled,
  onChange,
  className,
}: Props) {
  if (!model.grantedSubjects) {
    return null;
  }

  const style = useStyles(styles);
  const controller = useController(Controller, model);
  const translate = useTranslate();

  const handleSelect = useCallback((item: string, state: boolean) => {
    controller.onSelect(item, state);
    if (onChange) {
      onChange();
    }
  }, [onChange, controller]);

  if (controller.users.length === 0 && controller.roles.length) {
    return <TextPlaceholder>{translate('authentication_administration_user_connections_empty')}</TextPlaceholder>;
  }

  return styled(style)(
    <box as='div'>
      <Table selectedItems={controller.selectedSubjects} onSelect={handleSelect} className={className}>
        <TableHeader>
          <TableColumnHeader min/>
          <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
          <TableColumnHeader></TableColumnHeader>
        </TableHeader>
        <TableBody>
          {controller.roles.map(role => (
            <TableItem key={role.roleId} item={role.roleId} selectDisabled={disabled}>
              <TableColumnValue centerContent flex>
                <TableItemSelect disabled={disabled}/>
              </TableColumnValue>
              <TableColumnValue>{role.roleName}</TableColumnValue>
              <TableColumnValue></TableColumnValue>
            </TableItem>
          ))}
          {controller.users.map(user => (
            <TableItem key={user.userId} item={user.userId} selectDisabled={disabled}>
              <TableColumnValue centerContent flex>
                <TableItemSelect disabled={disabled}/>
              </TableColumnValue>
              <TableColumnValue>{user.userId}</TableColumnValue>
              <TableColumnValue></TableColumnValue>
            </TableItem>
          ))}
        </TableBody>
      </Table>
    </box>
  );
});
