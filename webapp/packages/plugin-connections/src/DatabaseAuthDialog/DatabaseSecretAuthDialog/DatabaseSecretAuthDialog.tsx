/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
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
  s,
  useObservableRef,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionPublicSecretsResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';

import style from './DatabaseSecretAuthDialog.module.css';

interface Props {
  connectionKey: IConnectionInfoParams;
  onLogin?: () => void;
}

export const DatabaseSecretAuthDialog = observer<Props>(function DatabaseSecretAuthDialog({ connectionKey, onLogin }) {
  const styles = useS(style);
  const translate = useTranslate();
  const connectionInfoLoader = useResource(DatabaseSecretAuthDialog, ConnectionInfoResource, connectionKey);
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
  const connectionPublicSecretsLoader = useResource(DatabaseSecretAuthDialog, ConnectionPublicSecretsResource, connectionKey);
  const secrets = connectionPublicSecretsLoader.data || [];

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
      <CommonDialogFooter>
        <Group secondary vertical dense>
          {state.exception ? (
            <ExceptionMessage exception={state.exception} inline />
          ) : (
            <span className={s(styles, { infoMessage: true })}>{translate('plugin_connections_connection_auth_secret_description')}</span>
          )}
        </Group>
      </CommonDialogFooter>
    </>
  );
});
