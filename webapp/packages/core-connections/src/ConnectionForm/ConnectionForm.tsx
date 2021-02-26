/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import {
  TabsState, TabList,
  Button, BORDER_TAB_STYLES, TabPanelList, Placeholder, useObjectRef
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionFormService, IConnectionFormData, IConnectionFormOptions } from './ConnectionFormService';
import { useConnectionFormState } from './useConnectionFormState';

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
  `,
  css`
    TabList {
      flex-shrink: 0;
    }
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

    fill {
      flex: 1;
    }

    Button:not(:first-child) {
      margin-right: 24px;
    }
  `
);

interface Props {
  data: IConnectionFormData;
  options: IConnectionFormOptions;
  onCancel?: () => void;
  onSave?: () => void;
}

export const ConnectionForm = observer(function ConnectionForm({
  data,
  options,
  onCancel = () => {},
  onSave = () => {},
}: Props) {
  const props = useObjectRef({ onSave });
  const style = [styles, BORDER_TAB_STYLES];
  const translate = useTranslate();
  const service = useService(ConnectionFormService);
  const formState = useConnectionFormState(data, options);

  useEffect(() => {
    formState.submittingHandlers.addPostHandler((data, contexts) => {
      const validation = contexts.getContext(service.connectionValidationContext);
      const state = contexts.getContext(service.connectionStatusContext);

      if (validation.valid && state.saved && data.submitType === 'submit') {
        props.onSave();
      }
    });
  }, []);

  return styled(useStyles(style))(
    <TabsState
      container={service.tabsContainer}
      localState={data.partsState}
      data={data}
      form={formState}
      options={options}
    >
      <box as='div'>
        <TabList style={style}>
          <fill as="div" />
          <Placeholder container={service.actionsContainer} context={{ data, form: formState.form, options }} />
          <Button
            type="button"
            disabled={formState.form.disabled}
            mod={['outlined']}
            onClick={onCancel}
          >
            {translate('ui_processing_cancel')}
          </Button>
          <Button
            type="button"
            disabled={formState.form.disabled}
            mod={['outlined']}
            onClick={formState.test}
          >
            {translate('connections_connection_test')}
          </Button>
          <Button
            type="button"
            disabled={formState.form.disabled || formState.form.readonly}
            mod={['unelevated']}
            onClick={formState.save}
          >
            {translate(options.mode === 'edit' ? 'ui_processing_save' : 'ui_processing_create')}
          </Button>
        </TabList>
        <content-box as="div">
          <TabPanelList style={style} />
        </content-box>
      </box>
    </TabsState>
  );
});
