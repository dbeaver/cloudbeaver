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

import { Loader, useMapResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionForm, useConnectionFormData, IConnectionFormDataOptions, IConnectionFormOptions, IConnectionFormSubmitData } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';

import { PublicConnectionFormService } from './PublicConnectionFormService';

const styles = css`
  Loader {
    height: 100%;
  }
`;

interface Props {
  options: IConnectionFormOptions;
  dataOptions: IConnectionFormDataOptions;
  onCancel: () => void;
  onSave: (config: ConnectionConfig) => void;
}

const PublicConnectionFormRenderer: React.FC<Props> = observer(function PublicConnectionForm({
  options,
  dataOptions,
  onCancel,
  onSave,
}) {
  const connection = useMapResource(ConnectionInfoResource, {
    key: dataOptions.config.connectionId || null,
    includes: ['includeOrigin', 'customIncludeNetworkHandlerCredentials', 'includeAuthProperties', 'customIncludeNetworkHandlerCredentials'],
  });

  const data = useConnectionFormData(dataOptions);

  return styled(styles)(
    <Loader state={connection}>
      {() => (
        <ConnectionForm
          data={data}
          options={options}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}
    </Loader>
  );
});

export const PublicConnectionForm: React.FC = observer(function PublicConnectionForm() {
  const service = useService(PublicConnectionFormService);

  const close = useCallback(() => service.close(), []);
  const save = useCallback(() => service.close(true), []);

  return styled(styles)(
    <Loader loading={service.dataOptions !== null}>
      {() => (
        <PublicConnectionFormRenderer
          dataOptions={service.dataOptions!}
          options={service.options}
          onSave={save}
          onCancel={close}
        />
      )}
    </Loader>
  );
});
