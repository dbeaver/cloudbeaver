/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Loader, s, useS } from '@cloudbeaver/core-blocks';
import { type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { ConnectionFormLoader, useConnectionFormState } from '@cloudbeaver/plugin-connections';

import styles from './ConnectionEdit.module.css';
import { FormMode } from '@cloudbeaver/core-ui';
import { runInAction } from 'mobx';

interface Props {
  item: IConnectionInfoParams;
}

export const ConnectionEdit = observer<Props>(function ConnectionEditNew({ item }) {
  const data = useConnectionFormState(item, state => {
    state.setMode(FormMode.Edit);

    runInAction(() => {
      state.state.connectionId = item.connectionId;
      state.state.projectId = item.projectId;
      state.state.type = 'admin';
    });
  });
  const style = useS(styles);

  return (
    <div className={s(style, { box: true })}>
      <Loader className={s(style, { loader: true })} suspense>
        <ConnectionFormLoader formState={data} />
      </Loader>
    </div>
  );
});
