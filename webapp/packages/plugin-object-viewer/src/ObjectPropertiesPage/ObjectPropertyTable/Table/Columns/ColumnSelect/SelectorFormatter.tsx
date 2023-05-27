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

import { Checkbox, getComputed } from '@cloudbeaver/core-blocks';
import type { DBObject } from '@cloudbeaver/core-navigation-tree';
import type { FormatterProps } from '@cloudbeaver/plugin-react-data-grid';

import { TableContext } from '../../TableContext';

const styles = css`
  container {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
  }
  Checkbox {
    margin-left: -10px;
    margin-right: -10px;
  }
`;

export const SelectorFormatter = observer<FormatterProps<DBObject>>(function SelectorFormatter(props) {
  const context = useContext(TableContext);
  const id = props.row.id;
  const selected = getComputed(() => context.tableState?.selected.get(id));

  const select = useCallback(() => {
    context.tableState?.selected.set(id, !selected);
  }, [id, selected]);

  return styled(styles)(
    <container>
      <Checkbox checked={selected} onClick={select} />
    </container>,
  );
});
