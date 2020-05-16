/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import {
  useTabState, Tab as BaseTab, TabList
} from 'reakit/Tab';
import styled, { css } from 'reshadow';

import { SubmittingForm, ErrorMessage } from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/di';
import { DialogComponent, CommonDialogWrapper } from '@dbeaver/core/dialogs';
import { useTranslate } from '@dbeaver/core/localization';
import { composes, useStyles } from '@dbeaver/core/theming';

import { AuthDialogController } from './AuthDialogController';
import { AuthDialogFooter } from './AuthDialogFooter';
import { AuthProviderForm } from './AuthProviderForm/AuthProviderForm';

const styles = composes(
  css`
    BaseTab {
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

    BaseTab {
      outline: none;
    }

    TabList {
      box-sizing: border-box;
      display: inline-flex;
      width: 100%;
      padding-left: 24px;
    }
    BaseTab {
      composes: theme-typography--body2 from global;
      text-transform: uppercase;
      padding: 12px 16px;
      border-top: solid 2px transparent;
      height: 48px;

      &:global([aria-selected='true']) {
        border-top-color: #fd1d48;

        &:before {
          display: none;
        }
      }

      &:not(:global([aria-selected='true'])) {
        cursor: pointer;
        background-color: transparent !important;
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

export const AuthDialog: DialogComponent<null, null> = observer(
  function AuthDialog(props) {
    const controller = useController(AuthDialogController, props.rejectDialog);
    const translate = useTranslate();
    const tab = useTabState({
      selectedId: controller.provider?.id,
    });
    tab.selectedId = controller.provider?.id || null;

    return styled(useStyles(styles))(
      <CommonDialogWrapper
        title={translate('authentication_login_dialog_title')}
        noBodyPadding
        header={(
          <TabList {...tab} aria-label="My tabs">
            {controller.providers.map(provider => (
              <BaseTab
                {...tab}
                key={provider.id}
                type='button'
                stopId={provider.id}
                onClick={() => controller.selectProvider(provider.id)}
              >
                {provider.label}
              </BaseTab>
            ))}
          </TabList>
        )}
        footer={(
          <AuthDialogFooter
            isAuthenticating={controller.isAuthenticating}
            onLogin={controller.login}
          />
        )}
        onReject={props.options?.persistent ? undefined : props.rejectDialog}
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
    );
  }
);
