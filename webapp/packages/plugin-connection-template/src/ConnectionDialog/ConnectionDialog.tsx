/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  ErrorMessage,
  Form,
  s,
  useAdministrationSettings,
  useErrorDetails,
  useFocus,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { ConnectionAuthenticationFormLoader } from '@cloudbeaver/plugin-connections';

import style from './ConnectionDialog.m.css';
import { ConnectionDialogFooter } from './ConnectionDialogFooter';
import { ConnectionStep } from './EConnectionStep';
import { TemplateConnectionSelector } from './TemplateConnectionSelector/TemplateConnectionSelector';
import { useConnectionDialog } from './useConnectionDialog';

export const ConnectionDialog: DialogComponent<null, null> = observer(function ConnectionDialog({ rejectDialog }) {
  const styles = useS(style);
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const { credentialsSavingEnabled } = useAdministrationSettings();
  const dialog = useConnectionDialog(rejectDialog);
  const errorDetails = useErrorDetails(dialog.connectException);

  const subTitle = dialog.step === ConnectionStep.Connection ? dialog.template?.name : undefined;

  return (
    <CommonDialogWrapper size="large" fixedSize={dialog.step === ConnectionStep.ConnectionTemplateSelect}>
      <CommonDialogHeader
        title="basicConnection_connectionDialog_newConnection"
        subTitle={subTitle}
        icon={dialog.driver?.icon}
        onReject={rejectDialog}
      />
      <CommonDialogBody noBodyPadding={dialog.step === ConnectionStep.ConnectionTemplateSelect} noOverflow>
        {dialog.step === ConnectionStep.ConnectionTemplateSelect && <TemplateConnectionSelector onSelect={dialog.selectTemplate} />}
        {dialog.step === ConnectionStep.Connection &&
          (!dialog.authModelId ? (
            <center className={s(styles, { center: true })}>
              {dialog.processing && translate('basicConnection_connectionDialog_connecting_message')}
            </center>
          ) : (
            <Form ref={focusedRef} className={s(styles, { submittingForm: true })} onSubmit={dialog.connect}>
              <ConnectionAuthenticationFormLoader
                config={dialog.config}
                authModelId={dialog.authModelId}
                networkHandlers={dialog.networkHandlers}
                formId={dialog.template?.id}
                allowSaveCredentials={credentialsSavingEnabled}
                disabled={dialog.processing}
                hideFeatures={['nonSecuredProperty']}
                className={s(styles, { connectionAuthenticationFormLoader: true })}
              />
            </Form>
          ))}
      </CommonDialogBody>
      {dialog.step === ConnectionStep.Connection && (
        <CommonDialogFooter>
          {dialog.connectException && (
            <ErrorMessage
              text={errorDetails.message ?? translate('core_blocks_exception_message_error_message')}
              hasDetails={errorDetails.hasDetails}
              className={s(styles, { errorMessage: true })}
              onShowDetails={errorDetails.open}
            />
          )}
          <ConnectionDialogFooter
            isConnecting={dialog.processing}
            onBack={() => dialog.setStep(ConnectionStep.ConnectionTemplateSelect)}
            onConnect={dialog.connect}
          />
        </CommonDialogFooter>
      )}
    </CommonDialogWrapper>
  );
});
