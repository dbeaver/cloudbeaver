/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import { DBDriver } from '@dbeaver/core/app';
import { Radio, InputField } from '@dbeaver/core/blocks';
import { useTranslate } from '@dbeaver/core/localization';
import { useStyles } from '@dbeaver/core/theming';

import { ConnectionType } from '../ConnectionFormDialogController';
import { CredentialsForm } from './CredentialsForm';
import { formStyles } from './formStyles';
import { IFormController } from './IFormController';
import { ParametersForm } from './ParametersForm';

type ConnectionFormProps = {
  driver: DBDriver | null;
  controller: IFormController;
}

export const ConnectionForm = observer(function ConnectionForm({
  driver,
  controller,
}: ConnectionFormProps) {
  const translate = useTranslate();

  return styled(useStyles(formStyles))(
    <>
      <connection-type as="div">
        <Radio
          name="type"
          id="custom"
          value="custom"
          onClick={() => controller.onChangeType(ConnectionType.Attributes)}
          checked={controller.connectionType === ConnectionType.Attributes}
          disabled={controller.isConnecting}
          mod={['primary']}
        >
          {translate('customConnection_connectionType_custom')}
        </Radio>
        <Radio
          name="type"
          id="url"
          value="url"
          onClick={() => controller.onChangeType(ConnectionType.URL)}
          checked={controller.connectionType === ConnectionType.URL}
          disabled={controller.isConnecting}
          mod={['primary']}
        >
          {translate('customConnection_connectionType_url')}
        </Radio>
      </connection-type>
      {controller.connectionType === ConnectionType.Attributes ? (
        <ParametersForm controller={controller} embedded={driver?.embedded} />
      ) : (
        <group as="div">
          <InputField
            type="text"
            name="url"
            value={controller.config.url}
            onChange={value => controller.onChange('url', value)}
            disabled={controller.isConnecting}
            mod='surface'
          >
            {translate('customConnection_url_JDBC')}
          </InputField>
        </group>
      )}
      {!driver?.anonymousAccess && <CredentialsForm controller={controller}/>}
    </>
  );
});
