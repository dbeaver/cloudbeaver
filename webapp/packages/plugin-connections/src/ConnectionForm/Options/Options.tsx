/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useRef } from 'react';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import {
  Alert,
  ColoredContainer,
  Combobox,
  Container,
  FieldCheckbox,
  Form,
  FormFieldDescription,
  getComputed,
  Group,
  GroupTitle,
  InputField,
  Link,
  ObjectPropertyInfoForm,
  Radio,
  RadioGroup,
  s,
  Textarea,
  useAdministrationSettings,
  useFormValidator,
  usePermission,
  useResource,
  useS,
  useTranslate,
  useAuthenticationAction,
  useAutoLoad,
} from '@cloudbeaver/core-blocks';
import {
  ConnectionInfoAuthPropertiesResource,
  ConnectionInfoOriginResource,
  DatabaseAuthModelsResource,
  type DBDriver,
  DBDriverResource,
  isLocalConnection,
} from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { EAdminPermission, ServerConfigResource } from '@cloudbeaver/core-root';
import { DriverConfigurationType } from '@cloudbeaver/core-sdk';
import { type TabContainerPanelComponent, TabsContext, useTab } from '@cloudbeaver/core-ui';
import { EMPTY_ARRAY } from '@cloudbeaver/core-utils';
import { ProjectSelect } from '@cloudbeaver/plugin-projects';

import { ConnectionAuthModelCredentialsForm } from '../ConnectionAuthModelCredentials/ConnectionAuthModelCredentialsForm.js';
import { ConnectionAuthModelSelector } from '../ConnectionAuthModelCredentials/ConnectionAuthModelSelector.js';
import { CONNECTION_FORM_SHARED_CREDENTIALS_TAB_ID } from '../SharedCredentials/CONNECTION_FORM_SHARED_CREDENTIALS_TAB_ID.js';
import { AdvancedPropertiesForm } from './AdvancedPropertiesForm.js';
import styles from './Options.module.css';
import { ParametersForm } from './ParametersForm.js';
import { ProviderPropertiesForm } from './ProviderPropertiesForm.js';
import { getConnectionFormOptionsPart } from './getConnectionFormOptionsPart.js';
import type { IConnectionFormProps } from '../IConnectionFormState.js';

const PROFILE_AUTH_MODEL_ID = 'profile';

interface IDriverConfiguration {
  name: string;
  value: DriverConfigurationType;
  description?: string;
  icon?: string;
  isVisible: (driver: DBDriver) => boolean;
}

const driverConfiguration: IDriverConfiguration[] = [
  {
    name: 'Manual',
    value: DriverConfigurationType.Manual,
    isVisible: driver => driver.configurationTypes.includes(DriverConfigurationType.Manual),
  },
  {
    name: 'URL',
    value: DriverConfigurationType.Url,
    isVisible: driver => driver.configurationTypes.includes(DriverConfigurationType.Url),
  },
];

