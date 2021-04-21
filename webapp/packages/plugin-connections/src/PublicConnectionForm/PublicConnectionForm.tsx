/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled from 'reshadow';
import { css } from 'reshadow';

import { Loader } from '@cloudbeaver/core-blocks';
import { ConnectionForm } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';

import { PublicConnectionFormService } from './PublicConnectionFormService';

const styles = css`
  Loader {
    height: 100%;
  }
`;

export const PublicConnectionForm: React.FC = observer(function PublicConnectionForm() {
  const service = useService(PublicConnectionFormService);

  const close = useCallback(() => service.close(true), []);
  const save = useCallback(() => service.close(true), []);

  return styled(styles)(
    <Loader loading={service.formState === null}>
      {() => service.formState && (
        <ConnectionForm
          state={service.formState}
          onSave={save}
          onCancel={close}
        />
      )}
    </Loader>
  );
});
