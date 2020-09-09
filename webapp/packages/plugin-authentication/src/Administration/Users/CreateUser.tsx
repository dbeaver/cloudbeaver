/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { Translate } from '@cloudbeaver/core-localization';
import { AdminUserInfo } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { UserForm } from './UserForm/UserForm';

type Props = {
 user: AdminUserInfo;
 onCancel: () => void;
}

const styles = composes(
  css`
    title-bar {
      composes: theme-border-color-background from global;
    }
  `,
  css`
    title-bar {
      composes: theme-typography--headline6 from global;
      box-sizing: border-box;
      padding: 16px 24px;
      border-top: solid 1px;
      align-items: center;
      display: flex;
      font-weight: 400;
      flex: auto 0 0;
    }
  `
);

export function CreateUser({
  user,
  onCancel,
}: Props) {

  return styled(useStyles(styles))(
    <user-create as='div'>
      <title-bar as='div'><Translate token='authentication_administration_user_connections_user_add'/></title-bar>
      <UserForm user={user} onCancel={onCancel} />
    </user-create>
  );
}
