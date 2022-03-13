/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useRef, useEffect, useContext, useCallback } from 'react';
import styled, { css } from 'reshadow';

import { RolesResource } from '@cloudbeaver/core-authentication';
import { TableContext } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { RoleForm } from '../RoleForm';
import { useRoleFormState } from '../useRoleFormState';

const styles = css`
    box {
      composes: theme-background-secondary theme-text-on-secondary from global;
      box-sizing: border-box;
      padding-bottom: 24px;
      display: flex;
      flex-direction: column;
      height: 664px;
    }
  `;

interface Props {
  item: string;
}

export const RoleEdit = observer<Props>(function RoleEdit({
  item,
}) {
  const resource = useService(RolesResource);
  const boxRef = useRef<HTMLDivElement>(null);
  const tableContext = useContext(TableContext);

  const collapse = useCallback(() => {
    tableContext?.setItemExpand(item, false);
  }, [tableContext, item]);

  useEffect(() => {
    boxRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, []);

  const data = useRoleFormState(
    resource,
    state => state.setOptions('edit')
  );

  data.config.roleId = item;

  return styled(useStyles(styles))(
    <box ref={boxRef} as='div'>
      <RoleForm
        state={data}
        onCancel={collapse}
      />
    </box>
  );
});
