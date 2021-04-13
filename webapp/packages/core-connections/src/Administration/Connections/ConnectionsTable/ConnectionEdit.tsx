/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useCallback, useRef, useEffect } from 'react';
import styled, { css } from 'reshadow';

import { Loader, TableContext, useMapResource } from '@cloudbeaver/core-blocks';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionForm } from '../../../ConnectionForm/ConnectionForm';
import { useConnectionFormState } from '../../../ConnectionForm/useConnectionFormState';
import { ConnectionsResource } from '../../ConnectionsResource';

const styles = composes(
  css`
    box {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    box {
      box-sizing: border-box;
      padding: 24px 0;
      display: flex;
      flex-direction: column;
      height: 640px;
    }
  `
);

interface Props {
  item: string;
}

export const ConnectionEdit = observer(function ConnectionEditNew({
  item,
}: Props) {
  const connection = useMapResource(ConnectionsResource, { key: item, includes: ['customIncludeNetworkHandlerCredentials'] });
  const boxRef = useRef<HTMLDivElement>(null);
  const tableContext = useContext(TableContext);
  const collapse = useCallback(() => tableContext?.setItemExpand(item, false), [tableContext, item]);

  useEffect(() => {
    boxRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, []);

  const data = useConnectionFormState(
    connection.resource,
    state => state.setOptions('edit', 'admin')
  );

  data.config.connectionId = item;

  return styled(useStyles(styles))(
    <box ref={boxRef} as='div'>
      <Loader state={connection}>
        {() => (
          <ConnectionForm
            state={data}
            onCancel={collapse}
            // onSave={collapse}
          />
        )}
      </Loader>
    </box>
  );
});
