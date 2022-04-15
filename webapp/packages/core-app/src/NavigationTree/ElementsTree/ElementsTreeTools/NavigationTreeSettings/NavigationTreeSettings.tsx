/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Group, GroupTitle, Switch } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import type { IElementsTreeSettings } from '../../useElementsTree';

const expandStyles = css`
  settings {
    display: flex;
    flex-direction: row;
  }
  Group {
    min-width: 350px;
    width: min-content;

    &[dense] {
      padding: 12px;
    }
  }
`;

interface Props {
  root: string;
  settings: IElementsTreeSettings;
  style?: ComponentStyle;
  className?: string;
}

export const NavigationTreeSettings = observer<Props>(function NavigationTreeSettings({
  root,
  settings,
  style,
  className,
}) {
  const styles = useStyles(BASE_CONTAINERS_STYLES, expandStyles, style);
  const translate = useTranslate();

  return styled(styles)(
    <settings className={className}>
      <Group keepSize form gap dense>
        <GroupTitle>{translate('ui_settings')}</GroupTitle>
        <Switch
          id={`${root}.filter`}
          name="filter"
          state={settings}
          disabled={!settings.configurable}
          title={translate('app_navigationTree_settings_filter_description')}
          mod={['primary', 'dense']}
          small
        >
          {translate('app_navigationTree_settings_filter_title')}
        </Switch>
        <Switch
          id={`${root}.filterAll`}
          name="filterAll"
          state={settings}
          disabled={!settings.filter || !settings.configurable}
          title={translate('app_navigationTree_settings_filter_all_description')}
          mod={['primary', 'dense']}
          small
        >
          {translate('app_navigationTree_settings_filter_all_title')}
        </Switch>
        <Switch
          id={`${root}.saveExpanded`}
          name="saveExpanded"
          state={settings}
          disabled={!settings.configurable}
          title={translate('app_navigationTree_settings_state_description')}
          mod={['primary', 'dense']}
          small
        >
          {translate('app_navigationTree_settings_state_title')}
        </Switch>
        <Switch
          id={`${root}.foldersTree`}
          name="foldersTree"
          state={settings}
          disabled={!settings.configurable}
          title={translate('app_navigationTree_settings_folders_description')}
          mod={['primary', 'dense']}
          small
        >
          {translate('app_navigationTree_settings_folders_title')}
        </Switch>
      </Group>
    </settings>
  );
});