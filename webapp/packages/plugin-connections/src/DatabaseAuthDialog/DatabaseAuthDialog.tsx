/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { CommonDialogHeader, CommonDialogWrapper, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionPublicSecretsResource, DBDriverResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';

import { DatabaseCredentialsAuthDialog } from './DatabaseCredentialsAuthDialog/DatabaseCredentialsAuthDialog.js';
import { DatabaseSecretAuthDialog } from './DatabaseSecretAuthDialog/DatabaseSecretAuthDialog.js';

interface Payload {
  connection: IConnectionInfoParams;
  networkHandlers: string[];
  resetCredentials?: boolean;
}

export const DatabaseAuthDialog: DialogComponent<Payload> = observer(function DatabaseAuthDialog({ payload, options, rejectDialog, resolveDialog }) {
  const connectionInfoLoader = useResource(DatabaseAuthDialog, ConnectionInfoResource, {
    key: payload.connection,
    includes: ['includeAuthNeeded', 'includeNetworkHandlersConfig', 'includeCredentialsSaved'],
  });
  const driverLoader = useResource(DatabaseAuthDialog, DBDriverResource, connectionInfoLoader.data?.driverId || null);
  const connectionPublicSecretsLoader = useResource(DatabaseSecretAuthDialog, ConnectionPublicSecretsResource, payload.connection);
  const useSharedCredentials = (connectionPublicSecretsLoader.data?.length || 0) > 1;

  const subtitle = connectionInfoLoader.data?.name;

  return (
    <CommonDialogWrapper size="large" fixedSize={useSharedCredentials}>
      <CommonDialogHeader
        title="connections_database_authentication"
        subTitle={subtitle}
        icon={driverLoader.data?.icon}
        onReject={options?.persistent ? undefined : rejectDialog}
      />
      {useSharedCredentials ? (
        <DatabaseSecretAuthDialog connectionKey={payload.connection} onLogin={resolveDialog} />
      ) : (
        <DatabaseCredentialsAuthDialog
          connection={payload.connection}
          networkHandlers={payload.networkHandlers}
          resetCredentials={payload.resetCredentials}
          onLogin={resolveDialog}
        />
      )}
    </CommonDialogWrapper>
  );
});
