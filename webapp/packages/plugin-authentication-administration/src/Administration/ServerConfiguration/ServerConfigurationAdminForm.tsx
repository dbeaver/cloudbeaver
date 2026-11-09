/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useId } from 'react';

import { ADMIN_USERNAME_MIN_LENGTH } from '@cloudbeaver/core-authentication';
import {
  Card,
  CardHeader,
  CardSection,
  CardTitle,
  Container,
  InputField,
  s,
  useFormCustomInputValidation,
  usePasswordValidation,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { isValuesEqual } from '@cloudbeaver/core-utils';
import type { IServerConfig } from '@cloudbeaver/plugin-administration';

import styles from './ServerConfigurationAdminForm.module.css';

interface Props {
  serverConfig: IServerConfig;
}

export const ServerConfigurationAdminForm = observer<Props>(function ServerConfigurationAdminForm({ serverConfig }) {
  const translate = useTranslate();
  const titleId = useId();
  const classes = useS(styles);
  const passwordValidationRef = usePasswordValidation();

  const { ref: passwordRepeatRef } = useFormCustomInputValidation<string>(value => {
    if (!isValuesEqual(value, serverConfig.adminPassword, null)) {
      return translate('authentication_user_passwords_not_match');
    }

    return null;
  });

  return (
    <Card aria-labelledby={titleId} className={s(classes, { card: true })}>
      <CardHeader>
        <CardTitle id={titleId}>{translate('administration_configuration_wizard_configuration_admin')}</CardTitle>
      </CardHeader>
      <CardSection>
        <Container gap vertical noWrap>
          <InputField type="text" name="adminName" state={serverConfig} minLength={ADMIN_USERNAME_MIN_LENGTH} required>
            {translate('administration_configuration_wizard_configuration_admin_name')}
          </InputField>
          <div className={s(classes, { passwords: true })}>
            <InputField ref={passwordValidationRef} type="password" name="adminPassword" state={serverConfig} autoComplete="new-password" required>
              {translate('administration_configuration_wizard_configuration_admin_password')}
            </InputField>
            {/* @ts-ignore We need adminPasswordRepeat in state to validate it on navigation, but we don't have this field in serverConfig  */}
            <InputField ref={passwordRepeatRef} state={serverConfig} type="password" name="adminPasswordRepeat" autoComplete="new-password" required>
              {translate('authentication_user_password_repeat')}
            </InputField>
          </div>
        </Container>
      </CardSection>
    </Card>
  );
});
