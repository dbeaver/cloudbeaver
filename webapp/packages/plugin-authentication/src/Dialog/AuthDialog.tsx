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
  SubmittingForm, ErrorMessage, TabsState, TabList, Tab, TabTitle
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { AuthDialogController } from './AuthDialogController';
import { AuthDialogFooter } from './AuthDialogFooter';
import { AuthProviderForm } from './AuthProviderForm/AuthProviderForm';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }
    ErrorMessage {
      composes: theme-background-secondary from global;
    }
  `,
  css`
    custom-connection {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
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
    SubmittingForm, AuthProviderForm {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    TabList {
      box-sizing: border-box;
      display: inline-flex;
      width: 100%;
      padding-left: 24px;
      outline: none;
    }
    Tab {
      composes: theme-typography--body2 from global;
      text-transform: uppercase;
      font-weight: normal;

      &:global([aria-selected=true]) {
        font-weight: normal !important;
      }
    }
    AuthProviderForm {
      flex-direction: column;
      padding: 18px 24px;
    }
    ErrorMessage {
      position: sticky;
      bottom: 0;
      padding: 8px 24px;
    }
  `
);

export const AuthDialog = observer(function AuthDialog({
  options,
  rejectDialog,
}: DialogComponentProps<null, null>) {
  const controller = useController(AuthDialogController, rejectDialog);
  const translate = useTranslate();

  return styled(useStyles(styles))(
    <TabsState currentTabId={controller.provider?.id || null}>
      <CommonDialogWrapper
        title={translate('authentication_login_dialog_title')}
        noBodyPadding
        header={(
          <TabList aria-label='Auth providers'>
            {controller.providers.map(provider => (
              <Tab
                key={provider.id}
                tabId={provider.id}
                onOpen={() => controller.selectProvider(provider.id)}
              >
                <TabTitle>{provider.label}</TabTitle>
              </Tab>
            ))}
          </TabList>
        )}
        footer={(
          <AuthDialogFooter
            isAuthenticating={controller.isAuthenticating}
            onLogin={controller.login}
          />
        )}
        onReject={options?.persistent ? undefined : rejectDialog}
      >
        <SubmittingForm onSubmit={controller.login}>
          {controller.provider && (
            <AuthProviderForm
              provider={controller.provider}
              credentials={controller.credentials}
              authenticate={controller.isAuthenticating}
            />
          )}
          {!controller.provider && <>Select available provider</>}
        </SubmittingForm>
        {controller.error.responseMessage && (
          <ErrorMessage
            text={controller.error.responseMessage}
            hasDetails={controller.error.hasDetails}
            onShowDetails={controller.showDetails}
          />
        )}
      </CommonDialogWrapper>
    </TabsState>
  );
});