export const Options: TabContainerPanelComponent<IConnectionFormProps> = observer(function Options({ formState, tabId }) {
  const { selected } = useTab(tabId);
  const isAdmin = usePermission(EAdminPermission.admin);
  const serverConfigResource = useResource(Options, ServerConfigResource, undefined, {
    active: selected,
  });
  const projectInfoResource = useService(ProjectInfoResource);
  const formRef = useRef<HTMLFormElement>(null);
  const translate = useTranslate();
  const style = useS(styles);
  const tabsState = useContext(TabsContext);
  const isSharedProject = projectInfoResource.isProjectShared(formState.state.projectId);
  const optionsPart = getConnectionFormOptionsPart(formState);
  const connectionInfoAuthResource = useResource(Options, ConnectionInfoAuthPropertiesResource, optionsPart.connectionKey, {
    active: selected && !!optionsPart.connectionKey,
  });
  const connectionInfoOriginResource = useResource(Options, ConnectionInfoOriginResource, optionsPart.connectionKey, {
    active: selected && !!optionsPart.connectionKey,
  });
  const connectionInfoAuthPropertiesResource = useResource(Options, ConnectionInfoAuthPropertiesResource, optionsPart.connectionKey, {
    active: selected && !!optionsPart.connectionKey,
  });
  const configurationTypeLabel = translate('connections_connection_configuration');

  //@TODO it's here until the profile implementation in the CloudBeaver
  const readonly = formState.isDisabled || formState.isReadOnly || connectionInfoAuthResource.data?.authModel === PROFILE_AUTH_MODEL_ID;

  useFormValidator(formState.validationTask, formRef.current);
  const { credentialsSavingEnabled } = useAdministrationSettings();

  const driverMap = useResource(
    Options,
    DBDriverResource,
    {
      key: optionsPart.state.driverId || null,
      includes: ['includeProviderProperties', 'includeMainProperties', 'includeDriverProperties'] as const,
    },
    {
      active: selected,
    },
  );

  const driver = driverMap.data;
  const configurationTypes = driverConfiguration.filter(configuration => driver && configuration.isVisible(driver));

  const applicableAuthModels = driver?.applicableAuthModels ?? [];

  const authModelLoader = useResource(
    Options,
    DatabaseAuthModelsResource,
    getComputed(() => optionsPart.state.authModelId || connectionInfoAuthResource.data?.authModel || driver?.defaultAuthModel || null),
    {
      active: selected,
    },
  );

  const authModel = authModelLoader.data;

  async function handleAuthModelSelect(authModelId: string | undefined) {
    await optionsPart.setAuthModelId(authModelId);
  }

  const authentication = useAuthenticationAction({
    providerId: authModel?.requiredAuth ?? connectionInfoAuthResource.data?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID,
  });

  const edit = formState.mode === 'edit';
  const originLocal =
    !connectionInfoAuthResource.data || (connectionInfoOriginResource.data?.origin && isLocalConnection(connectionInfoOriginResource.data.origin));

  const drivers = driverMap.resource.enabledDrivers.filter(({ id, driverInstalled }) => {
    if (!edit && !isAdmin && !driverInstalled) {
      return false;
    }

    return formState.state.availableDrivers.includes(id);
  });

  function setProject(projectId: string) {
    formState.state.projectId = projectId;
  }

  let properties = authModel?.properties;

  if (
    connectionInfoAuthPropertiesResource.data?.authProperties &&
    connectionInfoAuthPropertiesResource.data.authProperties.length > 0 &&
    optionsPart.state.authModelId === connectionInfoAuthResource.data?.authModel
  ) {
    properties = connectionInfoAuthPropertiesResource.data.authProperties;
  }

  const sharedCredentials = optionsPart.state.sharedCredentials && serverConfigResource.data?.distributed;

  function openCredentialsTab(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    tabsState?.open(CONNECTION_FORM_SHARED_CREDENTIALS_TAB_ID);
  }

  async function setDriverIdHandler(driverId: string | undefined) {
    await optionsPart.setDriverId(driverId);
  }

  useAutoLoad(Options, optionsPart, selected);

  return (
    <Form ref={formRef} className={s(style, { form: true })} disabled={driverMap.isLoading()}>
      <ColoredContainer wrap overflow parent gap>
        <Container medium gap>
          <Group gap>
            {isAdmin && !driver?.driverInstalled && (
              <Alert
                title={translate('core_connections_connection_driver_not_installed')}
                message={translate('plugin_connections_connection_driver_not_installed_message')}
              />
            )}
            <Group form box gap>
              <Container wrap gap>
                <Combobox
                  name="driverId"
                  value={optionsPart.state.driverId}
                  items={drivers}
                  keySelector={driver => driver.id}
                  valueSelector={driver => driver.name ?? ''}
                  titleSelector={driver => driver.description}
                  iconSelector={driver => driver.icon}
                  searchable={drivers.length > 10}
                  readOnly={readonly || edit || drivers.length < 2}
                  disabled={formState.isDisabled}
                  loading={driverMap.isLoading()}
                  tiny
                  fill
                  onSelect={setDriverIdHandler}
                >
                  {translate('connections_connection_driver')}
                </Combobox>
                {configurationTypes.length > 1 && (
                  <FormFieldDescription label={configurationTypeLabel} tiny>
                    <Container gap>
                      <RadioGroup aria-label={configurationTypeLabel} name="configurationType" state={optionsPart.state}>
                        {configurationTypes.map(conf => (
                          <Radio
                            key={conf.value}
                            id={conf.value}
                            value={conf.value}
                            readOnly={readonly || configurationTypes.length < 2}
                            disabled={readonly}
                            small
                            keepSize
                          >
                            {conf.name}
                          </Radio>
                        ))}
                      </RadioGroup>
                    </Container>
                  </FormFieldDescription>
                )}
              </Container>
              {optionsPart.state.configurationType === DriverConfigurationType.Url && (
                <InputField
                  type="text"
                  name="url"
                  state={optionsPart.state}
                  readOnly={readonly || formState.isDisabled}
                  autoComplete={`section-${optionsPart.state.driverId || 'driver'} section-jdbc`}
                >
                  {translate('plugin_connections_connection_form_part_main_url_jdbc')}
                </InputField>
              )}

              {optionsPart.state.configurationType === DriverConfigurationType.Manual &&
                (driver?.useCustomPage ? (
                  <ObjectPropertyInfoForm
                    state={optionsPart.state.mainPropertyValues}
                    properties={driver.mainProperties ?? EMPTY_ARRAY}
                    disabled={formState.isDisabled}
                    readOnly={readonly}
                  />
                ) : (
                  <ParametersForm
                    config={optionsPart.state}
                    embedded={driver?.embedded}
                    requiresServerName={driver?.requiresServerName}
                    disabled={formState.isDisabled}
                    readOnly={readonly}
                    originLocal={originLocal}
                  />
                ))}
            </Group>
          </Group>
          <Group form gap>
            <Container wrap gap>
              <InputField type="text" name="name" minLength={1} state={optionsPart.state} readOnly={readonly || formState.isDisabled} required fill>
                {translate('connections_connection_name')}
              </InputField>
              <ProjectSelect
                value={formState.state.projectId}
                readOnly={readonly || edit}
                disabled={formState.isDisabled}
                autoHide
                onChange={setProject}
              />
              <InputField
                type="text"
                name="folder"
                state={optionsPart.state}
                autoComplete={`section-${optionsPart.state.driverId || 'driver'} section-folder`}
                autoHide
                readOnly
                tiny
                fill
              >
                {translate('plugin_connections_connection_form_part_main_folder')}
              </InputField>
            </Container>
            <Textarea name="description" rows={3} state={optionsPart.state} readOnly={readonly || formState.isDisabled}>
              {translate('connections_connection_description')}
            </Textarea>
          </Group>
        </Container>
        <Container medium gap>
          {!driver?.anonymousAccess && (authentication.authorized || !edit) && (
            <Group form gap>
              <GroupTitle>{translate('connections_connection_edit_authentication')}</GroupTitle>
              {serverConfigResource.resource.distributed && isSharedProject && (
                <FieldCheckbox
                  id={optionsPart.state.connectionId + 'isShared'}
                  name="sharedCredentials"
                  title={translate('connections_connection_share_credentials_tooltip')}
                  state={optionsPart.state}
                  disabled={formState.isDisabled || readonly}
                  keepSize
                >
                  {translate('connections_connection_share_credentials')}
                </FieldCheckbox>
              )}
              <ConnectionAuthModelSelector
                authModelCredentialsState={optionsPart.state}
                applicableAuthModels={applicableAuthModels}
                readonlyAuthModelId={!originLocal}
                readonly={readonly}
                disabled={formState.isDisabled}
                onAuthModelChange={handleAuthModelSelect}
              />
              {!sharedCredentials ? (
                <>
                  {properties && (
                    <ConnectionAuthModelCredentialsForm
                      credentials={optionsPart.state.credentials}
                      properties={properties}
                      readonly={readonly}
                      disabled={formState.isDisabled}
                    />
                  )}
                </>
              ) : (
                <FormFieldDescription>
                  {translate('plugin_connections_connection_form_shared_credentials_manage_info')}
                  <Link inline onClick={openCredentialsTab}>
                    {translate('plugin_connections_connection_form_shared_credentials_manage_info_tab_link')}
                  </Link>
                </FormFieldDescription>
              )}
              {!sharedCredentials && authModel && credentialsSavingEnabled && (
                <FieldCheckbox
                  id={optionsPart.state.connectionId + 'authNeeded'}
                  name="saveCredentials"
                  state={optionsPart.state}
                  disabled={formState.isDisabled || readonly || optionsPart.state.sharedCredentials}
                  title={translate(
                    !isSharedProject || serverConfigResource.data?.distributed
                      ? 'connections_connection_authentication_save_credentials_for_user_tooltip'
                      : 'connections_connection_edit_save_credentials_shared_tooltip',
                  )}
                  keepSize
                >
                  {translate(
                    !isSharedProject || serverConfigResource.data?.distributed
                      ? 'connections_connection_authentication_save_credentials_for_user'
                      : 'connections_connection_edit_save_credentials_shared',
                  )}
                </FieldCheckbox>
              )}
            </Group>
          )}
          {driver?.providerProperties && (
            <ProviderPropertiesForm
              config={optionsPart.state}
              properties={driver.providerProperties}
              disabled={formState.isDisabled}
              readonly={readonly}
            />
          )}

          <AdvancedPropertiesForm config={optionsPart.state} disabled={formState.isDisabled} readonly={readonly} />
        </Container>
      </ColoredContainer>
    </Form>
  );
});
