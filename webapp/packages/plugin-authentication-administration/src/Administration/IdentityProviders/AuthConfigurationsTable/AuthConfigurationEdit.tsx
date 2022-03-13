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

import { AuthConfigurationsResource } from '@cloudbeaver/core-authentication';
import { TableContext } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { AuthConfigurationForm } from '../AuthConfigurationForm';
import { useAuthConfigurationFormState } from '../useAuthConfigurationFormState';

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

export const AuthConfigurationEdit = observer<Props>(function AuthConfigurationEdit({
  item,
}) {
  const resource = useService(AuthConfigurationsResource);
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

  const data = useAuthConfigurationFormState(
    resource,
    state => state.setOptions('edit')
  );

  data.config.id = item;

  return styled(useStyles(styles))(
    <box ref={boxRef} as='div'>
      <AuthConfigurationForm
        state={data}
        onCancel={collapse}
      />
    </box>
  );
});
