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
  SubmittingForm,
  ErrorMessage,
  Loader,
  useFocus,
  ObjectPropertyInfoForm,
  FieldCheckbox,
  FormBox,
  FormBoxElement,
  FormGroup
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
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
      display: inline-flex;
    }
    FormBox {
      align-items: center;
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
}: DialogComponentProps<string>) {
  const connection = useConnectionInfo(payload);
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const { driver } = useDBDriver(connection.connectionInfo?.driverId || '');
  const controller = useController(DBAuthDialogController, payload, rejectDialog);
  const translate = useTranslate();

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      title={connection.connectionInfo?.name}
      icon={driver?.icon}
      footer={(
        <DBAuthDialogFooter
          isAuthenticating={controller.isAuthenticating}
          onLogin={controller.login}
        />
      )}
      noBodyPadding
      onReject={options?.persistent ? undefined : rejectDialog}
    >
      {(!connection.isLoaded() || connection.isLoading())
        ? <Loader />
        : (
          <SubmittingForm ref={focusedRef} onSubmit={controller.login}>
            <FormBox>
              <FormBoxElement>
                <ObjectPropertyInfoForm
                  autofillToken={`section-${connection.connectionInfo?.id || ''} section-auth`}
                  properties={connection.connectionInfo?.authProperties}
                  credentials={controller.config.credentials}
                  disabled={controller.isAuthenticating}
                />
                <FormGroup>
                  <FieldCheckbox
                    name="saveCredentials"
                    value={connection.connectionInfo?.id || 'DBAuthSaveCredentials'}
                    checkboxLabel={translate('connections_connection_edit_save_credentials')}
                    disabled={controller.isAuthenticating}
                    state={controller.config}
                    mod='surface'
                  />
                </FormGroup>
              </FormBoxElement>
            </FormBox>
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
