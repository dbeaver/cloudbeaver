/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import {
  useTabState, Tab as BaseTab, TabList, TabPanel as BaseTabPanel,
} from 'reakit/Tab';
import styled, { css } from 'reshadow';

import { DBDriver } from '@dbeaver/core/app';
import { SubmittingForm, ErrorMessage } from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/di';
import { CommonDialogWrapper } from '@dbeaver/core/dialogs';
import { useTranslate } from '@dbeaver/core/localization';
import { useStyles, composes } from '@dbeaver/core/theming';

import { ConnectionForm } from './ConnectionForm/ConnectionForm';
import { ConnectionFormDialogController } from './ConnectionFormDialogController';
import { ConnectionFormDialogFooter } from './ConnectionFormDialogFooter';
import { DriverProperties } from './DriverProperties/DriverProperties';


const styles = composes(
  css`
    BaseTab {
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
      display: flex;
      flex-direction: column;
      max-height: 330px;
      min-height: 330px;
    }
    SubmittingForm {
      overflow: auto;
    }
    SubmittingForm, BaseTabPanel {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    BaseTab, BaseTabPanel {
      outline: none;
    }

    TabList {
      box-sizing: border-box;
      display: inline-flex;
      width: 100%;
      padding-left: 24px;
    }
    BaseTab {
      composes: theme-typography--body2 from global;
      text-transform: uppercase;
      padding: 12px 16px;
      border-top: solid 2px transparent;
      height: 48px;

      &:global([aria-selected='true']) {
        border-top-color: #fd1d48;

        &:before {
          display: none;
        }
      }

      &:not(:global([aria-selected='true'])) {
        cursor: pointer;
        background-color: transparent !important;
      }
    }
    BaseTabPanel::first-child {
      flex-direction: column;
      padding: 18px 24px;
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

export const ConnectionFormDialog = observer(
  function ConnectionFormDialog({
    title,
    driver,
    onClose,
    onBack,
  }: ConnectionFormDialogProps) {
    const translate = useTranslate();
    const controller = useController(ConnectionFormDialogController, driver, onClose);
    const tab = useTabState({
      selectedId: 'options',
    });

    return styled(useStyles(styles))(
      <CommonDialogWrapper
        title={title}
        noBodyPadding
        header={(
          <TabList {...tab} aria-label="My tabs">
            <BaseTab {...tab} type='button' stopId='options'>{translate('customConnection_options')}</BaseTab>
            <BaseTab {...tab} type='button' stopId='driver_properties'>{translate('customConnection_properties')}</BaseTab>
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
        <SubmittingForm onSubmit={controller.onCreateConnection}>
          <BaseTabPanel {...tab} stopId='options'>
            <ConnectionForm driver={driver} controller={controller} />
          </BaseTabPanel>
          <BaseTabPanel {...tab} stopId='driver_properties'>
            <DriverProperties
              driver={driver}
              state={controller.config.properties}
              isSelected={tab.selectedId === 'driver_properties'}
            />
          </BaseTabPanel>
        </SubmittingForm>
        {controller.responseMessage && (
          <ErrorMessage
            text={controller.responseMessage}
            hasDetails={controller.hasDetails}
            onShowDetails={controller.onShowDetails}
          />
        )}
      </CommonDialogWrapper>
    );
  }
);
