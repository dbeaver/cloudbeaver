/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { UserMetaParametersResource } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, ColoredContainer, Container, getComputed, Group, GroupTitle, InputField, IProperty, Loader, ObjectPropertyInfoForm, PropertiesTable, TabPanel, useDataResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { AuthProvidersList } from '../AuthProviders/ConfigurationsList';

interface Props {
  user: UserInfo;
  className?: string;
  style?: ComponentStyle;
}

export const UserInfoPanel = observer<Props>(function UserInfoPanel({
  user,
  className,
  style,
}) {
  const userMetaParameters = useDataResource(UserInfoPanel, UserMetaParametersResource, undefined);
  const styles = useStyles(style, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();

  // const properties = getComputed<IProperty[]>(() => userMetaParameters.data.map(property => ({
  //   id: property.id!,
  //   key: property.id!,
  //   keyPlaceholder: property.id,
  //   displayName: property.displayName,
  //   valuePlaceholder: property.defaultValue,
  //   defaultValue: property.defaultValue,
  //   description: property.description,
  //   validValues: property.validValues,
  // })));

  return styled(styles)(
    <TabPanel tabId='info' className={className}>
      <ColoredContainer wrap overflow parent gap>
        <Container medium gap>
          <Group form gap>
            <Container wrap gap>
              <InputField
                type="text"
                name="userId"
                minLength={1}
                state={user}
                mod='surface'
                disabled
                readOnly
                required
                tiny
                fill
              >
                {translate('plugin_user_profile_info_id')}
              </InputField>
              <InputField
                type="text"
                name="displayName"
                minLength={1}
                state={user}
                mod='surface'
                disabled
                readOnly
                required
                tiny
                fill
              >
                {translate('plugin_user_profile_info_displayName')}
              </InputField>
            </Container>

            {userMetaParameters.data.length > 0 && (
              <>
                <Container wrap gap>
                  <Loader state={userMetaParameters}>
                    {() => (
                      <ObjectPropertyInfoForm
                        state={user.metaParameters}
                        properties={userMetaParameters.data}
                        category={null}
                        disabled
                        readOnly
                      />
                      // <PropertiesTable
                      //   properties={properties}
                      //   propertiesState={user.metaParameters}
                      //   readOnly
                      // />
                    )}
                  </Loader>
                </Container>
              </>
            )}
          </Group>
          {/* <Group box keepSize large>
            <GroupTitle>{translate('administration_identity_providers_provider_configuration_parameters')}</GroupTitle>

            <Loader state={userMetaParameters}>
              {() => (
                <ObjectPropertyInfoForm
                  state={user.metaParameters}
                  properties={userMetaParameters.data}
                  category={null}
                  disabled
                  readOnly
                />
                // <PropertiesTable
                //   properties={properties}
                //   propertiesState={user.metaParameters}
                //   readOnly
                // />
              )}
            </Loader>
          </Group> */}
          <Group box medium overflow>
            <AuthProvidersList user={user} providers={user.linkedAuthProviders} />
          </Group>
        </Container>

      </ColoredContainer>
    </TabPanel>
  );
});
