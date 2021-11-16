/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AuthProvider, AuthProvidersResource, isConfigurable, UserInfoResource } from '@cloudbeaver/core-authentication';
import {
  SubmittingForm, TabsState, TabList, Tab, TabTitle, Loader,
  UNDERLINE_TAB_STYLES, ErrorMessage, TextPlaceholder, Link
} from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { Translate, useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';
// import { ServerConfigurationAdministrationNavService } from '@cloudbeaver/plugin-administration';

import { CONFIGURABLE_PROVIDERS_ID } from '../CONFIGURABLE_PROVIDERS_ID';
import { AuthDialogController } from './AuthDialogController';
import { AuthDialogFooter } from './AuthDialogFooter';
import { AuthProviderForm } from './AuthProviderForm/AuthProviderForm';
import { FederatedConfigurations } from './AuthProviderForm/FederatedConfigurations';

const styles = composes(
  css`
    ErrorMessage {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
`,
  css`
    CommonDialogWrapper {
      min-height: 490px !important;
      max-height: max(100vh - 48px, 490px) !important;
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
    FederatedConfigurations {
      margin-top: 12px;
    }
    ErrorMessage {
      flex: 1;
    }
`);

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
  // const authConfigurationsAdministrationNavService = useService(ServerConfigurationAdministrationNavService);
  const style = useStyles(styles, UNDERLINE_TAB_STYLES);
  const translate = useTranslate();
  const authProvidersResource = useService(AuthProvidersResource);
  const administrationScreenService = useService(AdministrationScreenService);
  const userInfo = useService(UserInfoResource);
  const controller = useController(AuthDialogController, link, providerId, rejectDialog);

  const isAdminPage = administrationScreenService.activeScreen !== null;

  if (isAdminPage) {
    controller.setAdminMode(isAdminPage, providerId);
  }

  const additional = userInfo.data !== null
    && controller.provider?.id !== undefined
    && !userInfo.hasToken(controller.provider.id);

  let providerEnabled = false;

  if (controller.provider && (
    (isAdminPage && authProvidersResource.isPrimary(controller.provider.id))
    || authProvidersResource.isAuthEnabled(controller.provider.id)
  )) {
    providerEnabled = true;
  }

  const providers: AuthProvider[] = [];
  const identityProviders: AuthProvider[] = [];

  for (const provider of controller.providers) {
    if (isConfigurable(provider)) {
      identityProviders.push(provider);
    } else {
      providers.push(provider);
    }
  }

  const federated = controller.selectedTab === CONFIGURABLE_PROVIDERS_ID;
  const showTabs = providers.length > 0 || federated;

  let dialogTitle = `${translate('authentication_login_dialog_title')}${controller.provider?.label ? ': ' + controller.provider.label : ''} `;
  let subTitle = controller.provider?.description;

  if (federated) {
    subTitle = 'authentication_identity_provider_dialog_subtitle';
    dialogTitle = `${translate('authentication_login_dialog_title')}: ${translate('authentication_federated')}`;
  }

  if (additional) {
    subTitle = 'authentication_request_token';
  }

  function navToSettings() {
    rejectDialog();
    // authConfigurationsAdministrationNavService.navToSettings();
  }

  function getContent() {
    if (federated && identityProviders.length) {
      return styled(style)(
        <FederatedConfigurations providers={identityProviders} onClose={rejectDialog} />
      );
    }

    if (controller.provider) {
      if (providerEnabled) {
        return styled(style)(
          <AuthProviderForm
            provider={controller.provider}
            credentials={controller.credentials}
            authenticate={controller.isAuthenticating}
          />
        );
      } else {
        return styled(style)(
          <TextPlaceholder>
            {translate('authentication_provider_disabled')}
            <Link onClick={() => navToSettings()}>
              <Translate token="ui_configure" />
            </Link>
          </TextPlaceholder>
        );
      }
    }

    return null;
  }

  return styled(useStyles(styles, UNDERLINE_TAB_STYLES))(
    <TabsState
      currentTabId={controller.selectedTab}
      onChange={tabData => controller.handleTabChange(tabData.tabId)}
    >
      <CommonDialogWrapper
        size='large'
        title={dialogTitle}
        icon={controller.provider?.icon}
        subTitle={subTitle}
        footer={!federated && (
          <AuthDialogFooter
            authAvailable={providerEnabled}
            isAuthenticating={controller.isAuthenticating}
            onLogin={controller.login}
          >
            {controller.error?.responseMessage && (
              <ErrorMessage
                text={controller.error.responseMessage}
                hasDetails={controller.error.hasDetails}
                onShowDetails={controller.showDetails}
              />
            )}
          </AuthDialogFooter>
        )}
        noBodyPadding
        onReject={options?.persistent ? undefined : rejectDialog}
      >
        {showTabs && (
          <TabList aria-label='Auth providers'>
            {providers.map(provider => (
              <Tab
                key={provider.id}
                tabId={provider.id}
                title={provider.description || provider.label}
                disabled={controller.isAuthenticating}
              >
                <TabTitle>{provider.label}</TabTitle>
              </Tab>
            ))}
            {identityProviders.length > 0 && (
              <Tab
                tabId={CONFIGURABLE_PROVIDERS_ID}
                title={`${translate('authentication_federated')} ${translate('authentication_login_dialog_title')}`}
                disabled={controller.isAuthenticating}
              >
                <TabTitle>{translate('authentication_federated')}</TabTitle>
              </Tab>
            )}
          </TabList>
        )}
        <SubmittingForm {...use({ form: !federated })} onSubmit={controller.login}>
          {!controller.isLoading && getContent()}
          {controller.isLoading && <Loader />}
          {!controller.isLoading && !controller.provider && !federated && (
            <TextPlaceholder>
              {providers.length > 0 ? (
                <>{translate('authentication_select_provider')}</>
              ) : (
                <>
                  {translate('authentication_configure')}
                  <Link onClick={() => navToSettings()}>
                    <Translate token="ui_configure" />
                  </Link>
                </>
              )}
            </TextPlaceholder>
          )}
        </SubmittingForm>
      </CommonDialogWrapper>
    </TabsState>
  );
});
