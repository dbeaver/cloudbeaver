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
import { ConnectionInfoOriginResource, ConnectionInfoResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ConnectionFormLoader, useConnectionFormState } from '@cloudbeaver/plugin-connections';

import styles from './ConnectionEdit.module.css';

interface Props {
  item: IConnectionInfoParams;
}

export const ConnectionEdit = observer<Props>(function ConnectionEditNew({ item }) {
  const connectionInfoResource = useService(ConnectionInfoResource);
  const connectionInfoOriginResource = useService(ConnectionInfoOriginResource);
  // const tableContext = useContext(TableContext);
  // const collapse = useCallback(() => tableContext?.setItemExpand(item, false), [tableContext, item]);

  const data = useConnectionFormState(connectionInfoResource, connectionInfoOriginResource, state => state.setOptions('edit', 'admin'));
  const style = useS(styles);

  const projectId = item.projectId;
  const connectionId = item.connectionId;

  useMemo(() => {
    data.setConfig(projectId, { connectionId });
  }, [data, projectId, connectionId]);

  return (
    <div className={s(style, { box: true })}>
      <Loader className={s(style, { loader: true })} suspense>
        <ConnectionFormLoader
          state={data}
          // onCancel={collapse}
          // onSave={collapse}
        />
      </Loader>
    </div>
  );
});
