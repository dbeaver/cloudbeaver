/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { AuthConfigurationParametersResource, AuthProvidersResource } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  Combobox,
  FieldCheckbox,
  Group,
  GroupTitle,
  InputField,
  Link,
  ObjectPropertyInfoForm,
  Textarea,
  useClipboard,
  useObjectPropertyCategories,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { AuthProviderConfigurationParametersFragment } from '@cloudbeaver/core-sdk';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import type { IAuthConfigurationFormProps } from '../IAuthConfigurationFormProps';

const emptyArray: AuthProviderConfigurationParametersFragment[] = [];

export const AuthConfigurationOptions: TabContainerPanelComponent<IAuthConfigurationFormProps> = observer(function AuthConfigurationOptions({
  state,
}) {
  const translate = useTranslate();
  const copy = useClipboard();

  const providers = useResource(AuthConfigurationOptions, AuthProvidersResource, CachedMapAllKey);
  const parameters = useResource(AuthConfigurationOptions, AuthConfigurationParametersResource, state.config.providerId || null);

  const { categories, isUncategorizedExists } = useObjectPropertyCategories(parameters.data ?? emptyArray);

  const edit = state.mode === 'edit';

  const handleProviderSelect = useCallback(() => {
    state.config.parameters = {};
  }, [state]);

  return (
    <ColoredContainer parent gap overflow>
      <Group small gap>
        <Combobox
          name="providerId"
          state={state.config}
          items={providers.resource.configurable}
          keySelector={provider => provider.id}
          valueSelector={provider => provider.label}
          iconSelector={provider => provider.icon}
          titleSelector={provider => provider.description}
          placeholder={translate('administration_identity_providers_choose_provider_placeholder')}
          readOnly={state.readonly || edit}
          disabled={state.disabled}
          required
          tiny
          fill
          onSelect={handleProviderSelect}
        >
          {translate('administration_identity_providers_provider')}
        </Combobox>
        <InputField name="id" state={state.config} readOnly={state.readonly || edit} disabled={state.disabled} required tiny fill>
          {translate('administration_identity_providers_provider_id')}
        </InputField>
        <InputField name="displayName" state={state.config} minLength={1} disabled={state.disabled} readOnly={state.readonly} required tiny fill>
          {translate('administration_identity_providers_provider_configuration_name')}
        </InputField>
        <Textarea name="description" state={state.config} disabled={state.disabled} readOnly={state.readonly}>
          {translate('administration_identity_providers_provider_configuration_description')}
        </Textarea>
        <InputField name="iconURL" state={state.config} disabled={state.disabled} readOnly={state.readonly}>
          {translate('administration_identity_providers_provider_configuration_icon_url')}
        </InputField>
        <FieldCheckbox
          id={edit ? state.config.id : 'AuthConfigurationDisabled'}
          name="disabled"
          state={state.config}
          disabled={state.disabled}
          readOnly={state.readonly}
        >
          {translate('administration_identity_providers_provider_configuration_disabled')}
        </FieldCheckbox>
      </Group>
      {parameters.isLoaded() && parameters.data && (
        <>
          {isUncategorizedExists && (
            <Group small gap vertical>
              <GroupTitle>{translate('administration_identity_providers_provider_configuration_parameters')}</GroupTitle>
              <ObjectPropertyInfoForm
                state={state.config.parameters}
                properties={parameters.data}
                category={null}
                disabled={state.disabled}
                readOnly={state.readonly}
              />
            </Group>
          )}
          {categories.map(category => (
            <Group key={category} small gap vertical>
              <GroupTitle keepSize>{category}</GroupTitle>
              <ObjectPropertyInfoForm
                state={state.config.parameters}
                properties={parameters.data!}
                category={category}
                disabled={state.disabled}
                readOnly={state.readonly}
                keepSize
              />
            </Group>
          ))}
        </>
      )}
      {(state.config.metadataLink || state.config.signInLink || state.config.signOutLink || state.config.acsLink) && (
        <Group small gap>
          <GroupTitle>{translate('administration_identity_providers_provider_configuration_links')}</GroupTitle>
          <InputField
            name="signInLink"
            state={state.config}
            title={state.config.signInLink}
            disabled={state.disabled}
            autoHide
            readOnly
            onCustomCopy={() => copy(state.config.signInLink!, true)}
          >
            Sign in
          </InputField>
          <InputField
            name="signOutLink"
            state={state.config}
            title={state.config.signOutLink}
            disabled={state.disabled}
            autoHide
            readOnly
            onCustomCopy={() => copy(state.config.signOutLink!, true)}
          >
            Sign out
          </InputField>
          <InputField
            name="redirectLink"
            state={state.config}
            title={state.config.redirectLink}
            disabled={state.disabled}
            autoHide
            readOnly
            onCustomCopy={() => copy(state.config.redirectLink!, true)}
          >
            Redirect
          </InputField>
          <InputField
            name="acsLink"
            state={state.config}
            title={state.config.acsLink}
            disabled={state.disabled}
            autoHide
            readOnly
            onCustomCopy={() => copy(state.config.acsLink!, true)}
          >
            ACS
          </InputField>
          {state.config.metadataLink && (
            <Link href={state.config.metadataLink} target="_blank" rel="noopener noreferrer">
              {translate('administration_identity_providers_provider_configuration_links_metadata')}
            </Link>
          )}
        </Group>
      )}
    </ColoredContainer>
  );
});
