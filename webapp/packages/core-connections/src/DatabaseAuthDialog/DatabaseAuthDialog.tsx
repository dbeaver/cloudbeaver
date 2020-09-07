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
  SubmittingForm, ErrorMessage, Loader, useFocus, ObjectPropertyInfoForm
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { useConnectionInfo } from '../useConnectionInfo';
import { useDBDriver } from '../useDBDriver';
import { DBAuthDialogController } from './DBAuthDialogController';
import { DBAuthDialogFooter } from './DBAuthDialogFooter';

const styles = composes(
  css`
    ErrorMessage {
      composes: theme-background-secondary from global;
    }
  `,
  css`
    CommonDialogWrapper {
      min-height: 400px;
      min-width: 600px;
    }
    SubmittingForm {
      overflow: auto;
      margin: auto;
      margin-top: 20px;
      margin-bottom: 20px;
    }
    SubmittingForm {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    ObjectPropertyInfoForm {
      align-items: center;
      justify-content: center;
    }
    ErrorMessage {
      position: sticky;
      bottom: 0;
      padding: 8px 24px;
    }
  `
);

export const DatabaseAuthDialog = observer(function DatabaseAuthDialog({
  payload,
  options,
  rejectDialog,
}: DialogComponentProps<string, null>) {
  const connection = useConnectionInfo(payload);
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const { driver } = useDBDriver(connection.connectionInfo?.driverId || '');
  const controller = useController(DBAuthDialogController, payload, rejectDialog);

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      title={connection.connectionInfo?.name}
      icon={driver?.icon}
      noBodyPadding
      footer={(
        <DBAuthDialogFooter
          isAuthenticating={controller.isAuthenticating}
          onLogin={controller.login}
        />
      )}
      onReject={options?.persistent ? undefined : rejectDialog}
    >
      {(!connection.isLoaded() || connection.isLoading())
        ? <Loader />
        : (
          <SubmittingForm onSubmit={controller.login} ref={focusedRef}>
            <ObjectPropertyInfoForm
              autofillToken={`section-${connection.connectionInfo?.id || ''} section-auth`}
              properties={connection.connectionInfo?.authProperties}
              credentials={controller.credentials}
              disabled={controller.isAuthenticating}
            />
          </SubmittingForm>
        )}
      {controller.error.responseMessage && (
        <ErrorMessage
          text={controller.error.responseMessage}
          hasDetails={controller.error.hasDetails}
          onShowDetails={controller.showDetails}
        />
      )}
    </CommonDialogWrapper>
  );
});
