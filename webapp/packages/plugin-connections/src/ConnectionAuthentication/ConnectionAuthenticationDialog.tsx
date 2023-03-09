/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { SubmittingForm, useFocus, Button, useTranslate, useStyles } from '@cloudbeaver/core-blocks';
import { useDBDriver } from '@cloudbeaver/core-connections';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';


import { ConnectionAuthenticationFormLoader } from './ConnectionAuthenticationFormLoader';

const styles = css`
  SubmittingForm {
    overflow: auto;
    margin: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  ConnectionAuthenticationFormLoader {
    align-content: center;
  }
  Button {
    margin-left: auto;
  }
`;

interface Payload {
  config: ConnectionConfig;
  authModelId: string | null;
  networkHandlers?: string[];
  driverId?: string;
}

export const ConnectionAuthenticationDialog: DialogComponent<Payload> = observer(function ConnectionAuthenticationDialog({
  payload,
  rejectDialog,
  resolveDialog,
}) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const { driver } = useDBDriver(payload.driverId || '');

  return styled(useStyles(styles))(
    <CommonDialogWrapper size='large'>
      <CommonDialogHeader
        title="connections_connection_credentials_provisioning"
        subTitle="connections_connection_credentials_provisioning_description"
        icon={driver?.icon}
        onReject={rejectDialog}
      />
      <CommonDialogBody>
        <SubmittingForm ref={focusedRef} onSubmit={() => resolveDialog()}>
          <ConnectionAuthenticationFormLoader
            config={payload.config}
            authModelId={payload.authModelId}
            networkHandlers={payload.networkHandlers}
            formId={payload.config.connectionId || payload.driverId}
            hideFeatures={['nonSecuredProperty']}
          />
        </SubmittingForm>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button mod={['unelevated']} onClick={() => resolveDialog()}>
          {translate('ui_apply')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
