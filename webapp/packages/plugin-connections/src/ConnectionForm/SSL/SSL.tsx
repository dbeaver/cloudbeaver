/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';

import {
  ColoredContainer,
  FieldCheckbox,
  Form,
  Group,
  GroupTitle,
  ObjectPropertyInfoForm,
  s,
  Switch,
  useAdministrationSettings,
  useObjectPropertyCategories,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import type { NetworkHandlerConfigInput, NetworkHandlerDescriptor } from '@cloudbeaver/core-sdk';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { isSafari } from '@cloudbeaver/core-utils';

import type { IConnectionFormProps } from '../IConnectionFormProps.js';
import { SAVED_VALUE_INDICATOR } from './SAVED_VALUE_INDICATOR.js';
import styles from './SSL.module.css';

interface Props extends IConnectionFormProps {
  handler: NetworkHandlerDescriptor;
  handlerState: NetworkHandlerConfigInput;
}

export const SSL: TabContainerPanelComponent<Props> = observer(function SSL({ state: formState, handler, handlerState }) {
  const { info, readonly, disabled: formDisabled, loading } = formState;

  const translate = useTranslate();

  const style = useS(styles);
  const { credentialsSavingEnabled } = useAdministrationSettings();
  const { categories, isUncategorizedExists } = useObjectPropertyCategories(handler.properties);
  const serverConfigResource = useResource(SSL, ServerConfigResource, undefined);

  const disabled = formDisabled || loading;
  const enabled = handlerState.enabled || false;
  const initialHandler = info?.networkHandlersConfig?.find(h => h.id === handler.id);
  const autofillToken = isSafari ? 'section-connection-authentication-ssl section-ssl' : 'new-password';
  const projectInfoResource = useService(ProjectInfoResource);
  const isSharedProject = projectInfoResource.isProjectShared(formState.projectId);

  return (
    <Form className={s(style, { form: true })}>
      <ColoredContainer parent>
        <Group gap form large vertical>
          <Switch
            id="ssl-enable-switch"
            name="enabled"
            state={handlerState}
            description={handler.description}
            mod={['primary']}
            disabled={disabled || readonly}
          >
            {translate('plugin_connections_connection_ssl_enable')}
          </Switch>
          {isUncategorizedExists && (
            <ObjectPropertyInfoForm
              state={handlerState.properties}
              properties={handler.properties}
              category={null}
              disabled={disabled || readonly || !enabled}
              isSaved={p => !!p.id && initialHandler?.secureProperties[p.id] === SAVED_VALUE_INDICATOR}
              autofillToken={autofillToken}
              hideEmptyPlaceholder
              showRememberTip
              small
            />
          )}

          {categories.map(category => (
            <React.Fragment key={category}>
              <GroupTitle keepSize>{category}</GroupTitle>
              <ObjectPropertyInfoForm
                state={handlerState.properties}
                properties={handler.properties}
                category={category}
                disabled={disabled || readonly || !enabled}
                isSaved={p => !!p.id && initialHandler?.secureProperties[p.id] === SAVED_VALUE_INDICATOR}
                autofillToken={autofillToken}
                hideEmptyPlaceholder
                showRememberTip
                small
              />
            </React.Fragment>
          ))}

          {credentialsSavingEnabled && !formState.config.template && !formState.config.sharedCredentials && (
            <FieldCheckbox
              id={handler.id + '_savePassword'}
              name="savePassword"
              state={handlerState}
              disabled={disabled || !enabled || readonly || formState.config.sharedCredentials}
              title={translate(
                !isSharedProject || serverConfigResource.data?.distributed
                  ? 'connections_connection_authentication_save_credentials_for_user_tooltip'
                  : 'connections_connection_edit_save_credentials_shared_tooltip',
              )}
            >
              {translate(
                !isSharedProject || serverConfigResource.data?.distributed
                  ? 'connections_connection_authentication_save_credentials_for_user'
                  : 'connections_connection_edit_save_credentials_shared',
              )}
            </FieldCheckbox>
          )}
        </Group>
      </ColoredContainer>
    </Form>
  );
});
