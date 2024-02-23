/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import {
  CommonDialogBody,
  CommonDialogFooter,
  ExceptionMessage,
  Group,
  ItemList,
  ListItem,
  ListItemName,
  Loader,
  useObservableRef,
  useResource,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';

interface Props {
  connectionKey: IConnectionInfoParams;
  onLogin?: () => void;
}

export const DatabaseSecretAuthDialog = observer<Props>(function DatabaseSecretAuthDialog({ connectionKey, onLogin }) {
  const connectionInfoLoader = useResource(DatabaseSecretAuthDialog, ConnectionInfoResource, {
    key: connectionKey,
    includes: ['includeAuthNeeded', 'includeSharedSecrets', 'includeNetworkHandlersConfig', 'includeCredentialsSaved'],
  });
  const state = useObservableRef(
    () => ({
      exception: null as Error | null,
      authenticating: false,
    }),
    {
      exception: observable.ref,
      authenticating: observable.ref,
    },
    false,
  );
  const secrets = connectionInfoLoader.data?.sharedSecrets || [];

  async function handleSecretSelect(secretId: string) {
    try {
      state.authenticating = true;
      await connectionInfoLoader.resource.init({
        ...connectionKey,
        selectedSecretId: secretId,
      });
      state.exception = null;
      onLogin?.();
    } catch (exception: any) {
      state.exception = exception;
    } finally {
      state.authenticating = false;
    }
  }

  if (state.authenticating) {
    return <Loader loader />;
  }

  return (
    <>
      <CommonDialogBody noBodyPadding>
        <ItemList>
          {secrets.map(secret => (
            <ListItem key={secret.secretId} onClick={() => handleSecretSelect(secret.secretId)}>
              <ListItemName>{secret.displayName}</ListItemName>
            </ListItem>
          ))}
        </ItemList>
      </CommonDialogBody>
      {state.exception && (
        <CommonDialogFooter>
          <Group secondary vertical dense>
            <ExceptionMessage exception={state.exception} inline />
          </Group>
        </CommonDialogFooter>
      )}
    </>
  );
});
