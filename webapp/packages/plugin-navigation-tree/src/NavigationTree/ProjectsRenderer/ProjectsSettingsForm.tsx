/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { type PlaceholderComponent, BASE_CONTAINERS_STYLES, Switch, PlaceholderElement } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IElementsTreeSettingsProps } from '../ElementsTree/ElementsTreeTools/NavigationTreeSettings/ElementsTreeSettingsService';


export const ProjectsSettingsForm: PlaceholderComponent<IElementsTreeSettingsProps>  = observer(function ProjectsSettingsForm({
  tree: { root, settings },
  style,
}) {
  const projectsService = useService(ProjectsService);
  const styles = useStyles(BASE_CONTAINERS_STYLES, style);
  const translate = useTranslate();

  if (!settings || projectsService.activeProjects.length <= 1) {
    return null;
  }

  return styled(styles)(
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