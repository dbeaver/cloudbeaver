/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useRef } from 'react';
import styled, { css } from 'reshadow';

import { AUTH_PROVIDER_LOCAL_ID, EAdminPermission } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  Combobox,
  Container,
  FieldCheckbox,
  FormFieldDescription,
  getComputed,
  Group,
  GroupTitle,
  InputField,
  ObjectPropertyInfoForm,
  Radio,
  RadioGroup,
  SubmittingForm,
  Textarea,
  useAdministrationSettings,
  useFormValidator,
  usePermission,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { DatabaseAuthModelsResource, DBDriverResource, isLocalConnection } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { CachedMapEmptyKey, DriverConfigurationType, resourceKeyList } from '@cloudbeaver/core-sdk';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { useAuthenticationAction } from '@cloudbeaver/core-ui';
import { ProjectSelect } from '@cloudbeaver/plugin-projects';

import { ConnectionFormService } from '../ConnectionFormService';
import type { IConnectionFormProps } from '../IConnectionFormProps';
import { ConnectionOptionsTabService } from './ConnectionOptionsTabService';
import { ParametersForm } from './ParametersForm';
import { ProviderPropertiesForm } from './ProviderPropertiesForm';
import { useOptions } from './useOptions';

const PROFILE_AUTH_MODEL_ID = 'profile';

const styles = css`
  SubmittingForm {
    flex: 1;
    overflow: auto;
  }
`;

interface IDriverConfiguration {
  name: string;
  value: DriverConfigurationType;
  description?: string;
  icon?: string;
}

const driverConfiguration: IDriverConfiguration[] = [
  {
    name: 'Manual',
    value: DriverConfigurationType.Manual,
  },
  {
    name: 'URL',
    value: DriverConfigurationType.Url,
  },
];

