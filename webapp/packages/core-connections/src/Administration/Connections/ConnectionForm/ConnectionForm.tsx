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
  TabsState, TabList, Tab,
  TabTitle, Loader, TabPanel,
  Button, BORDER_TAB_STYLES
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionAccess } from './ConnectionAccess/ConnectionAccess';
import { Controller } from './Controller';
import { DriverProperties } from './DriverProperties/DriverProperties';
import { IConnectionFormModel } from './IConnectionFormModel';
import { Options } from './Options/Options';

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
  const controller = useController(Controller, model, onCancel);
  const translate = useTranslate();

  return styled(useStyles(styles, BORDER_TAB_STYLES))(
    <TabsState selectedId='options'>
      <box as='div'>
        <TabList>
          <Tab tabId='options'>
            <TabTitle>{translate('customConnection_options')}</TabTitle>
          </Tab>
          <Tab tabId='driver_properties' disabled={!controller.driver}>
            <TabTitle>{translate('customConnection_properties')}</TabTitle>
          </Tab>
          <Tab tabId='access' disabled={!controller.driver || !controller.isTabAvailable('access')}>
            <TabTitle>{translate('connections_connection_edit_access')}</TabTitle>
          </Tab>
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
          {controller.isLoading
            ? <Loader />
            : (
              <>
                <TabPanel tabId='options'>
                  <Options
                    model={model}
                    type={controller.connectionType}
                    disabled={controller.isDisabled}
                    onTypeChange={controller.setType}
                    onSave={controller.save}
                  />
                </TabPanel>
                {model.connection.driverId && (
                  <TabPanel tabId='driver_properties'>
                    {state => (
                      <DriverProperties
                        driverId={model.connection.driverId}
                        state={model.connection.properties}
                        loadProperties={state.selectedId === 'driver_properties'}
                      />
                    )}
                  </TabPanel>
                )}
                <TabPanel tabId='access'>
                  {state => {
                    if (state.selectedId === 'access') {
                      controller.loadAccessSubjects();
                    } else {
                      return null;
                    }

                    return (
                      <ConnectionAccess
                        model={model}
                        disabled={controller.isDisabled}
                        onChange={controller.handleAccessChange}
                      />
                    );
                  }}
                </TabPanel>
              </>
            )}
        </content-box>
      </box>
    </TabsState>
  );
});
