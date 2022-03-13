/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useAdministrationSettings } from '@cloudbeaver/core-administration';
import {
  ErrorMessage,
  SubmittingForm,
  Loader,
  useFocus,
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { ConnectionAuthenticationForm } from '@cloudbeaver/plugin-connections';

import { ConnectionController, ConnectionStep } from './ConnectionController';
import { ConnectionDialogFooter } from './ConnectionDialogFooter';
import { TemplateConnectionSelector } from './TemplateConnectionSelector/TemplateConnectionSelector';

const styles = css`
    SubmittingForm, center {
      display: flex;
      flex: 1;
      margin: auto;
    }
    center {
      box-sizing: border-box;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    ErrorMessage {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
`;

export const ConnectionDialog: DialogComponent<null, null> = observer(function ConnectionDialog({
  rejectDialog,
}) {
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const controller = useController(ConnectionController, rejectDialog);
  const translate = useTranslate();
  const { credentialsSavingEnabled } = useAdministrationSettings();

  let subtitle: string | undefined;

  if (controller.step === ConnectionStep.Connection && controller.template?.name) {
    subtitle = controller.template.name;
  }

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      size='large'
      title="basicConnection_connectionDialog_newConnection"
      subTitle={subtitle}
      icon={controller.dbDriver?.icon}
      footer={controller.step === ConnectionStep.Connection && (
        <ConnectionDialogFooter
          isConnecting={controller.isConnecting}
          onBack={() => controller.onStep(ConnectionStep.ConnectionTemplateSelect)}
          onConnect={controller.onConnect}
        />
      )}
      noBodyPadding={controller.step === ConnectionStep.ConnectionTemplateSelect}
      fixedSize
      noOverflow
      onReject={rejectDialog}
    >
      {controller.isLoading && <Loader />}
      {!controller.isLoading && controller.step === ConnectionStep.ConnectionTemplateSelect && (
        <TemplateConnectionSelector
          templateConnections={controller.templateConnections}
          dbDrivers={controller.dbDrivers}
          onSelect={controller.onTemplateSelect}
        />
      )}
      {controller.step === ConnectionStep.Connection && (!controller.authModel ? (
        <center>
          {controller.isConnecting && translate('basicConnection_connectionDialog_connecting_message')}
        </center>
      ) : (
        <SubmittingForm ref={focusedRef} onSubmit={controller.onConnect}>
          <ConnectionAuthenticationForm
            config={controller.config}
            authModelId={controller.authModel.id}
            networkHandlers={controller.networkHandlers}
            formId={controller.template?.id}
            allowSaveCredentials={credentialsSavingEnabled}
            disabled={controller.isConnecting}
          />
        </SubmittingForm>
      ))}
      {controller.responseMessage && (
        <ErrorMessage
          text={controller.responseMessage}
          hasDetails={controller.hasDetails}
          onShowDetails={controller.onShowDetails}
        />
      )}
    </CommonDialogWrapper>
  );
});
