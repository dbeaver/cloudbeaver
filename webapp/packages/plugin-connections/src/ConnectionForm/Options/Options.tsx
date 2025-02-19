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
} from '@cloudbeaver/core-blocks';
import { DatabaseAuthModelsResource, type DBDriver, DBDriverResource, isLocalConnection } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { EAdminPermission, ServerConfigResource } from '@cloudbeaver/core-root';
import { DriverConfigurationType } from '@cloudbeaver/core-sdk';
import { type TabContainerPanelComponent, TabsContext } from '@cloudbeaver/core-ui';
import { EMPTY_ARRAY } from '@cloudbeaver/core-utils';
import { ProjectSelect } from '@cloudbeaver/plugin-projects';

import { ConnectionAuthModelCredentialsForm } from '../ConnectionAuthModelCredentials/ConnectionAuthModelCredentialsForm.js';
import { ConnectionAuthModelSelector } from '../ConnectionAuthModelCredentials/ConnectionAuthModelSelector.js';
import { ConnectionFormService } from '../ConnectionFormService.js';
import type { IConnectionFormProps } from '../IConnectionFormProps.js';
import { CONNECTION_FORM_SHARED_CREDENTIALS_TAB_ID } from '../SharedCredentials/CONNECTION_FORM_SHARED_CREDENTIALS_TAB_ID.js';
import { AdvancedPropertiesForm } from './AdvancedPropertiesForm.js';
import styles from './Options.module.css';
import { ParametersForm } from './ParametersForm.js';
import { ProviderPropertiesForm } from './ProviderPropertiesForm.js';
import { useOptions } from './useOptions.js';

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

