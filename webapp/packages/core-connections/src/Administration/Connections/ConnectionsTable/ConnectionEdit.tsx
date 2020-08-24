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
import { GrantedSubjects } from './GrantedSubjects';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }

    ErrorMessage {
      composes: theme-background-secondary from global;
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
      padding: 24px;
    }

    SubmittingForm {
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
    }

    TabPanel {
      overflow: auto !important;
    }

    Tab {
      composes: theme-typography--body2 from global;
      text-transform: uppercase;
      font-weight: normal;

      &:global([aria-selected=true]) {
        font-weight: normal !important;
      }

      & TabTitle {
        padding: 0 24px !important;
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

    SubmittingForm, Loader {
      min-height: 320px;
      max-height: 500px;
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
  const collapse = useCallback(() => tableContext?.setItemExpand(item, false), [tableContext]);

  const translate = useTranslate();
  const controller = useController(ConnectionEditController, item, collapse);
  const connectionsResource = useService(ConnectionsResource);
  const [loadProperties, setLoadProperties] = useState(false);

  const handleCancel = useCallback(() => {
    collapse();
    if (controller.isNew) {
      connectionsResource.delete(item);
    }
  }, [collapse]);

  return styled(useStyles(styles))(
    <TabsState selectedId='options'>
      <box as='div'>
        <TabList>
          <Tab tabId='options' >
            <TabTitle>{translate('customConnection_options')}</TabTitle>
          </Tab>
          <Tab tabId='driver_properties' onOpen={() => setLoadProperties(true)} disabled={!controller.driver} >
            <TabTitle>{translate('customConnection_properties')}</TabTitle>
          </Tab>
          <Tab tabId='access' onOpen={controller.loadAccessSubjects} disabled={!controller.driver} >
            <TabTitle>{translate('connections_connection_edit_access')}</TabTitle>
          </Tab>
          <fill as="div" />
          <Button
            type="button"
            disabled={controller.isDisabled}
            mod={['outlined']}
            onClick={handleCancel}
          >
            {translate('ui_processing_cancel')}
          </Button>
          <Button
            type="button"
            disabled={controller.isDisabled}
            mod={['unelevated']}
            onClick={controller.onSaveConnection}
          >
            {translate(controller.isNew ? 'ui_processing_create' : 'ui_processing_save')}
          </Button>
        </TabList>
        <content-box as="div">
          {controller.isLoading
            ? <Loader />
            : (
              <SubmittingForm onSubmit={controller.onSaveConnection} name='connection_edit'>
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
                <TabPanel tabId='access'>
                  <GrantedSubjects
                    grantedSubjects={controller.grantedSubjects}
                    users={controller.users}
                    roles={controller.roles}
                    selectedSubjects={controller.selectedSubjects}
                    disabled={controller.isLoading || controller.isSaving}
                    onChange={controller.handleAccessChange}
                  />
                </TabPanel>
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
        </content-box>
      </box>
    </TabsState>
  );
});
