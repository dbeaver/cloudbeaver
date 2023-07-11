/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Loader } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ConnectionFormLoader, useConnectionFormState } from '@cloudbeaver/plugin-connections';

const styles = css`
  box {
    composes: theme-background-secondary theme-text-on-secondary from global;
    box-sizing: border-box;
    padding-bottom: 24px;
    display: flex;
    flex-direction: column;
    height: 740px;
  }
  Loader {
    height: 100%;
  }
`;

interface Props {
  item: IConnectionInfoParams;
}

export const ConnectionEdit = observer<Props>(function ConnectionEditNew({ item }) {
  const connectionInfoResource = useService(ConnectionInfoResource);
  // const tableContext = useContext(TableContext);
  // const collapse = useCallback(() => tableContext?.setItemExpand(item, false), [tableContext, item]);

  const data = useConnectionFormState(connectionInfoResource, state => state.setOptions('edit', 'admin'));

  data.config.connectionId = item.connectionId;
  data.projectId = item.projectId;

  return styled(styles)(
    <box>
      <Loader suspense>
        <ConnectionFormLoader
          state={data}
          // onCancel={collapse}
          // onSave={collapse}
        />
      </Loader>
    </box>,
  );
});
