/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import styled, { css } from 'reshadow';

import { UsersResource } from '@cloudbeaver/core-authentication';
import { Loader, TableContext, useResource } from '@cloudbeaver/core-blocks';
import type { AdminUserInfo } from '@cloudbeaver/core-sdk';

import { UserForm } from '../UserForm/UserForm';

const styles = css`
  box {
    composes: theme-background-secondary theme-text-on-secondary from global;
    box-sizing: border-box;
    padding-bottom: 24px;
    height: 560px;
    display: flex;
    flex-direction: column;
  }
`;

interface Props {
  item: string;
}

export const UserEdit = observer<Props>(function UserEdit({ item }) {
  const user = useResource(UserEdit, UsersResource, { key: item, includes: ['includeMetaParameters'] });
  const tableContext = useContext(TableContext);
  const collapse = useCallback(() => tableContext?.setItemExpand(item, false), [tableContext]);

  return styled(styles)(<box>{user.data ? <UserForm user={user.data as AdminUserInfo} editing onCancel={collapse} /> : <Loader />}</box>);
});
