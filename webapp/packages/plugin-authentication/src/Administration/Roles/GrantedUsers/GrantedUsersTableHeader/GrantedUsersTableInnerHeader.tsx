/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { TableColumnHeader, TableHeader } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

interface Props {
  className?: string;
}

const styles = composes(
  css`
    TableHeader {
      composes: theme-background-surface from global;
    }
  `,
  css`
    TableHeader {
      position: sticky;
      top: 0;
      z-index: 1;
    }
  `
);

export const GrantedUsersTableInnerHeader = observer<Props>(function GrantedUsersTableInnerHeader({ className }) {
  const translate = useTranslate();
  return styled(useStyles(styles))(
    <TableHeader className={className}>
      <TableColumnHeader min />
      <TableColumnHeader min />
      <TableColumnHeader>{translate('administration_roles_role_granted_users_user_id')}</TableColumnHeader>
    </TableHeader>
  );
});
