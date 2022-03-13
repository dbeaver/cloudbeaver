/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { AuthProvider, UserInfoResource } from '@cloudbeaver/core-authentication';
import { SubmittingForm, Loader, ErrorMessage, TextPlaceholder, Link, useErrorDetails } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { Translate, useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { TabsState, TabList, Tab, TabTitle, UNDERLINE_TAB_STYLES, BASE_TAB_STYLES } from '@cloudbeaver/core-ui';

import { AuthenticationService } from '../AuthenticationService';
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
    SubmittingForm, AuthProviderForm {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    TabList {
      justify-content: center;
    }
    Tab {
      text-transform: uppercase;
      &:global([aria-selected=true]) {
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

interface IAuthPayload {
  providerId: string | null;
  link?: boolean;
}

export const AuthDialog: DialogComponent<IAuthPayload, null> = observer(function AuthDialog({
  payload: {
    providerId,
    link = false,
  },
  options,
  rejectDialog,
}) {
  const state = useAuthDialogState(providerId);
  const errorDetails = useErrorDetails(state.exception);
  const authenticationService = useService(AuthenticationService);
  const userInfo = useService(UserInfoResource);
  const translate = useTranslate();

  const additional = userInfo.data !== null
    && state.activeProvider?.id !== undefined
    && !userInfo.hasToken(state.activeProvider.id);

  const showTabs = (state.providers.length + state.configurations.length) > 1;
  const federate = state.tabId === FEDERATED_AUTH;

  let dialogTitle = translate('authentication_login_dialog_title');
  let subTitle: string | undefined;

  if (state.activeProvider) {
    dialogTitle += `: ${state.activeProvider.label}`;
    subTitle = state.activeProvider.description;
  }

  if (federate) {
    dialogTitle += `: ${translate('authentication_auth_federated')}`;
    subTitle = 'authentication_identity_provider_dialog_subtitle';
  }

  if (additional) {
    subTitle = 'authentication_request_token';
  }

  async function login() {
    await state.login(link);
    rejectDialog();
  }

  function navToSettings() {
    rejectDialog();
    authenticationService.configureAuthProvider?.();
  }

  function renderForm(provider: AuthProvider | null) {
    if (!provider) {
      return <TextPlaceholder>{translate('authentication_select_provider')}</TextPlaceholder>;
    }

    if (state.configure) {
      return (
        <TextPlaceholder>
          {translate('authentication_provider_disabled')}
          {authenticationService.configureAuthProvider && (
            <Link onClick={() => { navToSettings(); }}>
              <Translate token="ui_configure" />
            </Link>
          )}
        </TextPlaceholder>
      );
    }

    return (
      <AuthProviderForm
        provider={provider}
        credentials={state.credentials}
        authenticate={state.authenticating}
      />
    );
  }

  return styled(useStyles(BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES))(
    <TabsState currentTabId={state.tabId} onChange={tabData => { state.setTabId(tabData.tabId); }}>
      <CommonDialogWrapper
        size='large'
        title={dialogTitle}
        icon={state.activeProvider?.icon}
        subTitle={subTitle}
        footer={!federate && (
          <AuthDialogFooter
            authAvailable={!state.configure}
            isAuthenticating={state.authenticating}
            onLogin={login}
          >
            {state.exception && (
              <ErrorMessage
                text={errorDetails.details?.message || ''}
                hasDetails={errorDetails.details?.hasDetails}
                onShowDetails={errorDetails.open}
              />
            )}
          </AuthDialogFooter>
        )}
        noBodyPadding
        onReject={options?.persistent ? undefined : rejectDialog}
      >
        {showTabs && (
          <TabList aria-label='Auth providers'>
            {state.providers.map(provider => (
              <Tab
                key={provider.id}
                tabId={provider.id}
                title={provider.description || provider.label}
                disabled={state.authenticating}
                onClick={() => { state.setActiveProvider(provider); }}
              >
                <TabTitle>{provider.label}</TabTitle>
              </Tab>
            ))}
            {state.configurations.length > 0 && (
              <Tab
                key={FEDERATED_AUTH}
                tabId={FEDERATED_AUTH}
                title={translate('authentication_auth_federated')}
                disabled={state.authenticating}
                onClick={() => { state.setActiveProvider(null); }}
              >
                <TabTitle>{translate('authentication_auth_federated')}</TabTitle>
              </Tab>
            )}
          </TabList>
        )}
        <SubmittingForm {...use({ form: !federate })} onSubmit={login}>
          <Loader state={state.loadingState}>
            {() => federate
              ? (
                <ConfigurationsList providers={state.configurations} onClose={rejectDialog} />
              )
              : renderForm(state.activeProvider)}
          </Loader>
        </SubmittingForm>
      </CommonDialogWrapper>
    </TabsState>
  );
});
