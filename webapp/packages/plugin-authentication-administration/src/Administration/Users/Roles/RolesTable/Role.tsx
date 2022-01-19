/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import type { RoleInfo } from '@cloudbeaver/core-authentication';
import { TableItem, TableColumnValue, TableItemSelect, TableItemExpand, Placeholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { RolesAdministrationService } from '../RolesAdministrationService';
import { RoleEdit } from './RoleEdit';

const styles = css`
  StaticImage {
    display: flex;
    width: 24px;

    &:not(:last-child) {
      margin-right: 16px;
    }
  }
  TableColumnValue[expand] {
    cursor: pointer;
  }
  TableColumnValue[|gap] {
    gap: 16px;
  }
`;

interface Props {
  role: RoleInfo;
}

export const Role = observer<Props>(function Role({ role }) {
  const service = useService(RolesAdministrationService);

  return styled(useStyles(styles))(
    <TableItem item={role.roleId} expandElement={RoleEdit}>
      <TableColumnValue centerContent flex>
        <TableItemSelect />
      </TableColumnValue>
      <TableColumnValue centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue title={role.roleId} ellipsis expand>{role.roleId}</TableColumnValue>
      <TableColumnValue title={role.roleName} ellipsis>{role.roleName || ''}</TableColumnValue>
      <TableColumnValue title={role.description} ellipsis>{role.description || ''}</TableColumnValue>
      <TableColumnValue flex {...use({ gap: true })}>
        <Placeholder container={service.roleDetailsInfoPlaceholder} role={role} />
      </TableColumnValue>
    </TableItem>
  );
});
