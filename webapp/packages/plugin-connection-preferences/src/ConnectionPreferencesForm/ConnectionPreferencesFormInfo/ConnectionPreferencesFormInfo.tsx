/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useTab, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { InputField, Textarea, useAutoLoad, useTranslate, useResource, Group, ColoredContainer, IconOrImage } from '@cloudbeaver/core-blocks';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { DBDriverResource } from '@cloudbeaver/core-connections';

import type { IConnectionPreferencesFormProps } from '../IConnectionPreferencesFormState.js';
import { getConnectionPreferencesFormInfoPart } from './getConnectionPreferencesFormInfoPart.js';

export const ConnectionPreferencesFormInfo: TabContainerPanelComponent<IConnectionPreferencesFormProps> = observer(function ConnectionPreferencesFormInfo({ formState, tabId }) {
  const translate = useTranslate();
  const infoPart = getConnectionPreferencesFormInfoPart(formState);
  const tab = useTab(tabId);

  useAutoLoad(ConnectionPreferencesFormInfo, infoPart, tab.selected);

  const projectInfoResource = useResource(ConnectionPreferencesFormInfo, ProjectInfoResource, formState.state.projectId);
  const dbDriverResource = useResource(ConnectionPreferencesFormInfo, DBDriverResource, infoPart.state.driverId ?? null);

  return (
    <ColoredContainer wrap overflow parent gap>
      <Group gap small>
        {dbDriverResource.data && (
          <InputField value={dbDriverResource.data.name ?? dbDriverResource.data.id} readOnly fill>
            <div className='tw:flex tw:items-center tw:gap-1'>
              {dbDriverResource.data.icon && <IconOrImage className='tw:size-4' icon={dbDriverResource.data.icon} />}
              {translate('connections_connection_driver')}
            </div>
          </InputField>
        )}
        <InputField type="text" name="name" state={infoPart.state} readOnly fill>
          {translate('connections_connection_name')}
        </InputField>
        {projectInfoResource.data && (
          <InputField value={projectInfoResource.data.name} readOnly fill>
            {translate('plugin_projects_project_select_label')}
          </InputField>
        )}
        <InputField type="text" name="folder" state={infoPart.state} autoHide readOnly tiny fill>
          {translate('plugin_connections_connection_form_part_main_folder')}
        </InputField>
        <Textarea name="description" rows={3} state={infoPart.state} readOnly>
          {translate('connections_connection_description')}
        </Textarea>
      </Group>
    </ColoredContainer>
  );
});