/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { Translate } from '@cloudbeaver/core-localization';
import type { AdminUserInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { UserForm } from '../UserForm/UserForm';

const styles = css`

    user-create-footer, user-create-content {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
    user-create {
      display: flex;
      flex-direction: column;
      height: 540px;
      overflow: hidden;
    }

    title-bar {
      composes: theme-border-color-background theme-typography--headline6 from global;
      box-sizing: border-box;
      padding: 16px 24px;
      align-items: center;
      display: flex;
      font-weight: 400;
      flex: auto 0 0;
    }

    user-create-content {
      position: relative;
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: auto;
    }
  `;

interface Props {
  user: AdminUserInfo;
  onCancel: () => void;
}

export const CreateUser: React.FC<Props> = function CreateUser({
  user,
  onCancel,
}) {
  return styled(useStyles(styles))(
    <user-create>
      <title-bar><Translate token='authentication_administration_user_connections_user_add' /></title-bar>
      <user-create-content>
        <UserForm user={user} onCancel={onCancel} />
      </user-create-content>
    </user-create>
  );
};
