/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import {
  ErrorMessage, SubmittingForm, Loader, useFocus, ObjectPropertyInfoForm
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConnectionController, ConnectionStep } from './ConnectionController';
import { ConnectionDialogFooter } from './ConnectionDialogFooter';
import { TemplateConnectionSelector } from './TemplateConnectionSelector/TemplateConnectionSelector';

const styles = css`
  CommonDialogWrapper {
    max-height: 500px;
    min-height: 500px;
  }
  SubmittingForm, center {
    display: flex;
    flex: 1;
  }
  center {
    box-sizing: border-box;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  ObjectPropertyInfoForm {
    align-items: center;
    justify-content: center;
  }
`;

export const ConnectionDialog = observer(function ConnectionDialog({
  rejectDialog,
}: DialogComponentProps<null, null>) {
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const controller = useController(ConnectionController, rejectDialog);
  const translate = useTranslate();
  let title = translate('basicConnection_connectionDialog_newConnection');

  if (controller.step === ConnectionStep.Connection && controller.template?.name) {
    title = controller.template.name;
  }

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      title={title}
      icon={controller.dbDriver?.icon}
      noBodyPadding={controller.step === ConnectionStep.ConnectionTemplateSelect}
      footer={controller.step === ConnectionStep.Connection && (
        <ConnectionDialogFooter
          isConnecting={controller.isConnecting}
          onBack={() => controller.onStep(ConnectionStep.ConnectionTemplateSelect)}
          onConnect={controller.onConnect}
        />
      )}
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
        <center as="div">
          {controller.isConnecting && translate('basicConnection_connectionDialog_connecting_message')}
        </center>
      ) : (
        <SubmittingForm onSubmit={controller.onConnect} ref={focusedRef}>
          <ObjectPropertyInfoForm
            autofillToken={`section-${controller.template?.id || ''} section-auth`}
            properties={controller.authModel.properties}
            credentials={controller.credentials}
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
