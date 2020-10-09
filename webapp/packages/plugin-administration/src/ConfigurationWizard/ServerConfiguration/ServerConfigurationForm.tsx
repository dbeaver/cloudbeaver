/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback, useEffect } from 'react';
import styled, { css } from 'reshadow';

import {
  SubmittingForm, InputGroup, InputField, useFocus, Switch, Button
} from '@cloudbeaver/core-blocks';
import { IExecutor } from '@cloudbeaver/core-executor';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ServerConfigInput } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

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
  Button {
    margin: 12px;
    margin-left: 24px;
    float: right;
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

interface Props {
  serverConfig: ServerConfigInput;
  validationTask?: IExecutor<boolean>;
  editing?: boolean;
  onChange: () => void;
  onSubmit: () => void;
}

export const ServerConfigurationForm = observer(function ServerConfigurationForm({
  serverConfig,
  validationTask,
  editing,
  onChange,
  onSubmit,
}: Props) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  const validate = useCallback(() => {
    focusedRef.current?.checkValidity();
    focusedRef.current?.reportValidity();
  }, []);

  useEffect(() => {
    if (!validationTask) {
      return;
    }
    validationTask.addHandler(validate);

    return () => validationTask.removeHandler(validate);
  }, [validationTask]);

  return styled(useStyles(formStyles, boxStyles))(
    <SubmittingForm ref={focusedRef} name='server_config' onSubmit={onSubmit}>
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
          {editing
            ? <group as="div"><Button mod={['raised']}>Save</Button></group>
            : (
                <>
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
                </>
              )}
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
              mod={['primary']}
              long
              onChange={onChange}
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
