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
  SubmittingForm, InputGroup, InputField, Checkbox, useFocus
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
    min-width: 450px;
  }
`;

type Props = {
  serverConfig: ServerConfigInput;
  navigatorConfig: NavigatorSettingsInput;
  onSave: () => void;
}

export const WelcomeConfigForm = observer(function WelcomeConfigForm({
  serverConfig,
  navigatorConfig,
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
            >
              {translate('administration_configuration_wizard_welcome_admin_name')}
            </InputField>
            <InputField
              type="password"
              name="adminPassword"
              state={serverConfig}
              mod='surface'
            >
              {translate('administration_configuration_wizard_welcome_admin_password')}
            </InputField>
            <group as="div">
              <InputGroup>{translate('administration_configuration_wizard_welcome_plugins')}</InputGroup>
            </group>
            <group as="div">
              <Checkbox
                name="anonymousAccessEnabled"
                state={serverConfig}
                checkboxLabel={translate('administration_configuration_wizard_welcome_anonymous_access')}
                mod='surface'
              />
            </group>
            <group as="div">
              <Checkbox
                name="authenticationEnabled"
                state={serverConfig}
                checkboxLabel={translate('administration_configuration_wizard_welcome_authentication')}
                mod='surface'
              />
            </group>
            <group as="div">
              <Checkbox
                name="customConnectionsEnabled"
                state={serverConfig}
                checkboxLabel={translate('administration_configuration_wizard_welcome_custom_connections')}
                mod='surface'
              />
            </group>
          </box-element>
          <box-element as='div' hidden>
            <group as="div">
              <InputGroup>{translate('administration_configuration_wizard_welcome_navigator')}</InputGroup>
            </group>
            <group as="div">
              <Checkbox
                name="hideFolders"
                state={navigatorConfig}
                checkboxLabel={translate('administration_configuration_wizard_welcome_navigator_hide_folders')}
                mod='surface'
              />
            </group>
            <group as="div">
              <Checkbox
                name="hideSchemas"
                state={navigatorConfig}
                checkboxLabel={translate('administration_configuration_wizard_welcome_navigator_hide_schemas')}
                mod='surface'
              />
            </group>
            <group as="div">
              <Checkbox
                name="hideVirtualModel"
                state={navigatorConfig}
                checkboxLabel={translate('administration_configuration_wizard_welcome_navigator_hide_virtual_model')}
                mod='surface'
              />
            </group>
            <group as="div">
              <Checkbox
                name="mergeEntities"
                state={navigatorConfig}
                checkboxLabel={translate('administration_configuration_wizard_welcome_navigator_merge_entities')}
                mod='surface'
              />
            </group>
            <group as="div">
              <Checkbox
                name="showOnlyEntities"
                state={navigatorConfig}
                checkboxLabel={translate('administration_configuration_wizard_welcome_navigator_show_only_entities')}
                mod='surface'
              />
            </group>
            <group as="div">
              <Checkbox
                name="showSystemObjects"
                state={navigatorConfig}
                checkboxLabel={translate('administration_configuration_wizard_welcome_navigator_show_system_objects')}
                mod='surface'
              />
            </group>
            <group as="div">
              <Checkbox
                name="showUtilityObjects"
                state={navigatorConfig}
                checkboxLabel={translate('administration_configuration_wizard_welcome_navigator_show_utility_objects')}
                mod='surface'
              />
            </group>
          </box-element>
        </box>
      </connection-form>
    </SubmittingForm>
  );
});
