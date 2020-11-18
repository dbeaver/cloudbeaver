/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import {
  TabsState, TabList,
  Button, BORDER_TAB_STYLES, TabPanelList
} from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionFormController } from './ConnectionFormController';
import { ConnectionFormService } from './ConnectionFormService';
import { IConnectionFormModel } from './IConnectionFormModel';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }

    TabList {
      composes: theme-background-surface theme-text-on-surface from global;
    }

    box {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }

    content-box {
      composes: theme-background-secondary theme-border-color-background from global;
    }

    GrantedSubjects {
      composes: theme-background-surface from global;
    }
  `,
  css`
    box {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
      overflow: auto;
    }
    content-box {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: auto;
    }

    SubmittingForm {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    fill {
      flex: 1;
    }

    SubmittingForm, Loader {
      min-height: 320px;
      max-height: 500px;
    }

    Button:not(:first-child) {
      margin-right: 24px;
    }
  `
);

interface Props {
  model: IConnectionFormModel;
  onBack?: () => void;
  onCancel?: () => void;
}

export const ConnectionForm = observer(function ConnectionForm({
  model,
  onBack = () => {},
  onCancel = () => {},
}: Props) {
  const style = [styles, BORDER_TAB_STYLES];
  const service = useService(ConnectionFormService);
  const controller = useController(ConnectionFormController, model, onCancel);
  const translate = useTranslate();

  return styled(useStyles(style))(
    <TabsState
      container={service.tabsContainer}
      model={model}
      controller={controller}
    >
      <box as='div'>
        <TabList style={style}>
          <fill as="div" />
          <Button
            type="button"
            disabled={controller.isDisabled}
            mod={['outlined']}
            onClick={onBack}
          >
            {translate('ui_processing_cancel')}
          </Button>
          <Button
            type="button"
            disabled={controller.isDisabled}
            mod={['outlined']}
            onClick={controller.test}
          >
            {translate('connections_connection_test')}
          </Button>
          <Button
            type="button"
            disabled={controller.isDisabled}
            mod={['unelevated']}
            onClick={controller.save}
          >
            {translate(!model.editing ? 'ui_processing_create' : 'ui_processing_save')}
          </Button>
        </TabList>
        <content-box as="div">
          <TabPanelList style={style} />
        </content-box>
      </box>
    </TabsState>
  );
});
