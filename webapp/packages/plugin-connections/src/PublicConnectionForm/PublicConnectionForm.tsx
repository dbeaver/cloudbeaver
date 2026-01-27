/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { ColoredContainer, Loader, s, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { ConnectionFormLoader } from '../ConnectionForm/ConnectionFormLoader.js';
import styles from './PublicConnectionForm.module.css';
import { PublicConnectionFormService } from './PublicConnectionFormService.js';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';

export const PublicConnectionForm: React.FC = observer(function PublicConnectionForm() {
  const service = useService(PublicConnectionFormService);
  const style = useS(styles);

  const close = useCallback(() => service.close(true), []);
  const save = useCallback(async (state: ConnectionConfig, isCreate?: boolean) => {
    if (isCreate) {
      await service.close(true);
    }
    await service.save();
  }, []);

  return (
    <ColoredContainer className={s(style, { loader: true })}>
      <Loader className={s(style, { loader: true })} suspense>
        {service.formState && <ConnectionFormLoader formState={service.formState} onSave={save} onCancel={close} />}
      </Loader>
    </ColoredContainer>
  );
});
