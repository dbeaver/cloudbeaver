/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext, useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  TableContext,
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { UserForm } from '../UserForm/UserForm';
import { UserEditController } from './UserEditController';

const styles = composes(
  css`
    box {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    box {
      box-sizing: border-box;
      padding: 24px;
      min-height: 320px;
      max-height: 500px;
      display: flex;
      flex-direction: column;
    }
  `
);

type Props = {
  item: string;
}

export const UserEdit = observer(function UserEdit({
  item,
}: Props) {
  const controller = useController(UserEditController, item);
  const tableContext = useContext(TableContext);
  const collapse = useCallback(() => tableContext?.setItemExpand(item, false), [tableContext]);

  return styled(useStyles(styles))(
    <box as='div'>
      {controller.user && (
        <UserForm user={controller.user} onCancel={collapse} editing/>
      )}
    </box>
  );
});
