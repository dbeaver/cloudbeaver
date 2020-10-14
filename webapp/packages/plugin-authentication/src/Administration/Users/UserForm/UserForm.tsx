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
  TabsState, TabList, Tab,
  TabTitle, Loader, SubmittingForm, TabPanel,
  ErrorMessage, Button,
  InputField,
  FieldCheckbox,
  useFocus,
  InputGroup, FormBox, FormBoxElement, FormGroup, BORDER_TAB_STYLES
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { AdminUserInfo } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { GrantedConnections } from './GrantedConnections';
import { UserFormController } from './UserFormController';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }

    TabList {
      composes: theme-background-surface theme-text-on-surface from global;
    }

    ErrorMessage {
      composes: theme-background-secondary from global;
    }

    FormBox {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }

    content-box {
      composes: theme-background-secondary theme-border-color-background from global;
    }

    GrantedConnections {
      composes: theme-background-surface from global;
    }
  `,
  css`
    SubmittingForm {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    ErrorMessage {
      position: sticky;
      bottom: 0;
      padding: 8px 24px;
    }

    fill {
      flex: 1;
    }

    SubmittingForm {
      position: relative;
      min-height: 320px;
      max-height: 500px;
    }

    Button:not(:first-child) {
      margin-right: 24px;
    }

    layout-grid {
      flex: 1;
      width: 100%;
    }
  `
);

interface Props {
  user: AdminUserInfo;
  editing?: boolean;
  onCancel: () => void;
}

export const UserForm = observer(function UserForm({
  user,
  editing = false,
  onCancel,
}: Props) {
  const translate = useTranslate();
  const controller = useController(UserFormController, user, editing, onCancel);
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  const handleLoginChange = useCallback(
    (value: string) => { controller.credentials.login = value; },
    []
  );
  const handlePasswordChange = useCallback(
    (value: string) => { controller.credentials.password = value; },
    []
  );
  const handlePasswordRepeatChange = useCallback(
    (value: string) => { controller.credentials.passwordRepeat = value; },
    []
  );
  const handleRoleChange = useCallback(
    (roleId: string, value: boolean) => controller.credentials.roles.set(roleId, value),
    []
  );

  return styled(useStyles(styles, BORDER_TAB_STYLES))(
    <TabsState selectedId='info'>
      <box as='div'>
        <TabList>
          <Tab tabId='info'>
            <TabTitle>{translate('authentication_administration_user_info')}</TabTitle>
          </Tab>
          <Tab tabId='connections_access' onOpen={controller.loadConnectionsAccess}>
            <TabTitle>{translate('authentication_administration_user_connections_access')}</TabTitle>
          </Tab>
          <fill as="div" />
          <Button
            type="button"
            disabled={controller.isSaving}
            mod={['outlined']}
            onClick={onCancel}
          >
            {translate('ui_processing_cancel')}
          </Button>
          <Button
            type="button"
            disabled={controller.isSaving}
            mod={['unelevated']}
            onClick={controller.save}
          >
            {translate(!editing ? 'ui_processing_create' : 'ui_processing_save')}
          </Button>
        </TabList>
        <content-box as='div'>
          <SubmittingForm ref={focusedRef} onSubmit={controller.save}>
            <TabPanel tabId='info'>
              <FormBox>
                <FormBoxElement>
                  <FormGroup>
                    <InputGroup>{translate('authentication_user_credentials')}</InputGroup>
                  </FormGroup>
                  <FormGroup>
                    <InputField
                      type='text'
                      name='login'
                      value={controller.credentials.login}
                      disabled={editing || controller.isSaving}
                      mod='surface'
                      required
                      onChange={handleLoginChange}
                    >
                      {translate('authentication_user_name')}
                    </InputField>
                  </FormGroup>
                  <FormGroup>
                    <InputField
                      type='password'
                      name='password'
                      autoComplete='new-password'
                      value={controller.credentials.password}
                      disabled={controller.isSaving}
                      mod='surface'
                      required
                      onChange={handlePasswordChange}
                    >
                      {translate('authentication_user_password')}
                    </InputField>
                  </FormGroup>
                  <FormGroup>
                    <InputField
                      type='password'
                      name='password_repeat'
                      value={controller.credentials.passwordRepeat}
                      disabled={controller.isSaving}
                      mod='surface'
                      required
                      onChange={handlePasswordRepeatChange}
                    >
                      {translate('authentication_user_password_repeat')}
                    </InputField>
                  </FormGroup>
                </FormBoxElement>
                <FormBoxElement>
                  <FormGroup>
                    <InputGroup>{translate('authentication_user_role')}</InputGroup>
                  </FormGroup>
                  {controller.roles.map((role, i) => (
                    <FormGroup key={role.roleId}>
                      <FieldCheckbox
                        value={role.roleId}
                        name='role'
                        checkboxLabel={role.roleName || role.roleId}
                        checked={controller.credentials.roles.get(role.roleId)}
                        disabled={controller.isSaving}
                        mod='surface'
                        onChange={checked => handleRoleChange(role.roleId, checked)}
                      />
                    </FormGroup>
                  ))}
                </FormBoxElement>
              </FormBox>
            </TabPanel>
            {controller.isLoading && <Loader overlay />}
            <TabPanel tabId='connections_access'>
              <GrantedConnections
                grantedConnections={controller.grantedConnections}
                connections={controller.connections}
                selectedConnection={controller.selectedConnections}
                disabled={controller.isLoading}
                onChange={controller.handleConnectionsAccessChange}
              />
            </TabPanel>
          </SubmittingForm>
          {controller.error.responseMessage && (
            <ErrorMessage
              text={controller.error.responseMessage}
              hasDetails={controller.error.hasDetails}
              onShowDetails={controller.showDetails}
            />
          )}
        </content-box>
      </box>
    </TabsState>
  );
});
