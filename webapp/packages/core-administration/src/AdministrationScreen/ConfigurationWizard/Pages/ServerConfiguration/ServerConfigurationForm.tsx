/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import {
  SubmittingForm, InputGroup, InputField, useFocus, Switch
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ServerConfigInput } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { ServerConfigurationService } from './ServerConfigurationService';

export const formStyles = css`
  SubmittingForm {
    flex: 1;
    display: flex;
    overflow: auto;
    flex-direction: row;
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

export const ServerConfigurationForm = observer(function ServerConfigurationForm({
  serverConfig,
  onChange,
  onSave,
}: Props) {
  const service = useService(ServerConfigurationService);
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  useEffect(() => {
    const validate = () => {
      focusedRef.current?.checkValidity();
      focusedRef.current?.reportValidity();
    };
    service.validationTask.addHandler(validate);

    return () => service.validationTask.removeHandler(validate);
  }, [service]);

  return styled(useStyles(formStyles, boxStyles))(
    <SubmittingForm onSubmit={onSave} name='server_config' ref={focusedRef}>
      <box as="div">
        <box-element as='div'>
          <group as="div">
            <InputGroup long>{translate('administration_configuration_wizard_configuration_server_info')}</InputGroup>
          </group>
          <group as="div">
            <InputField
              type="text"
              name='serverName'
              state={serverConfig}
              mod='surface'
              required
              long
            >
              {translate('administration_configuration_wizard_configuration_server_name')}
            </InputField>
          </group>
          <group as="div">
            <InputGroup long>{translate('administration_configuration_wizard_configuration_admin')}</InputGroup>
          </group>
          <InputField
            type="text"
            name="adminName"
            state={serverConfig}
            mod='surface'
            minLength={6}
            required
            long
          >
            {translate('administration_configuration_wizard_configuration_admin_name')}
          </InputField>
          <InputField
            type="password"
            name="adminPassword"
            state={serverConfig}
            autoComplete='new-password'
            mod='surface'
            required
            long
          >
            {translate('administration_configuration_wizard_configuration_admin_password')}
          </InputField>
        </box-element>
        <box-element as='div'>
          <group as="div">
            <InputGroup long>{translate('administration_configuration_wizard_configuration_plugins')}</InputGroup>
          </group>
          <group as="div">
            <Switch
              name="anonymousAccessEnabled"
              state={serverConfig}
              description={translate('administration_configuration_wizard_configuration_anonymous_access_description')}
              mod={['primary']}
              disabled={!serverConfig.authenticationEnabled}
              long
            >
              {translate('administration_configuration_wizard_configuration_anonymous_access')}
            </Switch>
          </group>
          <group as="div">
            <Switch
              name="authenticationEnabled"
              state={serverConfig}
              description={translate('administration_configuration_wizard_configuration_authentication_description')}
              onChange={onChange}
              mod={['primary']}
              long
            >
              {translate('administration_configuration_wizard_configuration_authentication')}
            </Switch>
          </group>
          <group as="div">
            <Switch
              name="customConnectionsEnabled"
              state={serverConfig}
              description={translate('administration_configuration_wizard_configuration_custom_connections_description')}
              mod={['primary']}
              long
            >
              {translate('administration_configuration_wizard_configuration_custom_connections')}
            </Switch>
          </group>
        </box-element>
      </box>
    </SubmittingForm>
  );
});
