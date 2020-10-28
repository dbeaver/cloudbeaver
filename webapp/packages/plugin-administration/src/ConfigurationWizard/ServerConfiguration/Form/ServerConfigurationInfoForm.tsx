
/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { FormGroup, InputGroup, InputField } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ServerConfigInput } from '@cloudbeaver/core-sdk';

interface Props {
  serverConfig: ServerConfigInput;
}

export const ServerConfigurationInfoForm: React.FC<Props> = observer(function ServerConfigurationInfoForm({
  serverConfig,
}) {
  const translate = useTranslate();
  return (
    <>
      <FormGroup>
        <InputGroup long>{translate('administration_configuration_wizard_configuration_server_info')}</InputGroup>
      </FormGroup>
      <FormGroup>
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
      </FormGroup>
      <FormGroup>
        <InputField
          type="number"
          name='sessionExpireTime'
          state={serverConfig}
          mod='surface'
          required
          long
        >
          {translate('administration_configuration_wizard_configuration_server_session_lifetime')}
        </InputField>
      </FormGroup>
    </>
  );
});
