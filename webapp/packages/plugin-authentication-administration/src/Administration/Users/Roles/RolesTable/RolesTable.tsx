/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import type { RoleInfo } from '@cloudbeaver/core-authentication';
import { Table, TableHeader, TableColumnHeader, TableBody, TableSelect, Loader, ILoadableState } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { Role } from './Role';

const styles = css`
  Table {
    width: 100%;
  }
`;

const loaderStyle = css`
  ExceptionMessage {
    padding: 24px;
  }
`;

interface Props {
  roles: RoleInfo[];
  state: ILoadableState;
  selectedItems: Map<string, boolean>;
  expandedItems: Map<string, boolean>;
}

export const RolesTable = observer<Props>(function RolesTable({ roles, state, selectedItems, expandedItems }) {
  const translate = useTranslate();
  const keys = roles.map(role => role.roleId);

  return styled(useStyles(styles))(
    <Loader state={state} style={loaderStyle} overlay>
      <Table keys={keys} selectedItems={selectedItems} expandedItems={expandedItems} size='big'>
        <TableHeader>
          <TableColumnHeader min flex centerContent>
            <TableSelect />
          </TableColumnHeader>
          <TableColumnHeader min />
          <TableColumnHeader>{translate('administration_roles_role_id')}</TableColumnHeader>
          <TableColumnHeader>{translate('administration_roles_role_name')}</TableColumnHeader>
          <TableColumnHeader>{translate('administration_roles_role_description')}</TableColumnHeader>
          <TableColumnHeader />
        </TableHeader>
        <TableBody>
          {roles.map(role => (
            <Role key={role.roleId} role={role} />
          ))}
        </TableBody>
      </Table>
    </Loader>
  );
});
