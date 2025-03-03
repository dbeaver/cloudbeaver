/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { Loader, s, useS } from '@cloudbeaver/core-blocks';
import { type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { ConnectionFormLoader, useConnectionFormStateRefactored } from '@cloudbeaver/plugin-connections';

import styles from './ConnectionEdit.module.css';
import { FormMode } from '@cloudbeaver/core-ui';

interface Props {
  item: IConnectionInfoParams;
}

export const ConnectionEdit = observer<Props>(function ConnectionEditNew({ item }) {
  const data = useConnectionFormStateRefactored(item, state => {
    state.setMode(FormMode.Edit);
    state.setState({
      ...state.state,
      config: {
        ...state.state.config,
        connectionId: item.connectionId,
      },
      projectId: item.projectId,
      type: 'admin',
    });
  });
  const style = useS(styles);

  const projectId = item.projectId;
  const connectionId = item.connectionId;

  useMemo(() => {
    data.state.config.connectionId = connectionId;
    data.state.projectId = projectId;
  }, [data, projectId, connectionId]);

  return (
    <div className={s(style, { box: true })}>
      <Loader className={s(style, { loader: true })} suspense>
        <ConnectionFormLoader formState={data} />
      </Loader>
    </div>
  );
});
