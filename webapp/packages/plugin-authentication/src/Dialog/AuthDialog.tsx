/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { AuthProvider, UserInfoResource } from '@cloudbeaver/core-authentication';
import { ErrorMessage, Link, SubmittingForm, TextPlaceholder, useErrorDetails, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import {
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogService,
  CommonDialogWrapper,
  DialogComponent,
} from '@cloudbeaver/core-dialogs';
import { BASE_TAB_STYLES, Tab, TabList, TabsState, TabTitle, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

import { AuthenticationService } from '../AuthenticationService';
import type { IAuthOptions } from '../IAuthOptions';
import { AuthDialogFooter } from './AuthDialogFooter';
import { AuthProviderForm } from './AuthProviderForm/AuthProviderForm';
import { ConfigurationsList } from './AuthProviderForm/ConfigurationsList';
import { FEDERATED_AUTH } from './FEDERATED_AUTH';
import { useAuthDialogState } from './useAuthDialogState';

const styles = css`
  CommonDialogWrapper {
    min-height: 520px !important;
    max-height: max(100vh - 48px, 520px) !important;
  }
  SubmittingForm {
    overflow: auto;
    &[|form] {
      margin: auto;
    }
  }
  SubmittingForm,
  AuthProviderForm {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  TabList {
    justify-content: center;
  }
  Tab {
    text-transform: uppercase;
    &:global([aria-selected='true']) {
      font-weight: 500 !important;
    }
  }
  AuthProviderForm {
    flex-direction: column;
    padding: 18px 24px;
  }
  ConfigurationsList {
    margin-top: 12px;
  }
  ErrorMessage {
    composes: theme-background-secondary theme-text-on-secondary from global;
    flex: 1;
  }
`;

export const AuthDialog: DialogComponent<IAuthOptions, null> = observer(function AuthDialog({
  payload: { providerId, configurationId, linkUser = false, accessRequest = false },
  options,
  rejectDialog,
}) {
  const dialogData = useAuthDialogState(accessRequest, providerId, configurationId);
  const errorDetails = useErrorDetails(dialogData.exception);
  const authenticationService = useService(AuthenticationService);
  const userInfo = useService(UserInfoResource);
  const commonDialogService = useService(CommonDialogService);
  const translate = useTranslate();
  const state = dialogData.state;

  const additional = userInfo.data !== null && state.activeProvider?.id !== undefined && !userInfo.hasToken(state.activeProvider.id);

  const showTabs = dialogData.providers.length + dialogData.configurations.length > 1;
  const federate = state.tabId === FEDERATED_AUTH;

  let dialogTitle = translate('authentication_login_dialog_title');
  let subTitle: string | undefined;
  let icon: string | undefined;

  if (state.activeProvider) {
    dialogTitle += `: ${state.activeProvider.label}`;
    subTitle = state.activeProvider.description;
    icon = state.activeProvider.icon;

    if (state.activeConfiguration) {
      dialogTitle += `: ${state.activeConfiguration.displayName}`;
      subTitle = state.activeConfiguration.description;
      icon = state.activeConfiguration.iconURL || icon;
    }
  } else if (federate) {
    dialogTitle += `: ${translate('authentication_auth_federated')}`;
    subTitle = 'authentication_identity_provider_dialog_subtitle';
  }

  if (additional) {
    subTitle = 'authentication_request_token';
  }

  async function login() {
    await dialogData.login(linkUser);
    rejectDialog();
  }

  function navToSettings() {
    // We should close the dialog that caused the additional authentication prompt if we are navigating to the settings
    commonDialogService.rejectAll();
    authenticationService.configureAuthProvider?.();
  }

  function renderForm(provider: AuthProvider | null) {
    if (!provider) {
      return <TextPlaceholder>{translate('authentication_select_provider')}</TextPlaceholder>;
    }

    if (dialogData.configure) {
      return (
        <TextPlaceholder>
          {translate('authentication_provider_disabled')}
          {authenticationService.configureAuthProvider && (
            <Link
              onClick={() => {
                navToSettings();
              }}
            >
              {translate('ui_configure')}
            </Link>
          )}
        </TextPlaceholder>
      );
    }

    return <AuthProviderForm provider={provider} credentials={state.credentials} authenticate={dialogData.authenticating} />;
  }

  return styled(useStyles(BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES))(
    <TabsState
      currentTabId={state.tabId}
      onChange={tabData => {
        state.setTabId(tabData.tabId);
      }}
    >
      <CommonDialogWrapper size="large" aria-label={translate('authentication_login_dialog_title')}>
        <CommonDialogHeader title={dialogTitle} icon={icon} subTitle={subTitle} onReject={options?.persistent ? undefined : rejectDialog} />
        <CommonDialogBody noBodyPadding>
          {showTabs && (
            <TabList aria-label="Auth providers">
              {dialogData.providers.map(provider => (
                <Tab
                  key={provider.id}
                  tabId={provider.id}
                  title={provider.description || provider.label}
                  disabled={dialogData.authenticating}
                  onClick={() => {
                    state.setActiveProvider(provider);
                  }}
                >
                  <TabTitle>{provider.label}</TabTitle>
                </Tab>
              ))}
              {dialogData.configurations.length > 0 && (
                <Tab
                  key={FEDERATED_AUTH}
                  tabId={FEDERATED_AUTH}
                  title={translate('authentication_auth_federated')}
                  disabled={dialogData.authenticating}
                  onClick={() => {
                    state.setActiveProvider(null);
                  }}
                >
                  <TabTitle>{translate('authentication_auth_federated')}</TabTitle>
                </Tab>
              )}
            </TabList>
          )}
          <SubmittingForm {...use({ form: !federate })} onSubmit={login}>
            {federate ? (
              <ConfigurationsList
                activeProvider={state.activeProvider}
                activeConfiguration={state.activeConfiguration}
                providers={dialogData.configurations}
                onAuthorize={(provider, configuration) => {
                  state.setActiveConfiguration(provider, configuration);
                }}
                onClose={rejectDialog}
              />
            ) : (
              renderForm(state.activeProvider)
            )}
          </SubmittingForm>
        </CommonDialogBody>
        {!federate && (
          <CommonDialogFooter>
            <AuthDialogFooter authAvailable={!dialogData.configure} isAuthenticating={dialogData.authenticating} onLogin={login}>
              {errorDetails.name && (
                <ErrorMessage
                  text={errorDetails.message || errorDetails.name}
                  hasDetails={errorDetails.hasDetails}
                  onShowDetails={errorDetails.open}
                />
              )}
            </AuthDialogFooter>
          </CommonDialogFooter>
        )}
      </CommonDialogWrapper>
    </TabsState>,
  );
});
