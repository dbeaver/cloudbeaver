/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useState, useContext, useCallback } from 'react';
import styled, { css, use } from 'reshadow';

import {
  TabsState, TabList, Tab,
  TabTitle, Loader, SubmittingForm, TabPanel,
  ErrorMessage, Button, TableItemContext,
  TableContext
} from '@cloudbeaver/core-blocks';
import { useService, useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionsResource } from '../../ConnectionsResource';
import { ConnectionEditController } from './ConnectionEditController';
import { ConnectionForm } from './ConnectionForm/ConnectionForm';
import { DriverProperties } from './DriverProperties/DriverProperties';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }

    TabList {
      composes: theme-border-color-background from global;
    }

    ErrorMessage {
      composes: theme-background-secondary from global;
    }

    SubmittingForm {
      composes: theme-background-secondary from global;
    }
  `,
  css`
    custom-connection {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    CommonDialogWrapper {
      max-height: 500px;
      min-height: 500px;
    }

    SubmittingForm, BaseTabPanel {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    TabList {
      align-items: center;
      box-sizing: border-box;
      display: inline-flex;
      width: 100%;
      padding-left: 24px;
      outline: none;
      border-bottom: solid 1px;
    }

    Tab {
      composes: theme-typography--body2 from global;
      text-transform: uppercase;
      font-weight: normal;

      &:global([aria-selected=true]) {
        font-weight: normal !important;
      }
    }

    ErrorMessage {
      position: sticky;
      bottom: 0;
      padding: 8px 24px;
    }

    fill {
      flex: 1;
    }

    connection-form[|new] {
      border-left: solid 3px;
    }

    SubmittingForm, Loader {
      min-height: 320px;
      max-height: 500px;
    }

    IconButton {
      height: 32px;
      width: 32px;
      margin-right: 16px;
    }

    Button:not(:first-child) {
      margin-right: 24px;
    }
  `
);

type Props = {
  item: string;
}

export const ConnectionEdit = observer(function ConnectionEdit({
  item,
}: Props) {
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);

  const translate = useTranslate();
  const controller = useController(ConnectionEditController, item);
  const connectionsResource = useService(ConnectionsResource);
  const [loadProperties, setLoadProperties] = useState(false);

  const handleCancel = useCallback(() => {
    tableContext?.setItemExpand(context?.item, false);
    if (controller.isNew) {
      connectionsResource.delete(item);
    }
  }, [tableContext, context]);

  return styled(useStyles(styles))(
    <TabsState selectedId='options'>
      <TabList>
        <Tab tabId='options' >
          <TabTitle>{translate('customConnection_options')}</TabTitle>
        </Tab>
        <Tab tabId='driver_properties' onOpen={() => setLoadProperties(true)} disabled={!controller.driver} >
          <TabTitle>{translate('customConnection_properties')}</TabTitle>
        </Tab>
        <fill as="div" />
        <Button
          type="button"
          disabled={controller.isSaving}
          mod={['outlined']}
          onClick={handleCancel}
        >
          {translate('connections_connection_edit_cancel')}
        </Button>
        <Button
          type="button"
          disabled={controller.isSaving}
          mod={['unelevated']}
          onClick={controller.onSaveConnection}
        >
          {translate(controller.isNew ? 'connections_connection_edit_add' : 'connections_connection_edit_save')}
        </Button>
      </TabList>
      {controller.isLoading
        ? <Loader />
        : (
          <SubmittingForm onSubmit={controller.onSaveConnection}>
            <TabPanel tabId='options'>
              <ConnectionForm controller={controller} />
            </TabPanel>
            {controller.driver && (
              <TabPanel tabId='driver_properties'>
                <DriverProperties
                  driver={controller.driver}
                  state={controller.config.properties!}
                  loadProperties={loadProperties}
                />
              </TabPanel>
            )}
          </SubmittingForm>
        )
      }
      {controller.error.responseMessage && (
        <ErrorMessage
          text={controller.error.responseMessage}
          hasDetails={controller.error.hasDetails}
          onShowDetails={controller.onShowDetails}
        />
      )}
    </TabsState>
  );
});
