/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useCallback, useRef, useEffect } from 'react';
import styled, { css } from 'reshadow';

import { Loader, TableContext } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionForm } from '../ConnectionForm/ConnectionForm';
import type { IConnectionFormModel } from '../ConnectionForm/IConnectionFormModel';
import { ConnectionEditController } from './ConnectionEditController';

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
      min-height: 440px;
      max-height: 500px;
      display: flex;
      flex-direction: column;
    }
  `
);

interface Props {
  item: string;
}

export const ConnectionEdit = observer(function ConnectionEdit({
  item,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const tableContext = useContext(TableContext);
  const collapse = useCallback(() => tableContext?.setItemExpand(item, false), [tableContext, item]);
  const controller = useController(ConnectionEditController, item);

  useEffect(() => {
    boxRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, []);

  return styled(useStyles(styles))(
    <box ref={boxRef} as='div'>
      {controller.connection ? (
        <ConnectionForm
          model={controller as IConnectionFormModel}
          onBack={collapse}
          onCancel={collapse}
        />
      ) : <Loader />}
    </box>
  );
});
