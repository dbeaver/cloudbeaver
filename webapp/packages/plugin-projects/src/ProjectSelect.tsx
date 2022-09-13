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
import { ProjectInfo, ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

interface Props {
  value: string | null;
  filter?: (project: ProjectInfo) => boolean;
  onChange: (value: string) => void;
  autoHide?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  inline?: boolean;
}

export const ProjectSelect = observer(function ProjectSelect({
  value,
  filter = project => project.canEditDataSources,
  autoHide,
  readOnly,
  disabled,
  inline,
  onChange,
}: Props) {
  const translate = useTranslate();

  const projectsService = useService(ProjectsService);
  const projectsLoader = useMapResource(ProjectSelect, ProjectInfoResource, CachedMapAllKey, {
    onData: () => {
      if (!value && projectsService.activeProject) {
        onChange(projectsService.activeProject.id);
      }
    },
  });

  value = value ?? projectsService.activeProject?.id ?? null;
  const projects = projectsLoader.data as ProjectInfo[];

  const possibleOptions = projects.filter(filter);

  function handleProjectSelect(projectId: string) {
    const project = projectsLoader.resource.get(projectId);

    if (project && filter(project)) {
      onChange(projectId);
    }
  }

  if (autoHide && possibleOptions.length <= 1) {
    return null;
  }

  return  (
    <Combobox
      name='projectId'
      value={value ?? ''}
      items={projects}
      keySelector={project => project.id}
      valueSelector={project => project.name}
      titleSelector={project => project.description}
      isDisabled={project => !project.canEditDataSources}
      readOnly={readOnly || possibleOptions.length <= 1}
      searchable={projects.length > 10}
      disabled={disabled}
      loading={projectsLoader.isLoading()}
      inline={inline}
      tiny
      fill
      onSelect={handleProjectSelect}
    >
      {translate('connections_connection_project')}
    </Combobox>
  );
});