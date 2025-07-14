/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { ADMIN_USERNAME_MIN_LENGTH, AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource, PasswordPolicyService } from '@cloudbeaver/core-authentication';
import { DEFAULT_NAVIGATOR_VIEW_SETTINGS } from '@cloudbeaver/core-connections';
import { ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { DefaultNavigatorSettingsResource, PasswordPolicyResource, ProductInfoResource, ServerConfigResource } from '@cloudbeaver/core-root';
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import { isObjectsEqual, isValuesEqual } from '@cloudbeaver/core-utils';

import { MIN_SESSION_EXPIRE_TIME } from './Form/MIN_SESSION_EXPIRE_TIME.js';
import type { IServerConfigurationFormPartState } from './IServerConfigurationFormPartState.js';

function DEFAULT_STATE_GETTER(): IServerConfigurationFormPartState {
  return {
    serverConfig: {
      adminCredentialsSaveEnabled: false,
      anonymousAccessEnabled: false,
      authenticationEnabled: false,
      customConnectionsEnabled: false,
      disabledDrivers: [],
      enabledAuthProviders: [],
      enabledFeatures: [],
      publicCredentialsSaveEnabled: false,
      resourceManagerEnabled: false,
      secretManagerEnabled: false,
      serverName: '',
      serverURL: '',
      sessionExpireTime: MIN_SESSION_EXPIRE_TIME * 1000 * 60,
    },
    navigatorConfig: { ...DEFAULT_NAVIGATOR_VIEW_SETTINGS },
  };
}

export class ServerConfigurationFormPart extends FormPart<IServerConfigurationFormPartState> {
  constructor(
    formState: IFormState<null>,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly productInfoResource: ProductInfoResource,
    private readonly defaultNavigatorSettingsResource: DefaultNavigatorSettingsResource,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly passwordPolicyResource: PasswordPolicyResource,
    private readonly passwordPolicyService: PasswordPolicyService,
  ) {
    super(formState, DEFAULT_STATE_GETTER());
  }

  override isOutdated(): boolean {
    return super.isOutdated() || this.serverConfigResource.isOutdated() || this.defaultNavigatorSettingsResource.isOutdated();
  }

  override isLoaded(): boolean {
    return super.isLoaded() && this.serverConfigResource.isLoaded() && this.defaultNavigatorSettingsResource.isLoaded();
  }

  protected override async validate(
    data: IFormState<IServerConfigurationFormPartState>,
    contexts: IExecutionContextProvider<IFormState<IServerConfigurationFormPartState>>,
  ) {
    if (this.administrationScreenService.isConfigurationMode) {
      await this.authProvidersResource.load(CachedMapAllKey);

      if (this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID)) {
        await this.passwordPolicyResource.load();

        const isNameValid = this.state.serverConfig.adminName && this.state.serverConfig.adminName.length >= ADMIN_USERNAME_MIN_LENGTH;
        const isPasswordValid = this.passwordPolicyService.validatePassword(this.state.serverConfig.adminPassword ?? '');
        const isPasswordRepeated = isValuesEqual(this.state.serverConfig.adminPassword, this.state.serverConfig.adminPasswordRepeat, null);

        if (!isNameValid || !isPasswordValid.isValid || !isPasswordRepeated) {
          ExecutorInterrupter.interrupt(contexts);
        }
      }
    }
  }

  protected override format() {
    if (this.state.serverConfig.adminName) {
      this.state.serverConfig.adminName = this.state.serverConfig.adminName.trim();
    }

    if (this.state.serverConfig.adminPassword) {
      this.state.serverConfig.adminPassword = this.state.serverConfig.adminPassword.trim();
    }

    if (this.state.serverConfig.serverName) {
      this.state.serverConfig.serverName = this.state.serverConfig.serverName.trim();
    }

    if (this.state.serverConfig.serverURL) {
      this.state.serverConfig.serverURL = this.state.serverConfig.serverURL.trim();
    }
  }

  override get isChanged(): boolean {
    if (this.loaded && this.administrationScreenService.isConfigurationMode) {
      return true;
    }

    return super.isChanged;
  }

  protected override async saveChanges() {
    if (!isObjectsEqual(this.state.navigatorConfig, this.initialState.navigatorConfig)) {
      await this.defaultNavigatorSettingsResource.save(this.state.navigatorConfig);
    }

    // Exclude adminPasswordRepeat from server payload as it's only for client-side validation
    const { adminPasswordRepeat, ...serverConfigToSave } = this.state.serverConfig;
    await this.serverConfigResource.save(serverConfigToSave);
  }

  protected override async loader() {
    const [config, productInfo, defaultNavigatorSettings] = await Promise.all([
      this.serverConfigResource.load(),
      this.productInfoResource.load(),
      this.defaultNavigatorSettingsResource.load(),
    ]);

    let adminName: string | undefined;
    let adminPassword: string | undefined;

    if (this.administrationScreenService.isConfigurationMode) {
      await this.authProvidersResource.load(CachedMapAllKey);

      if (this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID)) {
        adminName = 'cbadmin';
        adminPassword = '';
      }
    }

    this.setInitialState({
      serverConfig: {
        adminName,
        adminPassword,
        serverName: config?.name || productInfo?.name,
        serverURL: this.administrationScreenService.isConfigurationMode && !config?.distributed ? window.location.origin : (config?.serverURL ?? ''),
        sessionExpireTime: config?.sessionExpireTime ?? MIN_SESSION_EXPIRE_TIME * 1000 * 60,
        adminCredentialsSaveEnabled: config?.adminCredentialsSaveEnabled ?? false,
        publicCredentialsSaveEnabled: config?.publicCredentialsSaveEnabled ?? false,
        customConnectionsEnabled: config?.supportsCustomConnections ?? false,
        disabledDrivers: config?.disabledDrivers ? [...config.disabledDrivers] : [],
        enabledAuthProviders: config?.enabledAuthProviders ? [...config.enabledAuthProviders] : [],
        anonymousAccessEnabled: config?.anonymousAccessEnabled ?? false,
        enabledFeatures: config?.enabledFeatures ? [...config.enabledFeatures] : [],
        resourceManagerEnabled: config?.resourceManagerEnabled ?? false,
        secretManagerEnabled: config?.secretManagerEnabled ?? false,
      },
      navigatorConfig: { ...this.state.navigatorConfig, ...defaultNavigatorSettings },
    });
  }
}
