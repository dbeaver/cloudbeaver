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
  InfoItem,
  s,
  useAdministrationSettings,
  useErrorDetails,
  useFocus,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { ConnectionAuthenticationFormLoader } from '@cloudbeaver/plugin-connections';

import style from './ConnectionDialog.module.css';
import { ConnectionDialogFooter } from './ConnectionDialogFooter.js';
import { ConnectionStep } from './EConnectionStep.js';
import { TemplateConnectionSelector } from './TemplateConnectionSelector/TemplateConnectionSelector.js';
import { useConnectionDialog } from './useConnectionDialog.js';

export const ConnectionDialog: DialogComponent<null, null> = observer(function ConnectionDialog({ rejectDialog }) {
  const styles = useS(style);
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const { credentialsSavingEnabled } = useAdministrationSettings();
  const dialog = useConnectionDialog(rejectDialog);
  const errorDetails = useErrorDetails(dialog.connectException);

  const subTitle =
    dialog.step === ConnectionStep.Connection ? (
      dialog.template?.name
    ) : (
      <InfoItem info={translate('connections_templates_deprecated_message')} compact />
    );

  return (
    <CommonDialogWrapper size="large" fixedSize={dialog.step === ConnectionStep.ConnectionTemplateSelect}>
      <CommonDialogHeader
        title="plugin_connections_new_connection_dialog_title"
        subTitle={subTitle}
        icon={dialog.driver?.icon}
        onReject={rejectDialog}
      />
      <CommonDialogBody noBodyPadding={dialog.step === ConnectionStep.ConnectionTemplateSelect} noOverflow>
        {dialog.step === ConnectionStep.ConnectionTemplateSelect && <TemplateConnectionSelector onSelect={dialog.selectTemplate} />}
        {dialog.step === ConnectionStep.Connection &&
          (!dialog.authModelId ? (
            <center className={s(styles, { center: true })}>{dialog.processing && translate('plugin_connection_template_connecting_message')}</center>
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
                projectId={dialog.template?.projectId ?? null}
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
