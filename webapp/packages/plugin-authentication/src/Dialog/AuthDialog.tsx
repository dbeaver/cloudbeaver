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
import { AuthProvider, AuthProvidersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import {
  SubmittingForm, TabsState, TabList, Tab, TabTitle, Loader, UNDERLINE_TAB_STYLES, ErrorMessage, TextPlaceholder, Link
} from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { Translate, useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';
// import { ServerConfigurationAdministrationNavService } from '@cloudbeaver/plugin-administration';

import { AuthDialogController } from './AuthDialogController';
import { AuthDialogFooter } from './AuthDialogFooter';
import { AuthProviderForm } from './AuthProviderForm/AuthProviderForm';
import { ConfigurationsList } from './AuthProviderForm/ConfigurationsList';

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
    ConfigurationsList {
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
  const authProvidersResource = useService(AuthProvidersResource);
  const administrationScreenService = useService(AdministrationScreenService);
  const userInfo = useService(UserInfoResource);
  const controller = useController(AuthDialogController, link, providerId, rejectDialog);
  const translate = useTranslate();
  const isAdminPage = administrationScreenService.activeScreen !== null;

  if (isAdminPage) {
    controller.setAdminMode(isAdminPage, providerId);
  }

  const additional = userInfo.data !== null
    && controller.provider?.id !== undefined
    && !userInfo.hasToken(controller.provider.id);

  const showTabs = controller.providers.length > 1;
  const configurable = !!controller.provider?.configurable;
  let providerEnabled = false;

  if (controller.provider && (
    (isAdminPage && authProvidersResource.isPrimary(controller.provider.id))
    || authProvidersResource.isAuthEnabled(controller.provider.id)
  )) {
    providerEnabled = true;
  }

  const dialogTitle = `${controller.provider?.label || ''} ${translate('authentication_login_dialog_title')}`;
  let subTitle = controller.provider?.description;

  if (configurable) {
    subTitle = 'authentication_identity_provider_dialog_subtitle';
  }

  if (additional) {
    subTitle = 'authentication_request_token';
  }

  function navToSettings() {
    rejectDialog();
    // authConfigurationsAdministrationNavService.navToSettings();
  }

  function renderForm(provider: AuthProvider) {
    if (configurable) {
      return <ConfigurationsList provider={provider} onClose={rejectDialog} />;
    }

    return (
      <AuthProviderForm
        provider={provider}
        credentials={controller.credentials}
        authenticate={controller.isAuthenticating}
      />
    );
  }

  return styled(useStyles(styles, UNDERLINE_TAB_STYLES))(
    <TabsState currentTabId={controller.provider?.id} onChange={tabData => controller.selectProvider(tabData.tabId)}>
      <CommonDialogWrapper
        size='large'
        title={dialogTitle}
        icon={controller.provider?.icon}
        subTitle={subTitle}
        footer={!configurable && (
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
            {controller.providers.map(provider => (
              <Tab
                key={provider.id}
                tabId={provider.id}
                title={provider.description || provider.label}
                disabled={controller.isAuthenticating}
              >
                <TabTitle>{provider.label}</TabTitle>
              </Tab>
            ))}
          </TabList>
        )}
        <SubmittingForm {...use({ form: !configurable })} onSubmit={controller.login}>
          {controller.provider && (
            <>
              {providerEnabled
                ? (
                    renderForm(controller.provider)
                  )
                : (
                <TextPlaceholder>
                  {translate('authentication_provider_disabled')}
                  <Link onClick={() => navToSettings()}>
                    <Translate token="ui_configure" />
                  </Link>
                </TextPlaceholder>
                  )}
            </>
          )}
          {controller.isLoading && <Loader />}
          {!controller.isLoading && !controller.provider && (
            <TextPlaceholder>
              {controller.providers.length > 0
                ? (
                <>{translate('authentication_select_provider')}</>
                  )
                : (
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
