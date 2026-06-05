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
  const project = part.state.projectInfo;

  useAutoLoad(ProjectInfoFormOptions, part);

  return (
    <ColoredContainer wrap overflow parent gap>
      <Container medium gap>
        <Group form gap>
          <GroupTitle>{translate('plugin_project_info_form_options_info')}</GroupTitle>
          <InputField name="name" value={project?.name ?? ''} readOnly>
            {translate('plugin_project_info_form_options_field_name')}
          </InputField>
          <InputField name="id" value={project?.id ?? ''} readOnly>
            {translate('plugin_project_info_form_options_field_id')}
          </InputField>
          {project?.description && (
            <Textarea name="description" value={project.description} readOnly>
              {translate('plugin_project_info_form_options_field_description')}
            </Textarea>
          )}
          <InputField name="shared" value={project ? translate(project.shared ? 'ui_yes' : 'ui_no') : ''} readOnly>
            {translate('plugin_project_info_form_options_field_shared')}
          </InputField>
          <InputField name="global" value={project ? translate(project.global ? 'ui_yes' : 'ui_no') : ''} readOnly>
            {translate('plugin_project_info_form_options_field_global')}
          </InputField>
        </Group>
      </Container>
    </ColoredContainer>
  );
});
