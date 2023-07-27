/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';

import { Button, Container, Group, InputField, Loader, s, useAutoLoad, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { type NavNode, NavTreeResource } from '@cloudbeaver/core-navigation-tree';

import { FiltersTable } from './FiltersTable';
import styles from './NavigatorFiltersDialog.m.css';
import { useFilters } from './useFilters';

interface Payload {
  node: NavNode;
}

export const NavigatorFiltersDialog = observer<DialogComponentProps<Payload>>(function NavigatorFiltersDialog({
  rejectDialog,
  resolveDialog,
  payload,
}) {
  const translate = useTranslate();
  const navTreeResource = useService(NavTreeResource);
  const style = useS(styles);

  const state = useFilters(payload.node.id);

  useAutoLoad(state);

  async function submit() {
    await navTreeResource.setFilter(payload.node.id, state.filters.include, state.filters.exclude);
    resolveDialog();
  }

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader
        title={translate('plugin_navigator_filters_configuration', undefined, { name: payload.node.name })}
        subTitle={translate('plugin_navigator_filters_subtitle')}
        icon="filter"
        onReject={rejectDialog}
      />
      <CommonDialogBody noOverflow noBodyPadding>
        <div>
          <Loader state={state}>
            <Group gap>
              <Container noWrap gap>
                <div>
                  <div>Include</div>
                  <FiltersTable filters={state.filters.include} onAdd={state.include} onDelete={state.deleteInclude} />
                </div>
                <div>
                  <div>Exclude</div>
                  <FiltersTable filters={state.filters.exclude} onAdd={state.exclude} onDelete={state.deleteExclude} />
                </div>
              </Container>
            </Group>
          </Loader>
        </div>
      </CommonDialogBody>
      <CommonDialogFooter>
        <div className={s(style, { footerContainer: true })}>
          <Button mod={['outlined']} onClick={rejectDialog}>
            {translate('ui_close')}
          </Button>
          <Button mod={['unelevated']} onClick={submit}>
            {translate('ui_apply')}
          </Button>
        </div>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
