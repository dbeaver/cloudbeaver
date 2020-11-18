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
  InputField,
  useFocus,
  ObjectPropertyInfoForm,
  InputGroup,
  FieldCheckbox,
  SubmittingForm,
  FormBox,
  FormBoxElement,
  FormGroup,
} from '@cloudbeaver/core-blocks';
import { DBDriver } from '@cloudbeaver/core-connections';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { IFormController } from './IFormController';
import { ParametersForm } from './ParametersForm';

interface ConnectionFormProps {
  driver: DBDriver | null;
  controller: IFormController;
}

const connectionFormStyles = css`
  SubmittingForm {
    flex: 1;
  }
  FormBoxElement {
    flex: 1;
  }
  FormBox {
    padding: 24px 4px 24px;
  }
`;

export const ConnectionForm = observer(function ConnectionForm({
  driver,
  controller,
}: ConnectionFormProps) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  return styled(useStyles(connectionFormStyles))(
    <SubmittingForm ref={focusedRef}>
      <FormBox>
        <FormBoxElement>
          {controller.isUrlConnection ? (
            <FormGroup>
              <InputField
                type="text"
                name="url"
                value={controller.config.url}
                disabled={controller.isConnecting}
                mod='surface'
                onChange={value => controller.onChange('url', value)}
              >
                {translate('customConnection_url_JDBC')}
              </InputField>
            </FormGroup>
          ) : (
            <ParametersForm controller={controller} embedded={driver?.embedded} />
          )}
          {controller.authModel && (
            <>
              <FormGroup>
                <InputGroup>{translate('connections_connection_edit_authentication')}</InputGroup>
              </FormGroup>
              <ObjectPropertyInfoForm
                autofillToken='new-password'
                properties={controller.authModel.properties}
                credentials={controller.config.credentials}
                disabled={controller.isConnecting}
              />
              <FormGroup>
                <FieldCheckbox
                  name="saveCredentials"
                  value={controller.authModel.id}
                  state={controller.config}
                  checkboxLabel={translate('connections_connection_edit_save_credentials')}
                  disabled={controller.isConnecting}
                  mod='surface'
                />
              </FormGroup>
            </>
          )}
        </FormBoxElement>
      </FormBox>
    </SubmittingForm>
  );
});
