/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Combobox, useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { Project, ProjectsResource, ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

interface Props {
  value: string | null;
  onChange: (value: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
  inline?: boolean;
}

export const ProjectSelect = observer(function ProjectSelect(props: Props) {
  const translate = useTranslate();

  const projectsService = useService(ProjectsService);
  const projectsLoader = useMapResource(ProjectSelect, ProjectsResource, CachedMapAllKey, {
    onData: () => {
      if (!props.value && projectsService.activeProject) {
        props.onChange(projectsService.activeProject.id);
      }
    },
  });

  const value = props.value ?? projectsService.activeProject?.id;

  const projects = projectsLoader.data as Project[];

  const possibleOptions = projects.filter(project => project.canCreateConnections);

  function handleProjectSelect(projectId: string) {
    const project = projectsLoader.resource.get(projectId);

    if (project?.canCreateConnections) {
      props.onChange(projectId);
    }
  }

  return  (
    <Combobox
      name='projectId'
      value={value ?? ''}
      items={projects}
      keySelector={project => project.id}
      valueSelector={project => project.name}
      titleSelector={project => project.description}
      isDisabled={project => !project.canCreateConnections}
      readOnly={props.readOnly || possibleOptions.length <= 1}
      searchable={projects.length > 10}
      disabled={props.disabled}
      loading={projectsLoader.isLoading()}
      inline={props.inline}
      tiny
      fill
      onSelect={handleProjectSelect}
    >
      {translate('connections_connection_project')}
    </Combobox>
  );
});