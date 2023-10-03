/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ErrorMessage, Form, Loader, s, useAdministrationSettings, useFocus, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { ConnectionAuthenticationFormLoader } from '@cloudbeaver/plugin-connections';

import { ConnectionController, ConnectionStep } from './ConnectionController';
import style from './ConnectionDialog.m.css';
import { ConnectionDialogFooter } from './ConnectionDialogFooter';
import { TemplateConnectionSelector } from './TemplateConnectionSelector/TemplateConnectionSelector';

export const ConnectionDialog: DialogComponent<null, null> = observer(function ConnectionDialog({ rejectDialog }) {
  const styles = useS(style);
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const controller = useController(ConnectionController, rejectDialog);
  const translate = useTranslate();
  const { credentialsSavingEnabled } = useAdministrationSettings();

  let subtitle: string | undefined;

  if (controller.step === ConnectionStep.Connection && controller.template?.name) {
    subtitle = controller.template.name;
  }

  return (
    <CommonDialogWrapper size="large" fixedSize>
      <CommonDialogHeader
        title="basicConnection_connectionDialog_newConnection"
        subTitle={subtitle}
        icon={controller.dbDriver?.icon}
        onReject={rejectDialog}
      />
      <CommonDialogBody noBodyPadding={controller.step === ConnectionStep.ConnectionTemplateSelect} noOverflow>
        {controller.isLoading && <Loader />}
        {!controller.isLoading && controller.step === ConnectionStep.ConnectionTemplateSelect && (
          <TemplateConnectionSelector
            templateConnections={controller.templateConnections}
            dbDrivers={controller.dbDrivers}
            onSelect={controller.onTemplateSelect}
          />
        )}
        {controller.step === ConnectionStep.Connection &&
          (!controller.authModel ? (
            <center className={s(styles, { center: true })}>
              {controller.isConnecting && translate('basicConnection_connectionDialog_connecting_message')}
            </center>
          ) : (
            <Form ref={focusedRef} className={s(styles, { submittingForm: true })} onSubmit={controller.onConnect}>
              <ConnectionAuthenticationFormLoader
                config={controller.config}
                authModelId={controller.authModel.id}
                networkHandlers={controller.networkHandlers}
                formId={controller.template?.id}
                allowSaveCredentials={credentialsSavingEnabled}
                disabled={controller.isConnecting}
                className={s(styles, { connectionAuthenticationFormLoader: true })}
              />
            </Form>
          ))}
      </CommonDialogBody>
      {controller.step === ConnectionStep.Connection && (
        <CommonDialogFooter>
          {controller.responseMessage && (
            <ErrorMessage
              text={controller.responseMessage}
              className={s(styles, { errorMessage: true })}
              hasDetails={controller.hasDetails}
              onShowDetails={controller.onShowDetails}
            />
          )}
          <ConnectionDialogFooter
            isConnecting={controller.isConnecting}
            onBack={() => controller.onStep(ConnectionStep.ConnectionTemplateSelect)}
            onConnect={controller.onConnect}
          />
        </CommonDialogFooter>
      )}
    </CommonDialogWrapper>
  );
});
