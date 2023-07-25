/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  ColoredContainer,
  FieldCheckbox,
  Group,
  GroupTitle,
  ObjectPropertyInfoForm,
  SubmittingForm,
  Switch,
  useAdministrationSettings,
  useObjectPropertyCategories,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { NetworkHandlerConfigInput, NetworkHandlerDescriptor } from '@cloudbeaver/core-sdk';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormProps';
import { SAVED_VALUE_INDICATOR } from './SAVED_VALUE_INDICATOR';

const SSl_STYLES = css`
  SubmittingForm {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
  }
`;

interface Props extends IConnectionFormProps {
  handler: NetworkHandlerDescriptor;
  handlerState: NetworkHandlerConfigInput;
}

export const SSL: TabContainerPanelComponent<Props> = observer(function SSL({ state: formState, handler, handlerState }) {
  const { info, readonly, disabled: formDisabled, loading } = formState;

  const translate = useTranslate();

  const styles = useStyles(SSl_STYLES);
  const { credentialsSavingEnabled } = useAdministrationSettings();
  const { categories, isUncategorizedExists } = useObjectPropertyCategories(handler.properties);

  const disabled = formDisabled || loading;
  const enabled = handlerState.enabled || false;
  const initialHandler = info?.networkHandlersConfig?.find(h => h.id === handler.id);

  return styled(styles)(
    <SubmittingForm>
      <ColoredContainer parent>
        <Group gap form keepSize large vertical>
          <Switch name="enabled" state={handlerState} description={handler.description} mod={['primary']} disabled={disabled || readonly}>
            {translate('connections_public_connection_ssl_enable')}
          </Switch>
          {isUncategorizedExists && (
            <ObjectPropertyInfoForm
              state={handlerState.properties}
              properties={handler.properties}
              category={null}
              disabled={disabled || readonly || !enabled}
              isSaved={p => !!p.id && initialHandler?.secureProperties[p.id] === SAVED_VALUE_INDICATOR}
              autofillToken="new-password"
              hideEmptyPlaceholder
              showRememberTip
              small
            />
          )}

          {categories.map(category => (
            <>
              <GroupTitle keepSize>{category}</GroupTitle>
              <ObjectPropertyInfoForm
                state={handlerState.properties}
                properties={handler.properties}
                category={category}
                disabled={disabled || readonly || !enabled}
                isSaved={p => !!p.id && initialHandler?.secureProperties[p.id] === SAVED_VALUE_INDICATOR}
                autofillToken="new-password"
                hideEmptyPlaceholder
                showRememberTip
                small
              />
            </>
          ))}

          {credentialsSavingEnabled && (
            <FieldCheckbox
              id={handler.id + ' savePassword'}
              name="savePassword"
              state={handlerState}
              disabled={disabled || !enabled || readonly || formState.config.sharedCredentials}
            >
              {translate('connections_connection_edit_save_credentials')}
            </FieldCheckbox>
          )}
        </Group>
      </ColoredContainer>
    </SubmittingForm>,
  );
});
