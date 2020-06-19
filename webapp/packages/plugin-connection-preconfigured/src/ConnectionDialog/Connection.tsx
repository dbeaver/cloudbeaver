/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { InputField } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
  custom-connection {
    flex: 1;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  InputField {
    min-width: 380px;
  }
`;

type ConnectionProps = {
  userName?: string;
  userPassword?: string;
  isConnecting: boolean;
  onChange(property: 'userName' | 'userPassword', value: string): void;
}

export const Connection = observer(function Connection({
  userName, userPassword, isConnecting, onChange,
}: ConnectionProps) {
  const translate = useTranslate();

  return styled(useStyles(styles))(
    <custom-connection as="div">
      <center as="div">
        <InputField
          type="string"
          name="userName"
          value={userName}
          onChange={value => onChange('userName', value)}
          disabled={isConnecting}
          mod='surface'
        >
          {translate('customConnection_userName')}
        </InputField>
        <InputField
          type="password"
          name="userPassword"
          value={userPassword}
          onChange={value => onChange('userPassword', value)}
          disabled={isConnecting}
          mod='surface'
        >
          {translate('customConnection_Password')}
        </InputField>
      </center>
    </custom-connection>
  );
});
