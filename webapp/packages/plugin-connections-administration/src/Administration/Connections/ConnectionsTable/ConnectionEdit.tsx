/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useRef, useEffect } from 'react';
import styled, { css } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';
import { ConnectionForm, useConnectionFormState } from '@cloudbeaver/plugin-connections';

import { ConnectionsResource } from '../../ConnectionsResource';

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

export const ConnectionEdit = observer<Props>(function ConnectionEditNew({
  item,
}) {
  const connectionsResource = useService(ConnectionsResource);
  const boxRef = useRef<HTMLDivElement>(null);
  // const tableContext = useContext(TableContext);
  // const collapse = useCallback(() => tableContext?.setItemExpand(item, false), [tableContext, item]);

  useEffect(() => {
    boxRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, []);

  const data = useConnectionFormState(
    connectionsResource,
    state => state.setOptions('edit', 'admin')
  );

  data.config.connectionId = item;

  return styled(useStyles(styles))(
    <box ref={boxRef} as='div'>
      <ConnectionForm
        state={data}
        // onCancel={collapse}
        // onSave={collapse}
      />
    </box>
  );
});
