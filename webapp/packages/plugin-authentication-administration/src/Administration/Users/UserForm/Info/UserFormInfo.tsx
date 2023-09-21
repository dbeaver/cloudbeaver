/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  ColoredContainer,
  Container,
  FieldCheckbox,
  Group,
  GroupTitle,
  InfoItem,
  Placeholder,
  useAutoLoad,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { FormMode, TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';

import type { UserFormProps } from '../AdministrationUserFormService';
import type { IUserFormInfoPart } from './IUserFormInfoPart';
import { UserFormInfoCredentials } from './UserFormInfoCredentials';
import { UserFormInfoMetaParameters } from './UserFormInfoMetaParameters';
import { UserFormInfoPartService } from './UserFormInfoPartService';
import { UserFormInfoTeams } from './UserFormInfoTeams';

export const UserFormInfo: TabContainerPanelComponent<UserFormProps> = observer(function UserFormInfo({ tabId, formState }) {
  const translate = useTranslate();
  const tab = useTab(tabId);
  const tabState = useTabState<IUserFormInfoPart>();
  const userFormInfoPartService = useService(UserFormInfoPartService);

  useAutoLoad(UserFormInfo, tabState, tab.selected);

  const disabled = tabState.isLoading();
  let info: TLocalizationToken | null = null;

  if (formState.mode === FormMode.Edit && tabState.isChanged()) {
    info = 'ui_save_reminder';
  }

  return (
    <ColoredContainer vertical gap overflow>
      {info && <InfoItem info={info} />}
      <Container gap overflow>
        <Group small gap vertical overflow>
          <UserFormInfoCredentials formState={formState} tabState={tabState} tabSelected={tab.selected} disabled={disabled} />
        </Group>
        <Group small gap overflow>
          <Placeholder container={userFormInfoPartService.placeholderContainer} formState={formState} />
          <GroupTitle>{translate('authentication_user_status')}</GroupTitle>
          <FieldCheckbox id={`${formState.id}_user_enabled`} name="enabled" state={tabState.state} disabled={disabled}>
            {translate('authentication_user_enabled')}
          </FieldCheckbox>
          <UserFormInfoTeams formState={formState} tabState={tabState} tabSelected={tab.selected} disabled={disabled} />
        </Group>
        <UserFormInfoMetaParameters formState={formState} tabState={tabState} tabSelected={tab.selected} disabled={disabled} />
      </Container>
    </ColoredContainer>
  );
});
