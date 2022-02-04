/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css, use } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Button, Group, GroupTitle, IconOrImage, Switch } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_NAV_TREE_ROOT } from './DATA_CONTEXT_NAV_TREE_ROOT';
import type { INavigationTreeUserSettings } from './INavigationTreeUserSettings';

const expandStyles = css`
  Button {
    width: 100%;
    height: 24px !important;
  }
  IconOrImage {
    width: 12px;
    &[|opened] {
      transform: rotate(180deg);
    }
  }
  Group {
    min-width: 350px;
    width: min-content;
  }
`;

interface Props {
  root: string;
  settings: INavigationTreeUserSettings;
}

export const NavigationTreeSettings = observer<Props>(function NavigationTreeSettings({
  root,
  settings,
}) {
  const styles = useStyles(BASE_CONTAINERS_STYLES, expandStyles);
  const translate = useTranslate();
  const [opened, setOpen] = useState(false);
  
  useCaptureViewContext(context => {
    context?.set(DATA_CONTEXT_NAV_TREE_ROOT, root);
  });

  if (!opened) {
    return styled(styles)(
      <Button onClick={() => setOpen(true)}>
        <IconOrImage icon='angle' {...use({ opened })} />
      </Button>
    );
  }

  return styled(styles)(
    <>
      <Group keepSize form gap>
        <GroupTitle>{translate('app_navigationTree_settings_title')}</GroupTitle>
        <Switch
          name="filter"
          state={settings}
          description={translate('app_navigationTree_settings_filter_description')}
          mod={['primary']}
          small
        >
          {translate('app_navigationTree_settings_filter_title')}
        </Switch>
        <Switch
          name="filterAll"
          state={settings}
          disabled={!settings.filter}
          description={translate('app_navigationTree_settings_filter_all_description')}
          mod={['primary']}
          small
        >
          {translate('app_navigationTree_settings_filter_all_title')}
        </Switch>
        <Switch
          name="saveExpanded"
          state={settings}
          description={translate('app_navigationTree_settings_state_description')}
          mod={['primary']}
          small
        >
          {translate('app_navigationTree_settings_state_title')}
        </Switch>
        <Switch
          name="folders"
          state={settings}
          description={translate('app_navigationTree_settings_folders_description')}
          mod={['primary']}
          small
        >
          {translate('app_navigationTree_settings_folders_title')}
        </Switch>
      </Group>
      <Button onClick={() => setOpen(false)}>
        <IconOrImage icon='angle' {...use({ opened })} />
      </Button>
    </>
  );
});