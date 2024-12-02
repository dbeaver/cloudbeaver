/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Combobox, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ProjectInfo, ProjectInfoResource, projectInfoSortByName, ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';

interface Props {
  value: string | null;
  autoHide?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  inline?: boolean;
  onChange: (value: string) => void;
  filter?: (project: ProjectInfo) => boolean;
  descriptionGetter?: (projects: ProjectInfo[], possibleOptions: string[]) => string | undefined;
}

export const ProjectSelect = observer(function ProjectSelect({
  value,
  filter = project => project.canEditDataSources,
  autoHide,
  readOnly,
  disabled,
  inline,
  onChange,
  descriptionGetter,
}: Props) {
  const translate = useTranslate();

  const projectsService = useService(ProjectsService);

  const projects = projectsService.activeProjects.slice().sort(projectInfoSortByName);

  const possibleOptions = projects.filter(filter).map(project => project.id);

  const projectsLoader = useResource(ProjectSelect, ProjectInfoResource, CachedMapAllKey, {
    onData: () => {
      if ((!value && possibleOptions.length > 0) || (value && !possibleOptions.includes(value))) {
        onChange(possibleOptions[0]!);
      }
    },
  });

  function handleProjectSelect(projectId: string) {
    if (possibleOptions.includes(projectId)) {
      onChange(projectId);
    }
  }

  if (autoHide && projects.length <= 1) {
    return null;
  }

  const description = descriptionGetter?.(projects, possibleOptions);

  return (
    <Combobox
      name="projectId"
      value={value ?? ''}
      items={projects}
      keySelector={project => project.id}
      valueSelector={project => project.name}
      titleSelector={project => project.description}
      isDisabled={project => !filter(project)}
      readOnly={readOnly || possibleOptions.length <= 1}
      searchable={projects.length > 10}
      disabled={disabled}
      loading={projectsLoader.isLoading()}
      inline={inline}
      description={description}
      tiny
      fill
      onSelect={handleProjectSelect}
    >
      {translate('plugin_projects_project_select_label')}
    </Combobox>
  );
});
