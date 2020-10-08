/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { use, css } from 'reshadow';

import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ServerConfigurationForm } from './ServerConfigurationForm';
import { ServerConfigurationPageController } from './ServerConfigurationPageController';

const styles = composes(
  css`
    layout-grid-cell {
      composes: theme-background-surface theme-text-on-surface from global;
    }

    layout-grid-cell {
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
      padding: 16px 24px
    }

    p {
      line-height: 2;
    }
  `
);

export const ServerConfigurationPage = observer(function ServerConfigurationPage() {
  const translate = useTranslate();
  const controller = useController(ServerConfigurationPageController);

  return styled(useStyles(styles))(
    <layout-grid as="div">
      <layout-grid-inner as="div">
        <layout-grid-cell as='div' {...use({ span: 12 })}>
          <h3>{translate('administration_configuration_wizard_configuration_title')}</h3>
          <p>{translate('administration_configuration_wizard_configuration_message')}</p>
          <ServerConfigurationForm
            serverConfig={controller.state.serverConfig}
            onChange={controller.onChange}
            onSave={controller.finish}
          />
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
});