export const Options: TabContainerPanelComponent<IConnectionFormProps> = observer(function Options({ state }) {
  const serverConfigResource = useResource(Options, ServerConfigResource, undefined);
  const connectionOptionsTabService = useService(ConnectionOptionsTabService);
  const service = useService(ConnectionFormService);
  const formRef = useRef<HTMLFormElement>(null);
  const translate = useTranslate();
  const { info, config, availableDrivers, submittingTask: submittingHandlers, disabled } = state;

  //@TODO it's here until the profile implementation in the CloudBeaver
  const readonly = state.readonly || info?.authModel === PROFILE_AUTH_MODEL_ID;

  const adminPermission = usePermission(EAdminPermission.admin);

  useFormValidator(submittingHandlers.for(service.formValidationTask), formRef.current);
  const optionsHook = useOptions(state);
  const { credentialsSavingEnabled } = useAdministrationSettings();

  const handleAuthModelSelect = useCallback(async (value?: string, name?: string, prev?: string) => {
    const model = applicableAuthModels.find(model => model?.id === value);

    if (!model) {
      return;
    }

    optionsHook.setAuthModel(model);
  }, []);

  const driverMap = useResource(
    Options,
    DBDriverResource,
    { key: config.driverId || null, includes: ['includeProviderProperties'] as const },
    {
      onData: data => {
        optionsHook.setDefaults(data);
      },
    },
  );

  const driver = driverMap.data;
  const configurationTypes = driverConfiguration.filter(conf => driver?.configurationTypes.includes(conf.value));

  function handleFormChange(value?: unknown, name?: string) {
    if (name !== 'name' && optionsHook.isNameAutoFill()) {
      optionsHook.updateNameTemplate(driver);
    }

    if (config.template) {
      config.folder = undefined;
    }

    if (name === 'sharedCredentials' && value) {
      config.saveCredentials = true;

      for (const handler of config.networkHandlersConfig ?? []) {
        if (!handler.savePassword) {
          handler.savePassword = true;
        }
      }
    }
  }

  const { data: applicableAuthModels } = useResource(
    Options,
    DatabaseAuthModelsResource,
    getComputed(() => (driver?.applicableAuthModels ? resourceKeyList(driver.applicableAuthModels) : CachedMapEmptyKey)),
  );

  const { data: authModel } = useResource(
    Options,
    DatabaseAuthModelsResource,
    getComputed(() => config.authModelId || info?.authModel || driver?.defaultAuthModel || null),
    {
      onData: data => optionsHook.setAuthModel(data),
    },
  );

  const authentication = useAuthenticationAction({
    providerId: authModel?.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID,
  });

  const isURLConfiguration = config.configurationType === DriverConfigurationType.Url;
  const edit = state.mode === 'edit';
  const originLocal = !info || isLocalConnection(info);

  const availableAuthModels = applicableAuthModels.filter(model => !!model && (adminPermission || !model.requiresLocalConfiguration));
  const drivers = driverMap.resource.enabledDrivers.filter(({ id }) => availableDrivers.includes(id));

  let properties = authModel?.properties;

  if (info?.authProperties && info.authProperties.length > 0 && config.authModelId === info.authModel) {
    properties = info.authProperties;
  }

  return styled(styles)(
    <SubmittingForm ref={formRef} disabled={driverMap.isLoading()} onChange={handleFormChange}>
      <ColoredContainer wrap overflow parent gap>
        <Container medium gap>
          <Group form gap>
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
                <>
                  {/*<Combobox
                  name='configurationType'
                  state={config}
                  items={configurationTypes}
                  keySelector={conf => conf.value}
                  valueSelector={conf => conf.name}
                  titleSelector={conf => conf.description}
                  readOnly={readonly || configurationTypes.length < 2}
                  disabled={disabled}
                  tiny
                  fill
                >
                  {translate('connections_connection_configuration')}
              </Combobox>*/}
                  <FormFieldDescription label={translate('connections_connection_configuration')} tiny fill>
                    <Container gap>
                      <RadioGroup name="configurationType" state={config}>
                        {driverConfiguration.map(conf => (
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
                </>
              )}
            </Container>
            {isURLConfiguration ? (
              <InputField
                type="text"
                name="url"
                state={config}
                disabled={disabled}
                readOnly={readonly}
                autoComplete={`section-${config.driverId || 'driver'} section-jdbc`}
                mod="surface"
              >
                {translate('customConnection_url_JDBC')}
              </InputField>
            ) : (
              <ParametersForm
                config={config}
                embedded={driver?.embedded}
                requiresServerName={driver?.requiresServerName}
                disabled={disabled}
                readOnly={readonly}
                originLocal={originLocal}
              />
            )}
          </Group>
          <Group form gap>
            <Container wrap gap>
              <InputField type="text" name="name" minLength={1} state={config} disabled={disabled} readOnly={readonly} mod="surface" required fill>
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
                  disabled={disabled}
                  autoComplete={`section-${config.driverId || 'driver'} section-folder`}
                  mod="surface"
                  autoHide
                  readOnly
                  tiny
                  fill
                >
                  {translate('customConnection_folder')}
                </InputField>
              )}
            </Container>
            <Textarea name="description" rows={3} state={config} disabled={disabled} readOnly={readonly}>
              {translate('connections_connection_description')}
            </Textarea>
          </Group>
        </Container>
        <Container medium gap>
          {!driver?.anonymousAccess && (authentication.authorized || !edit) && (
            <Group form gap>
              <GroupTitle>{translate('connections_connection_edit_authentication')}</GroupTitle>
              {availableAuthModels.length > 1 && (
                <Combobox
                  name="authModelId"
                  state={config}
                  items={availableAuthModels}
                  keySelector={model => model!.id}
                  valueSelector={model => model!.displayName}
                  titleSelector={model => model?.description}
                  searchable={availableAuthModels.length > 10}
                  readOnly={readonly || !originLocal}
                  disabled={disabled}
                  tiny
                  fill
                  onSelect={handleAuthModelSelect}
                />
              )}
              {authModel && properties && (
                <>
                  <Container wrap gap hideEmpty>
                    <ObjectPropertyInfoForm
                      autofillToken="new-password"
                      properties={properties}
                      state={config.credentials}
                      disabled={disabled}
                      readOnly={readonly}
                      showRememberTip
                      hideEmptyPlaceholder
                      tiny
                    />
                  </Container>
                  {credentialsSavingEnabled && (
                    <Container wrap gap>
                      <FieldCheckbox
                        id={config.connectionId + 'authNeeded'}
                        name="saveCredentials"
                        state={config}
                        disabled={disabled || readonly || config.sharedCredentials}
                        keepSize
                      >
                        {translate('connections_connection_edit_save_credentials')}
                      </FieldCheckbox>
                      {serverConfigResource.resource.distributed && connectionOptionsTabService.isProjectShared(state) && (
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
                    </Container>
                  )}
                </>
              )}
            </Group>
          )}
          {driver?.providerProperties && (
            <ProviderPropertiesForm config={config} properties={driver.providerProperties} disabled={disabled} readonly={readonly} />
          )}
        </Container>
      </ColoredContainer>
    </SubmittingForm>,
  );
});
