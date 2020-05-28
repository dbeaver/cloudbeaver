/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { AdministrationTools } from '@dbeaver/administration';
import { Loader, IconButton } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { useStyles, composes } from '@dbeaver/core/theming';

import { UsersManagerService } from '../UsersManagerService';
import { UsersTable } from './UsersTable/UsersTable';

const styles = composes(
  css`
    AdministrationTools {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    content {
      position: relative;
      padding-top: 16px;
      flex: 1;
      overflow: auto;
    }
    TableColumnHeader {
      border-top: solid 1px;
    }
    AdministrationTools {
      display: flex;
      padding: 0 16px;
      align-items: center;
    }
    IconButton {
      height: 32px;
      width: 32px;
      margin-right: 16px;
    }
  `
);

export const UsersAdministration = observer(function UsersAdministration() {
  const usersManagerService = useService(UsersManagerService);

  return styled(useStyles(styles))(
    <>
      <AdministrationTools>
        <IconButton name="add" viewBox="0 0 28 28" />
        <IconButton name="trash" viewBox="0 0 28 28" />
      </AdministrationTools>
      <content as='div'>
        <UsersTable users={usersManagerService.users.data}/>
        {usersManagerService.users.isLoading() && <Loader overlay/>}
      </content>
    </>
  );
});
