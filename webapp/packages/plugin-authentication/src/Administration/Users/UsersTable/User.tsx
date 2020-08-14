/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css, use } from 'reshadow';

import { UsersResource } from '@cloudbeaver/core-authentication';
import {
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { AdminUserInfo } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { UserEdit } from './UserEdit';

type Props = {
  user: AdminUserInfo;
}

export const User = observer(function User({ user }: Props) {
  const translate = useTranslate();
  const usersResource = useService(UsersResource);
  const isNew = usersResource.isNew(user.userId);

  return styled(useStyles())(
    <TableItem item={user.userId} expandElement={UserEdit}>
      <TableColumnValue centerContent flex>
        <TableItemSelect />
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue>{isNew ? translate('authentication_administration_user_connections_user_new') : user.userId}</TableColumnValue>
      <TableColumnValue>{user.grantedRoles.join(', ')}</TableColumnValue>
      <TableColumnValue align='right'>{isNew && <tag as='div' {...use({ mod: 'positive' })}>{translate('ui_tag_new')}</tag>}</TableColumnValue>
    </TableItem>
  );
});
