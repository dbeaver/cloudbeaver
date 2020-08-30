/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import {
  SubmittingForm, InputGroup, InputField, Checkbox, useFocus, Switch
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ServerConfigInput, NavigatorSettingsInput } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

export const formStyles = css`
  connection-form {
    flex: 1;
    display: flex;
    overflow: auto;
    flex-direction: row;
  }
  layout-grid {
    flex: 1;
  }
  connection-type {
    margin-left: 150px;
  }
  Radio {
    composes: theme-typography--body1 from global;
  }
  sub-label {
    composes: theme-typography--caption from global;
    line-height: 14px;
  }
  group {
    box-sizing: border-box;
    display: flex;
  }
`;

const boxStyles = css`
  box {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
  }
  box-element {
    width: 450px;
  }
`;

type Props = {
  serverConfig: ServerConfigInput;
  onChange: () => void;
  onSave: () => void;
}

export const WelcomeConfigForm = observer(function WelcomeConfigForm({
  serverConfig,
  onChange,
  onSave,
}: Props) {
  const translate = useTranslate();
  const [focusedRef] = useFocus({ focusFirstChild: true });

  return styled(useStyles(formStyles, boxStyles))(
    <SubmittingForm onSubmit={onSave} name='server_config' ref={focusedRef as React.RefObject<HTMLFormElement>}>
      <connection-form as='div'>
        <box as="div">
          <box-element as='div'>
            <group as="div">
              <InputField
                type="text"
                name='serverName'
                state={serverConfig}
                mod='surface'
                required
              >
                {translate('administration_configuration_wizard_welcome_server_name')}
              </InputField>
            </group>
            <group as="div">
              <InputGroup>{translate('administration_configuration_wizard_welcome_admin')}</InputGroup>
            </group>
            <InputField
              type="text"
              name="adminName"
              state={serverConfig}
              mod='surface'
              required
            >
              {translate('administration_configuration_wizard_welcome_admin_name')}
            </InputField>
            <InputField
              type="password"
              name="adminPassword"
              state={serverConfig}
              mod='surface'
              required
            >
              {translate('administration_configuration_wizard_welcome_admin_password')}
            </InputField>
            <group as="div">
              <InputGroup>{translate('administration_configuration_wizard_welcome_plugins')}</InputGroup>
            </group>
            <group as="div">
              <Switch
                name="anonymousAccessEnabled"
                state={serverConfig}
                description={translate('administration_configuration_wizard_welcome_anonymous_access_description')}
                mod={['primary']}
                disabled={!serverConfig.authenticationEnabled}
              >
                {translate('administration_configuration_wizard_welcome_anonymous_access')}
              </Switch>
            </group>
            <group as="div">
              <Switch
                name="authenticationEnabled"
                state={serverConfig}
                description={translate('administration_configuration_wizard_welcome_authentication_description')}
                onChange={onChange}
                mod={['primary']}
              >
                {translate('administration_configuration_wizard_welcome_authentication')}
              </Switch>
            </group>
            <group as="div">
              <Switch
                name="customConnectionsEnabled"
                state={serverConfig}
                description={translate('administration_configuration_wizard_welcome_custom_connections_description')}
                mod={['primary']}
              >
                {translate('administration_configuration_wizard_welcome_custom_connections')}
              </Switch>
            </group>
          </box-element>
        </box>
      </connection-form>
    </SubmittingForm>
  );
});
