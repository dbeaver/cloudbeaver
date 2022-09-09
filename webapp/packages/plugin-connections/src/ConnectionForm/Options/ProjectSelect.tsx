/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type React from 'react';

import { Combobox, useMapResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ProjectInfo, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';


interface Props {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
}

export const ProjectSelect = observer(function ProjectSelect(props: Props) {
  const translate = useTranslate();

  const projectsLoader = useMapResource(ProjectSelect, ProjectInfoResource, CachedMapAllKey);
  const projects = projectsLoader.data as ProjectInfo[];

  function handleProjectSelect(projectId: string) {
    const project = projectsLoader.resource.get(projectId);

    if (project?.canCreateConnections) {
      props.onChange(projectId);
    }
  }

  const possibleOptions = projects.filter(project => project.canCreateConnections);

  return  (
    <Combobox
      name='projectId'
      value={props.value}
      items={projects}
      keySelector={project => project.id}
      valueSelector={project => project.name}
      titleSelector={project => project.description}
      isDisabled={project => !project.canCreateConnections}
      readOnly={props.readOnly || possibleOptions.length <= 1}
      searchable={projects.length > 10}
      disabled={props.disabled}
      loading={projectsLoader.isLoading()}
      tiny
      fill
      onSelect={handleProjectSelect}
    >
      {translate('connections_connection_project')}
    </Combobox>
  );
});