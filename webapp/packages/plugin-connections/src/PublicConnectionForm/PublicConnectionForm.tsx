/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { Loader, s, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { ConnectionFormLoader } from '../ConnectionForm/ConnectionFormLoader.js';
import styles from './PublicConnectionForm.module.css';
import { PublicConnectionFormService } from './PublicConnectionFormService.js';

export const PublicConnectionForm: React.FC = observer(function PublicConnectionForm() {
  const service = useService(PublicConnectionFormService);
  const style = useS(styles);

  const close = useCallback(() => service.close(true), []);
  const save = useCallback(() => service.save(), []);

  return (
    <Loader className={s(style, { loader: true })} loading={service.formState === null}>
      {() =>
        service.formState && (
          <ConnectionFormLoader
            // key={service.formState.id}
            state={service.formState}
            onSave={save}
            onCancel={close}
          />
        )
      }
    </Loader>
  );
});
