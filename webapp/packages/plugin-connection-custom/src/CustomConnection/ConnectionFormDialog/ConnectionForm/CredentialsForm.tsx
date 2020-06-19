/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import { InputField } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { formStyles } from './formStyles';
import { IFormController } from './IFormController';

type CredentialsFormProps = {
  controller: IFormController;
}

export const CredentialsForm = observer(function CredentialsForm({
  controller,
}: CredentialsFormProps) {
  const translate = useTranslate();

  return styled(useStyles(formStyles))(
    <>
      <hr/>
      <group as="div">
        <InputField
          type="text"
          name="userName"
          value={controller.config.userName}
          onChange={value => controller.onChange('userName', value)}
          disabled={controller.isConnecting}
          mod='surface'
        >
          {translate('customConnection_userName')}
        </InputField>
        <InputField
          type="password"
          name="userPassword"
          value={controller.config.userPassword}
          onChange={value => controller.onChange('userPassword', value)}
          disabled={controller.isConnecting}
          mod='surface'
        >
          {translate('customConnection_Password')}
        </InputField>
      </group>
    </>
  );
});
