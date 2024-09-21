/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type PlaceholderComponent, type PlaceholderElement, Switch, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ProjectsService } from '@cloudbeaver/core-projects';
import type { IElementsTreeSettingsProps } from '@cloudbeaver/plugin-navigation-tree';

export const ProjectsSettingsForm: PlaceholderComponent<IElementsTreeSettingsProps> = observer(function ProjectsSettingsForm({
  tree: { root, settings },
}) {
  const projectsService = useService(ProjectsService);
  const translate = useTranslate();

  if (!settings || projectsService.activeProjects.length <= 1) {
    return null;
  }

  return (
    <>
      <Switch
        id={`${root}.projects`}
        name="projects"
        state={settings}
        disabled={!settings.configurable}
        title={translate('plugin_navigation_tree_settings_projects_description')}
        mod={['primary', 'dense']}
        small
      >
        {translate('plugin_navigation_tree_settings_projects_title')}
      </Switch>
    </>
  );
});

export const ProjectsSettingsPlaceholderElement: PlaceholderElement<IElementsTreeSettingsProps> = {
  id: 'settings-project',
  component: ProjectsSettingsForm,
  order: 1,
};
