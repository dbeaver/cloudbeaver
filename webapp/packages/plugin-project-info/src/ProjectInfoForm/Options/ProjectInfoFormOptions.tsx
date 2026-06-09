/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ColoredContainer, Container, Group, GroupTitle, InputField, Textarea, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import type { IProjectInfoFormProps } from '../IProjectInfoFormProps.js';
import { getProjectInfoFormOptionsPart } from './getProjectInfoFormOptionsPart.js';

export const ProjectInfoFormOptions: TabContainerPanelComponent<IProjectInfoFormProps> = observer(function ProjectInfoFormOptions({ formState }) {
  const translate = useTranslate();
  const part = getProjectInfoFormOptionsPart(formState);

  useAutoLoad(ProjectInfoFormOptions, part);

  if (!part.state) {
    return null;
  }

  return (
    <ColoredContainer wrap overflow parent gap>
      <Container medium gap>
        <Group form gap>
          <GroupTitle>{translate('plugin_project_info_form_options_info')}</GroupTitle>
          <InputField name="name" state={part.state} readOnly>
            {translate('plugin_project_info_form_options_field_name')}
          </InputField>
          <InputField name="id" state={part.state} readOnly>
            {translate('plugin_project_info_form_options_field_id')}
          </InputField>
          {part.state.description && (
            <Textarea name="description" state={part.state} readOnly>
              {translate('plugin_project_info_form_options_field_description')}
            </Textarea>
          )}
        </Group>
      </Container>
    </ColoredContainer>
  );
});
