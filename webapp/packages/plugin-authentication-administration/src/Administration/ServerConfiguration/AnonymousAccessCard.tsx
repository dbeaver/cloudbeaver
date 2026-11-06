/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useId } from 'react';

import { IconOrImage, Switch, useTranslate } from '@cloudbeaver/core-blocks';
import type { IServerConfig } from '@cloudbeaver/plugin-administration';

import { AuthenticationOptionCard } from './AuthenticationOptionCard.js';

interface Props {
  serverConfig: IServerConfig;
  disabled?: boolean;
}

export const AnonymousAccessCard = observer<Props>(function AnonymousAccessCard({ serverConfig, disabled }) {
  const translate = useTranslate();
  const id = useId();

  if (serverConfig.anonymousAccessEnabled == null) {
    return null;
  }

  return (
    <AuthenticationOptionCard
      controlId={id}
      label={translate('administration_configuration_wizard_configuration_anonymous_access')}
      description={translate('administration_configuration_wizard_configuration_anonymous_access_description')}
      disabled={disabled}
      iconSlot={<IconOrImage icon="/icons/user.svg" width={24} />}
      typeSlot={translate('authentication_administration_providers_built_in')}
      controlSlot={
        <Switch
          id={id}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-description`}
          name="anonymousAccessEnabled"
          state={serverConfig}
          disabled={disabled}
          small
          autoHide
        />
      }
    />
  );
});
