/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import {
  SubmittingForm, ErrorMessage, TabsState, TabList, Tab, TabTitle, TabPanel, Loader
} from '@cloudbeaver/core-blocks';
import { DBDriver } from '@cloudbeaver/core-connections';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogWrapper } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionForm } from './ConnectionForm/ConnectionForm';
import { ConnectionFormDialogController } from './ConnectionFormDialogController';
import { ConnectionFormDialogFooter } from './ConnectionFormDialogFooter';
import { DriverProperties } from './DriverProperties/DriverProperties';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }
    ErrorMessage {
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
      max-height: 550px;
      min-height: 550px;
    }
    SubmittingForm, BaseTabPanel {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    TabList {
      box-sizing: border-box;
      display: inline-flex;
      width: 100%;
      padding-left: 24px;
      outline: none;
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
  `
);

type ConnectionFormDialogProps = React.PropsWithChildren<{
  title: string;
  driver: DBDriver;
  onClose(): void;
  onBack(): void;
}>

export const ConnectionFormDialog = observer(function ConnectionFormDialog({
  title,
  driver,
  onClose,
  onBack,
}: ConnectionFormDialogProps) {
  const translate = useTranslate();
  const controller = useController(ConnectionFormDialogController, driver, onClose);
  const [loadProperties, setLoadProperties] = useState(false);

  return styled(useStyles(styles))(
    <TabsState selectedId='options'>
      <CommonDialogWrapper
        title={title}
        icon={driver?.icon}
        noBodyPadding
        header={(
          <TabList>
            <Tab tabId='options' >
              <TabTitle>{translate('customConnection_options')}</TabTitle>
            </Tab>
            <Tab tabId='driver_properties' onOpen={() => setLoadProperties(true)} >
              <TabTitle>{translate('customConnection_properties')}</TabTitle>
            </Tab>
          </TabList>
        )}
        footer={(
          <ConnectionFormDialogFooter
            isConnecting={controller.isConnecting}
            onConnectionTest={controller.onTestConnection}
            onCreateConnection={controller.onCreateConnection}
            onBack={onBack}
          />
        )}
        onReject={onClose}
      >
        {controller.isLoading
          ? <Loader />
          : (
            <SubmittingForm onSubmit={controller.onCreateConnection}>
              <TabPanel tabId='options'>
                <ConnectionForm driver={driver} controller={controller} />
              </TabPanel>
              <TabPanel tabId='driver_properties'>
                <DriverProperties
                  driver={driver}
                  state={controller.config.properties!}
                  loadProperties={loadProperties}
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
      </CommonDialogWrapper>
    </TabsState>
  );
});
