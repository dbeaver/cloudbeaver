/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Form,
  s,
  useFocus,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useDBDriver } from '@cloudbeaver/core-connections';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';

import style from './ConnectionAuthenticationDialog.module.css';
import { ConnectionAuthenticationFormLoader } from './ConnectionAuthenticationFormLoader.js';

export interface ConnectionAuthenticationDialogPayload {
  config: ConnectionConfig;
  authModelId: string | null;
  networkHandlers?: string[];
  projectId: string | null;
}

export const ConnectionAuthenticationDialog: DialogComponent<ConnectionAuthenticationDialogPayload> = observer(
  function ConnectionAuthenticationDialog({ payload, rejectDialog, resolveDialog }) {
    const translate = useTranslate();
    const styles = useS(style);
    const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
    const { driver } = useDBDriver(payload.config.driverId || '');

    return (
      <CommonDialogWrapper size="large">
        <CommonDialogHeader
          title="connections_connection_credentials_provisioning"
          subTitle="connections_connection_credentials_provisioning_description"
          icon={driver?.icon}
          onReject={rejectDialog}
        />
        <CommonDialogBody>
          <Form ref={focusedRef} className={s(styles, { submittingForm: true })} onSubmit={() => resolveDialog()}>
            <ConnectionAuthenticationFormLoader
              config={payload.config}
              projectId={payload.projectId ?? null}
              authModelId={payload.authModelId}
              networkHandlers={payload.networkHandlers}
              formId={payload.config.connectionId || payload.config.driverId}
              className={s(styles, { connectionAuthenticationFormLoader: true })}
              hideFeatures={['nonSecuredProperty']}
            />
          </Form>
        </CommonDialogBody>
        <CommonDialogFooter>
          <Button className={s(styles, { button: true })} onClick={() => resolveDialog()}>
            {translate('ui_apply')}
          </Button>
        </CommonDialogFooter>
      </CommonDialogWrapper>
    );
  },
);
