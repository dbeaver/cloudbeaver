/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Group,
  Loader,
  s,
  useAutoLoad,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { type NavNode, NavTreeResource } from '@cloudbeaver/core-navigation-tree';

import { FiltersTable } from './FiltersTable.js';
import styles from './NavigationTreeFiltersDialog.module.css';
import { useFilters } from './useFilters.js';

interface Payload {
  node: NavNode;
}

export const NavigationTreeFiltersDialog = observer<DialogComponentProps<Payload>>(function NavigationTreeFiltersDialog({
  rejectDialog,
  resolveDialog,
  payload,
}) {
  const translate = useTranslate();
  const style = useS(styles);
  const notificationService = useService(NotificationService);
  const navTreeResource = useService(NavTreeResource);
  const state = useFilters(payload.node.id);

  useAutoLoad(NavigationTreeFiltersDialog, state);

  async function submit() {
    try {
      await navTreeResource.setFilter(payload.node.id, state.filters.include, state.filters.exclude);
      resolveDialog();
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_navigation_tree_filters_submit_fail');
    }
  }

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader
        title={translate('plugin_navigation_tree_filters_configuration', undefined, { name: payload.node.name })}
        icon="filter"
        onReject={rejectDialog}
      />
      <CommonDialogBody noOverflow noBodyPadding>
        <Loader state={state}>
          <Group box>
            <div className={s(style, { tablesContainer: true })}>
              <div className={s(style, { tableContainer: true })}>
                <FiltersTable
                  title={translate('plugin_navigation_tree_filters_include')}
                  filters={state.filters.include}
                  onAdd={state.include}
                  onDelete={state.deleteInclude}
                />
              </div>
              <div className={s(style, { tableContainer: true })}>
                <FiltersTable
                  title={translate('plugin_navigation_tree_filters_exclude')}
                  filters={state.filters.exclude}
                  onAdd={state.exclude}
                  onDelete={state.deleteExclude}
                />
              </div>
            </div>
          </Group>
        </Loader>
      </CommonDialogBody>
      <CommonDialogFooter>
        <div className={s(style, { footerContainer: true })}>
          <Button variant="secondary" onClick={rejectDialog}>
            {translate('ui_close')}
          </Button>
          <Button onClick={submit}>{translate('ui_apply')}</Button>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
