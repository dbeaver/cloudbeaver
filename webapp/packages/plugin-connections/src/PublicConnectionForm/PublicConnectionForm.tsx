/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import styled from 'reshadow';
import { css } from 'reshadow';

import { Loader, useMapResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, IConnectionFormData, IConnectionFormOptions, ConnectionForm } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { PublicConnectionFormService } from './PublicConnectionFormService';

const styles = css`
  Loader {
    height: 100%;
  }
`;

export const PublicConnectionForm: React.FC = observer(function PublicConnectionForm() {
  const service = useService(PublicConnectionFormService);
  const connection = useMapResource(ConnectionInfoResource, {
    key: service.connectionId,
    includes: ['includeOrigin', 'customIncludeNetworkHandlerCredentials', 'includeAuthProperties', 'customIncludeNetworkHandlerCredentials'],
  });

  const [data] = useState<IConnectionFormData>(() => ({
    config: observable({}),
    get info() {
      return connection.data;
    },
    resource: connection.resource,
    partsState: new MetadataMap<string, any>(),
  }));

  const [options] = useState<IConnectionFormOptions>(() => ({
    mode: 'edit',
    type: 'public',
  }));

  const close = useCallback(() => service.close(), []);

  return styled(styles)(
    <Loader state={connection}>
      {() => (
        <ConnectionForm
          data={data}
          options={options}
          onCancel={close}
          onSave={close}
        />
      )}
    </Loader>
  );
});
