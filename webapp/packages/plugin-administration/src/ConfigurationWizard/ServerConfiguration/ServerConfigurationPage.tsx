/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { use, css } from 'reshadow';

import { AdministrationTools } from '@cloudbeaver/core-administration';
import { IconButton } from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ServerConfigurationForm } from './ServerConfigurationForm';
import { ServerConfigurationPageController } from './ServerConfigurationPageController';
import { ServerConfigurationService } from './ServerConfigurationService';

const styles = composes(
  css`
  AdministrationTools, layout-grid-cell {
    composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
  }

  layout-grid-cell, message-box {
    composes: theme-border-color-background from global;
  }
  `,
  css`
    layout-grid {
      width: 100%;
      flex: 1;
    }

    layout-grid-inner {
      min-height: 100%;
    }

    layout-grid-cell {
      position: relative;
      border: solid 1px;
    }

    message-box, AdministrationTools {
      border-bottom: solid 1px;
    }

    message-box, ServerConfigurationForm {
      padding: 16px 24px;
    }

    AdministrationTools {
      display: flex;
      padding: 0 16px;
      align-items: center;
      border-bottom: solid 1px;
    }

    IconButton {
      height: 32px;
      width: 32px;
      margin-right: 16px;
    }

    p {
      line-height: 2;
    }
  `
);

export const ServerConfigurationPage = observer(function ServerConfigurationPage() {
  const translate = useTranslate();
  const service = useService(ServerConfigurationService);
  const controller = useController(ServerConfigurationPageController);

  return styled(useStyles(styles))(
    <layout-grid as="div">
      <layout-grid-inner as="div">
        <layout-grid-cell as='div' {...use({ span: 12 })}>
          {!controller.editing ? (
            <message-box as='div'>
              <h3>{translate('administration_configuration_wizard_configuration_title')}</h3>
              <p>{translate('administration_configuration_wizard_configuration_message')}</p>
            </message-box>
          ) : (
            <AdministrationTools>
              <IconButton name="admin-save" viewBox="0 0 28 28" onClick={controller.save} />
              <IconButton name="admin-cancel" viewBox="0 0 28 28" onClick={controller.reset} />
            </AdministrationTools>
          )}
          <ServerConfigurationForm
            serverConfig={controller.state.serverConfig}
            validationTask={service.validationTask}
            editing={controller.editing}
            onChange={controller.change}
            onSubmit={controller.save}
          />
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
});
