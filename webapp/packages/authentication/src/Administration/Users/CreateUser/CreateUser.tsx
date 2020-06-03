/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  InputField, SubmittingForm, ErrorMessage, Button
} from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/di';
import { useTranslate } from '@dbeaver/core/localization';
import { useStyles, composes } from '@dbeaver/core/theming';

import { CreateUserController } from './CreateUserController';

const styles = composes(
  css`
  `,
  css`
  SubmittingForm {
    display: flex;
    flex: 1;
  }
  create-form {
    flex: 1;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  group {
    box-sizing: border-box;
    display: flex;
    margin: 0 12px;
  }
  controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  item-title {
    composes: theme-typography--headline5 from global;
    padding: 16px;
  }
  `
);

export const CreateUser = observer(function CreateUser() {
  const controller = useController(CreateUserController);
  const translate = useTranslate();
  const handleChange = useCallback(
    (value: string) => controller.login = value,
    []
  );

  return styled(useStyles(styles))(
    <>
      <item-title as='div'>
        User creation
      </item-title>
      <SubmittingForm>
        <create-form as='div'>
          <group as="div">
            <InputField
              type='text'
              name='login'
              value={controller.login}
              onChange={handleChange}
              disabled={controller.isCreating}
              mod='surface'
            >
              {translate('User name')}
            </InputField>
          </group>
          <controls as="div">
            <Button
              type="button"
              mod={['unelevated']}
              onClick={controller.create}
              disabled={controller.isCreating}
            >
              {translate('Create')}
            </Button>
          </controls>
        </create-form>
      </SubmittingForm>

      {controller.error.responseMessage && (
        <ErrorMessage
          text={controller.error.responseMessage}
          hasDetails={controller.error.hasDetails}
          onShowDetails={controller.showDetails}
        />
      )}
    </>
  );
});
