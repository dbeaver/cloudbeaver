/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type AuthProvider, type AuthProviderConfiguration, UserInfoResource } from '@cloudbeaver/core-authentication';
import {
  Checkbox,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Container,
  ErrorMessage,
  Form,
  getComputed,
  Link,
  s,
  TextPlaceholder,
  useErrorDetails,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, type DialogComponent } from '@cloudbeaver/core-dialogs';
import { Tab, TabList, TabsState, TabTitle } from '@cloudbeaver/core-ui';

import { AuthenticationService } from '../AuthenticationService.js';
import type { IAuthOptions } from '../IAuthOptions.js';
import style from './AuthDialog.module.css';
import { AuthDialogFooter } from './AuthDialogFooter.js';
import { AuthProviderForm } from './AuthProviderForm/AuthProviderForm.js';
import { ConfigurationsList } from './AuthProviderForm/ConfigurationsList.js';
import { FEDERATED_AUTH } from './FEDERATED_AUTH.js';
import { getAuthProviderTabId, useAuthDialogState } from './useAuthDialogState.js';

export const AuthDialog: DialogComponent<IAuthOptions, null> = observer(function AuthDialog({
  payload: { providerId, configurationId, linkUser = false, accessRequest = false },
  options,
  rejectDialog,
  resolveDialog,
}) {
  const styles = useS(style);
  const dialogData = useAuthDialogState(accessRequest, providerId, configurationId);
  const errorDetails = useErrorDetails(dialogData.exception);
  const authenticationService = useService(AuthenticationService);
  const userInfo = useService(UserInfoResource);
  const commonDialogService = useService(CommonDialogService);
  const translate = useTranslate();
  const state = dialogData.state;

  const additional = userInfo.data !== null && state.activeProvider?.id !== undefined && !userInfo.hasToken(state.activeProvider.id);

  const showTabs = getComputed(() => dialogData.tabIds.length > 1);
  const emptyTabs = getComputed(() => dialogData.tabIds.length === 0);
  const federate = state.tabId === FEDERATED_AUTH;

  let dialogTitle: string = translate('authentication_login_dialog_title');
  let subTitle: string | undefined;
  let tooltip: string | undefined;
  let icon: string | undefined;

  if (state.activeProvider) {
    subTitle = state.activeProvider.label;
    tooltip = state.activeProvider.description;
    icon = state.activeProvider.icon;

    if (state.activeConfiguration) {
      subTitle += ` | ${state.activeConfiguration.displayName}`;
      icon = state.activeConfiguration.iconURL || icon;

      if (state.activeConfiguration.description) {
        tooltip = state.activeConfiguration.description;
      }
    }
  } else if (federate) {
    dialogTitle = `${translate('authentication_auth_federated')} ${dialogTitle}`;
    subTitle = 'authentication_identity_provider_dialog_subtitle';
  }

  if (additional) {
    dialogTitle = `${translate('authentication_auth_additional')} ${dialogTitle}`;
  }

  async function login(linkUser: boolean, provider?: AuthProvider, configuration?: AuthProviderConfiguration) {
    try {
      await dialogData.login(linkUser, provider, configuration);

      resolveDialog();
    } catch {}
  }

  function navToSettings() {
    // We should close the dialog that caused the additional authentication prompt if we are navigating to the settings
    commonDialogService.rejectAll();
    authenticationService.configureAuthProvider?.();
  }

  function renderForm(provider: AuthProvider | null, configuration: AuthProviderConfiguration | null) {
    if (!provider) {
      if (emptyTabs) {
        return (
          <TextPlaceholder>
            {translate('authentication_configure')}
            <Link
              onClick={() => {
                navToSettings();
              }}
            >
              {translate('ui_configure')}
            </Link>
          </TextPlaceholder>
        );
      } else {
        return <TextPlaceholder>{translate('authentication_select_provider')}</TextPlaceholder>;
      }
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

    return (
      <AuthProviderForm provider={provider} configuration={configuration} credentials={state.credentials} authenticate={dialogData.authenticating} />
    );
  }

  return (
    <TabsState
      currentTabId={state.tabId}
      onChange={tabData => {
        state.switchAuthMode(tabData.tabId);
      }}
    >
      <CommonDialogWrapper
        className={s(styles, { wrapper: true })}
        size="large"
        aria-label={translate('authentication_login_dialog_title')}
        autofocus={false}
      >
        <CommonDialogHeader
          title={dialogTitle}
          tooltip={tooltip}
          icon={icon}
          subTitle={subTitle}
          onReject={options?.persistent ? undefined : rejectDialog}
        />
        <CommonDialogBody noOverflow={federate} noBodyPadding>
          {showTabs && (
            <TabList className={s(styles, { tabList: true })} aria-label="Auth providers" underline big>
              {dialogData.providers
                .map(provider => {
                  if (provider.configurable) {
                    return provider.configurations?.map(configuration => {
                      const tabId = getAuthProviderTabId(provider, configuration);
                      return (
                        <Tab
                          key={tabId}
                          tabId={tabId}
                          title={configuration.displayName}
                          disabled={dialogData.authenticating}
                          className={s(styles, { tab: true })}
                          onClick={() => {
                            state.setActiveProvider(provider, configuration);
                          }}
                        >
                          <TabTitle>{configuration.displayName}</TabTitle>
                        </Tab>
                      );
                    });
                  }
                  return (
                    <Tab
                      key={provider.id}
                      tabId={provider.id}
                      title={provider.description || provider.label}
                      disabled={dialogData.authenticating}
                      className={s(styles, { tab: true })}
                      onClick={() => {
                        state.setActiveProvider(provider, null);
                      }}
                    >
                      <TabTitle>{provider.label}</TabTitle>
                    </Tab>
                  );
                })
                .flat()}
              {dialogData.federatedProviders.length > 0 && (
                <Tab
                  key={FEDERATED_AUTH}
                  tabId={FEDERATED_AUTH}
                  title={translate('authentication_auth_federated')}
                  className={s(styles, { tab: true })}
                  disabled={dialogData.authenticating}
                  onClick={() => {
                    state.setActiveProvider(null, null);
                    state.switchAuthMode(FEDERATED_AUTH);
                  }}
                >
                  <TabTitle>{translate('authentication_auth_federated')}</TabTitle>
                </Tab>
              )}
            </TabList>
          )}
          {federate ? (
            <ConfigurationsList
              activeProvider={state.activeProvider}
              activeConfiguration={state.activeConfiguration}
              providers={dialogData.federatedProviders}
              authTask={dialogData.authTask}
              className={s(styles, { configurationsList: true })}
              login={login}
              onClose={rejectDialog}
            />
          ) : (
            <Form className={s(styles, { submittingForm: true })} onSubmit={() => login(linkUser)}>
              {renderForm(state.activeProvider, state.activeConfiguration)}
            </Form>
          )}
        </CommonDialogBody>
        <CommonDialogFooter>
          <Container>
            {state.isTooManySessions && (
              <Checkbox
                title={translate('authentication_auth_force_session_logout_checkbox_tooltip')}
                className={s(styles, { tooManySessionsCheckbox: true })}
                checked={state.forceSessionsLogout}
                name="forceSessionLogout"
                label={translate('authentication_auth_force_session_logout')}
                onClick={e => {
                  state.forceSessionsLogout = e.currentTarget.checked;
                }}
              />
            )}
            <AuthDialogFooter
              authAvailable={!dialogData.configure && !federate}
              isAuthenticating={dialogData.authenticating}
              onLogin={() => login(linkUser)}
            >
              {errorDetails.name && (
                <ErrorMessage
                  className={s(styles, { errorMessage: true })}
                  text={errorDetails.message || errorDetails.name}
                  hasDetails={errorDetails.hasDetails}
                  onShowDetails={errorDetails.open}
                />
              )}
            </AuthDialogFooter>
          </Container>
        </CommonDialogFooter>
      </CommonDialogWrapper>
    </TabsState>
  );
});
