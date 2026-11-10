/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useId, type ReactNode } from 'react';

import { AUTH_PROVIDER_LOCAL_ID, type AuthProvider } from '@cloudbeaver/core-authentication';
import { IconOrImage, Switch, useTranslate } from '@cloudbeaver/core-blocks';
import type { IServerConfig } from '@cloudbeaver/plugin-administration';

import { AuthenticationOptionCard } from './AuthenticationOptionCard.js';

interface Props {
  provider: AuthProvider;
  serverConfig: IServerConfig;
  actionsSlot?: ReactNode;
}

export const AuthenticationProviderCard = observer<Props>(function AuthenticationProviderCard({ provider, serverConfig, actionsSlot }) {
  const translate = useTranslate();
  const id = useId();

  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const missingFeatures = provider.requiredFeatures.filter(feature => !serverConfig.enabledFeatures?.includes(feature));
  const disabled = missingFeatures.length > 0;

  const tooltip = disabled
    ? translate('authentication_administration_providers_required_features', undefined, { features: missingFeatures.join(', ') })
    : undefined;

  if (serverConfig.enabledAuthProviders == null) {
    return null;
  }

  return (
    <AuthenticationOptionCard
      controlId={id}
      label={provider.label}
      description={provider.description}
      disabled={disabled}
      title={tooltip}
      iconSlot={<IconOrImage icon={provider.icon ?? '/icons/user.svg'} width={24} />}
      typeSlot={provider.id === AUTH_PROVIDER_LOCAL_ID ? translate('authentication_administration_providers_built_in') : provider.id}
      controlSlot={
        <Switch
          id={id}
          aria-labelledby={labelId}
          aria-describedby={provider.description ? descriptionId : undefined}
          value={provider.id}
          name="enabledAuthProviders"
          state={serverConfig}
          disabled={disabled}
          small
          autoHide
        />
      }
      actionsSlot={actionsSlot}
    />
  );
});
