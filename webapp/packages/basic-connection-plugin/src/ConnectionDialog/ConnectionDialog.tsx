/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { ErrorMessage, SubmittingForm, Loader } from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/di';
import { CommonDialogWrapper, DialogComponent, DialogComponentProps } from '@dbeaver/core/dialogs';
import { useTranslate } from '@dbeaver/core/localization';
import { useStyles } from '@dbeaver/core/theming';

import { Connection } from './Connection';
import { ConnectionController, ConnectionStep } from './ConnectionController';
import { ConnectionDialogFooter } from './ConnectionDialogFooter';
import { DBSourceSelector } from './DBSourceSelector/DBSourceSelector';

const styles = css`
  CommonDialogWrapper {
    display: flex;
    flex-direction: column;
    max-height: 330px;
    min-height: 330px;
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
`;

export const ConnectionDialog: DialogComponent<null, null> = observer(
  function ConnectionDialog(props: DialogComponentProps<null, null>) {
    const controller = useController(ConnectionController, props.rejectDialog);
    const translate = useTranslate();
    let title = translate('basicConnection_connectionDialog_newConnection');

    if (controller.step === ConnectionStep.Connection && controller.dbSource?.name) {
      title = controller.dbSource.name;
    }

    return styled(useStyles(styles))(
      <CommonDialogWrapper
        title={title}
        noBodyPadding={controller.step === ConnectionStep.DBSource}
        footer={controller.step === ConnectionStep.Connection && (
          <ConnectionDialogFooter
            isConnecting={controller.isConnecting}
            onBack={() => controller.onStep(ConnectionStep.DBSource)}
            onConnect={controller.onConnect}
          />
        )}
        onReject={props.rejectDialog}
      >
        {controller.isLoading && <Loader />}
        {!controller.isLoading && controller.step === ConnectionStep.DBSource && (
          <DBSourceSelector
            dbSources={controller.dbSources}
            dbDrivers={controller.dbDrivers}
            onSelect={controller.onDBSourceSelect}
          />
        )}
        {controller.step === ConnectionStep.Connection && (controller.dbDriver?.anonymousAccess ? (
          <center as="div">
            {controller.isConnecting && translate('basicConnection_connectionDialog_connecting_message')}
          </center>
        ) : (
          <SubmittingForm onSubmit={controller.onConnect}>
            <Connection
              userName={controller.config.userName}
              userPassword={controller.config.userPassword}
              isConnecting={controller.isConnecting}
              onChange={controller.onChange}
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
  }
);
