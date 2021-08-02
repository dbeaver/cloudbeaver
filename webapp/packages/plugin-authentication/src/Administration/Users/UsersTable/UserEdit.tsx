/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useCallback, useEffect, useRef } from 'react';
import styled, { css } from 'reshadow';

import {
  Loader,
  TableContext
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
      padding-bottom: 24px;
      min-height: 420px;
      max-height: 520px;
      display: flex;
      flex-direction: column;
    }
  `
);

interface Props {
  item: string;
}

export const UserEdit = observer(function UserEdit({
  item,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const controller = useController(UserEditController, item);
  const tableContext = useContext(TableContext);
  const collapse = useCallback(() => tableContext?.setItemExpand(item, false), [tableContext]);

  useEffect(() => {
    boxRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, []);

  return styled(useStyles(styles))(
    <box ref={boxRef} as='div'>
      {controller.user ? (
        <UserForm user={controller.user} editing onCancel={collapse} />
      ) : <Loader />}
    </box>
  );
});