export const Options: TabContainerPanelComponent<IConnectionFormProps> = observer(function Options({ state }) {
  const isAdmin = usePermission(EAdminPermission.admin);
  const serverConfigResource = useResource(Options, ServerConfigResource, undefined);
  const projectInfoResource = useService(ProjectInfoResource);
  const service = useService(ConnectionFormService);
  const formRef = useRef<HTMLFormElement>(null);
  const translate = useTranslate();
  const { info, originInfo, config, availableDrivers, submittingTask: submittingHandlers, disabled } = state;
  const style = useS(styles);
  const tabsState = useContext(TabsContext);
  const isSharedProject = projectInfoResource.isProjectShared(state.projectId);

  //@TODO it's here until the profile implementation in the CloudBeaver
  const readonly = state.readonly || info?.authModel === PROFILE_AUTH_MODEL_ID;

  useFormValidator(submittingHandlers.for(service.formValidationTask), formRef.current);
  const optionsHook = useOptions(state);
  const { credentialsSavingEnabled } = useAdministrationSettings();

  const driverMap = useResource(
    Options,
    DBDriverResource,
    { key: config.driverId || null, includes: ['includeProviderProperties', 'includeMainProperties'] as const },
    {
      onData: data => {
        optionsHook.setDefaults(data);
      },
    },
  );

  const driver = driverMap.data;
  const configurationTypes = driverConfiguration.filter(configuration => driver && configuration.isVisible(driver));

  function handleFormChange(value?: unknown, name?: string) {
    if (name !== 'name' && optionsHook.isNameAutoFill()) {
      optionsHook.updateNameTemplate(driver);
    }

    if (config.template) {
      config.folder = undefined;
    }
  }

  const applicableAuthModels = driver?.applicableAuthModels ?? [];

  const authModelLoader = useResource(
    Options,
    DatabaseAuthModelsResource,
    getComputed(() => config.authModelId || info?.authModel || driver?.defaultAuthModel || null),
    {
      onData: data => optionsHook.setAuthModel(data),
    },
  );

  const authModel = authModelLoader.data;

  async function handleAuthModelSelect(id: string | undefined) {
    if (!id) {
      return;
    }

    const model = await authModelLoader.resource.load(id);

    if (!model) {
      return;
    }

    optionsHook.setAuthModel(model);
  }

  const authentication = useAuthenticationAction({
    providerId: authModel?.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID,
  });

  const edit = state.mode === 'edit';
  const originLocal = !info || (originInfo?.origin && isLocalConnection(originInfo.origin));

  const drivers = driverMap.resource.enabledDrivers.filter(({ id, driverInstalled }) => {
    if (!edit && !isAdmin && !driverInstalled) {
      return false;
    }

    return availableDrivers.includes(id);
  });

  let properties = authModel?.properties;

  if (info?.authProperties && info.authProperties.length > 0 && config.authModelId === info.authModel) {
    properties = info.authProperties;
  }

  const sharedCredentials = config.sharedCredentials && serverConfigResource.data?.distributed;

  function openCredentialsTab(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    tabsState?.open(CONNECTION_FORM_SHARED_CREDENTIALS_TAB_ID);
  }

  return (
    <Form ref={formRef} className={s(style, { form: true })} disabled={driverMap.isLoading()} onChange={handleFormChange}>
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
                  state={config}
                  items={drivers}
                  keySelector={driver => driver.id}
                  valueSelector={driver => driver.name ?? ''}
                  titleSelector={driver => driver.description}
                  iconSelector={driver => driver.icon}
                  searchable={drivers.length > 10}
                  readOnly={readonly || edit || drivers.length < 2}
                  disabled={disabled}
                  loading={driverMap.isLoading()}
                  tiny
                  fill
                >
                  {translate('connections_connection_driver')}
                </Combobox>
                {configurationTypes.length > 1 && (
                  <FormFieldDescription label={translate('connections_connection_configuration')} tiny>
                    <Container gap>
                      <RadioGroup name="configurationType" state={config}>
                        {configurationTypes.map(conf => (
                          <Radio
                            key={conf.value}
                            id={conf.value}
                            value={conf.value}
                            mod={['primary', 'small']}
                            readOnly={readonly || configurationTypes.length < 2}
                            disabled={readonly}
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
              {config.configurationType === DriverConfigurationType.Url && (
                <InputField
                  type="text"
                  name="url"
                  state={config}
                  readOnly={readonly || disabled}
                  autoComplete={`section-${config.driverId || 'driver'} section-jdbc`}
                >
                  {translate('plugin_connections_connection_form_part_main_url_jdbc')}
                </InputField>
              )}

              {config.configurationType === DriverConfigurationType.Manual &&
                (driver?.useCustomPage ? (
                  <ObjectPropertyInfoForm
                    state={config.mainPropertyValues}
                    properties={driver.mainProperties ?? EMPTY_ARRAY}
                    disabled={disabled}
                    readOnly={readonly}
                  />
                ) : (
                  <ParametersForm
                    config={config}
                    embedded={driver?.embedded}
                    requiresServerName={driver?.requiresServerName}
                    disabled={disabled}
                    readOnly={readonly}
                    originLocal={originLocal}
                  />
                ))}
            </Group>
          </Group>
          <Group form gap>
            <Container wrap gap>
              <InputField type="text" name="name" minLength={1} state={config} readOnly={readonly || disabled} required fill>
                {translate('connections_connection_name')}
              </InputField>
              {!config.template && (
                <ProjectSelect
                  value={state.projectId}
                  readOnly={readonly || edit}
                  disabled={disabled}
                  autoHide
                  onChange={projectId => state.setProject(projectId)}
                />
              )}
              {!config.template && (
                <InputField
                  type="text"
                  name="folder"
                  state={config}
                  autoComplete={`section-${config.driverId || 'driver'} section-folder`}
                  autoHide
                  readOnly
                  tiny
                  fill
                >
                  {translate('plugin_connections_connection_form_part_main_folder')}
                </InputField>
              )}
            </Container>
            <Textarea name="description" rows={3} state={config} readOnly={readonly || disabled}>
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
                  id={config.connectionId + 'isShared'}
                  name="sharedCredentials"
                  title={translate('connections_connection_share_credentials_tooltip')}
                  state={config}
                  disabled={disabled || readonly}
                  keepSize
                >
                  {translate('connections_connection_share_credentials')}
                </FieldCheckbox>
              )}
              <ConnectionAuthModelSelector
                authModelCredentialsState={config}
                applicableAuthModels={applicableAuthModels}
                readonlyAuthModelId={!originLocal}
                readonly={readonly}
                disabled={disabled}
                onAuthModelChange={handleAuthModelSelect}
              />
              {!sharedCredentials ? (
                <>
                  {properties && (
                    <ConnectionAuthModelCredentialsForm
                      credentials={config.credentials}
                      properties={properties}
                      readonly={readonly}
                      disabled={disabled}
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
              {!sharedCredentials && authModel && credentialsSavingEnabled && !config.template && (
                <FieldCheckbox
                  id={config.connectionId + 'authNeeded'}
                  name="saveCredentials"
                  state={config}
                  disabled={disabled || readonly || config.sharedCredentials}
                  mod={['primary']}
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
            <ProviderPropertiesForm config={config} properties={driver.providerProperties} disabled={disabled} readonly={readonly} />
          )}

          <AdvancedPropertiesForm config={config} disabled={disabled} readonly={readonly} />
        </Container>
      </ColoredContainer>
    </Form>
  );
});
