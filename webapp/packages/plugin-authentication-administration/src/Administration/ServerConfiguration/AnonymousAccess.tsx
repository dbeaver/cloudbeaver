/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource, AuthSettingsService } from '@cloudbeaver/core-authentication';
import { FormContext, type PlaceholderComponent, Switch, useExecutor, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { IConfigurationPlaceholderProps } from '@cloudbeaver/plugin-administration';

export const AnonymousAccess: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(function AuthenticationProviders({
  state: { serverConfig },
}) {
  const providers = useResource(AuthenticationProviders, AuthProvidersResource, CachedMapAllKey);
  const translate = useTranslate();
  const formContext = useContext(FormContext);
  const authSettingsService = useService(AuthSettingsService);

  if (formContext === null) {
    throw new Error('Form state should be provided');
  }

  const localProvider = providers.resource.get(AUTH_PROVIDER_LOCAL_ID);
  const authenticationDisabled = serverConfig.enabledAuthProviders?.length === 0;
  const isAnonymousAccessDisabled = authSettingsService.disableAnonymousAccess;

  useExecutor({
    executor: formContext.onChange,
    handlers: [
      function switchControls() {
        if (serverConfig.enabledAuthProviders?.length === 0) {
          if (localProvider && !isAnonymousAccessDisabled) {
            serverConfig.anonymousAccessEnabled = true;
          }
        }
      },
    ],
  });

  if (!localProvider || isAnonymousAccessDisabled) {
    return null;
  }

  return (
    <Switch
      name="anonymousAccessEnabled"
      state={serverConfig}
      description={translate('administration_configuration_wizard_configuration_anonymous_access_description')}
      mod={['primary']}
      disabled={authenticationDisabled}
      small
      autoHide
    >
      {translate('administration_configuration_wizard_configuration_anonymous_access')}
    </Switch>
  );
});
