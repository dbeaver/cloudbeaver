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
  BASE_CONTAINERS_STYLES,
  ColoredContainer,
  Group,
  ObjectPropertyInfoForm,
  SubmittingForm,
  Switch,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { NetworkHandlerConfigInput, NetworkHandlerDescriptor } from '@cloudbeaver/core-sdk';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormProps';

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

  const styles = useStyles(SSl_STYLES, BASE_CONTAINERS_STYLES);
  const disabled = formDisabled || loading;
  const enabled = handlerState.enabled || false;

  return styled(styles)(
    <SubmittingForm>
      <ColoredContainer parent>
        <Group gap form keepSize large vertical>
          <Switch name="enabled" state={handlerState} description={handler.description} mod={['primary']} disabled={disabled || readonly}>
            {translate('connections_public_connection_ssl_enable')}
          </Switch>
          <ObjectPropertyInfoForm
            state={handlerState.secureProperties}
            properties={handler.properties}
            disabled={disabled || readonly || !enabled}
            hideEmptyPlaceholder
            small
          />
        </Group>
      </ColoredContainer>
    </SubmittingForm>,
  );
});
