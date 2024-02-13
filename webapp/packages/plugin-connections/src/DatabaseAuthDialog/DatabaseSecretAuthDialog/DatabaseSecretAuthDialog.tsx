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
  ErrorMessage,
  ItemList,
  ListItem,
  ListItemName,
  Loader,
  s,
  useErrorDetails,
  useFocus,
  useObservableRef,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';

import style from './DatabaseSecretAuthDialog.m.css';

interface Props {
  connectionKey: IConnectionInfoParams;
  onLogin?: () => void;
}

export const DatabaseSecretAuthDialog = observer<Props>(function DatabaseSecretAuthDialog({ connectionKey, onLogin }) {
  const styles = useS(style);
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });
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
  const errorDetails = useErrorDetails(state.exception);
  const secrets = connectionInfoLoader.data?.sharedSecrets || [];

  async function handleSecretSelect(secretId: string) {
    try {
      state.authenticating = true;
      await connectionInfoLoader.resource.init({
        ...connectionKey,
        selectedSecretId: secretId,
      });
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
      <CommonDialogBody>
        <div ref={focusedRef} className={s(styles, { wrapper: true })}>
          <ItemList>
            {secrets.map(secret => (
              <ListItem key={secret.secretId} onClick={() => handleSecretSelect(secret.secretId)}>
                <ListItemName>{secret.displayName}</ListItemName>
              </ListItem>
            ))}
          </ItemList>
        </div>
      </CommonDialogBody>
      <CommonDialogFooter>
        {errorDetails.error && (
          <ErrorMessage
            text={errorDetails.message ?? translate('core_blocks_exception_message_error_message')}
            hasDetails={errorDetails.hasDetails}
            className={style.errorMessage}
            onShowDetails={errorDetails.open}
          />
        )}
      </CommonDialogFooter>
    </>
  );
});
