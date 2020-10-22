/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { use, css } from 'reshadow';

import { AdministrationTools, ADMINISTRATION_TOOLS_STYLES } from '@cloudbeaver/core-administration';
import { FormBox, FormBoxElement, IconButton, Loader, SubmittingForm, useFocus } from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { useFormValidator } from '@cloudbeaver/core-executor';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ServerConfigurationAdminForm } from './Form/ServerConfigurationAdminForm';
import { ServerConfigurationConfigurationForm } from './Form/ServerConfigurationConfigurationForm';
import { ServerConfigurationInfoForm } from './Form/ServerConfigurationInfoForm';
import { ServerConfigurationPageController } from './ServerConfigurationPageController';
import { ServerConfigurationService } from './ServerConfigurationService';

const styles = composes(
  css`
  layout-grid-cell {
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
      display: flex;
      flex-direction: column;
      border: solid 1px;
    }

    message-box {
      border-bottom: solid 1px;
    }

    message-box, SubmittingForm {
      padding: 16px 24px;
    }

    SubmittingForm {
      flex: 1;
      display: flex;
      overflow: auto;
      flex-direction: column;
    }

    FormBox {
      flex: 0;
    }

    p {
      line-height: 2;
    }
  `
);

export const ServerConfigurationPage = observer(function ServerConfigurationPage() {
  const translate = useTranslate();
  const style = useStyles(styles, ADMINISTRATION_TOOLS_STYLES);
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const service = useService(ServerConfigurationService);
  const controller = useController(ServerConfigurationPageController);
  useFormValidator(service.validationTask, focusedRef);

  return styled(style)(
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
          <SubmittingForm ref={focusedRef} name='server_config' onSubmit={controller.save} onChange={controller.change}>
            {service.loading ? (
              <Loader />
            ) : (
              <>
                <FormBox>
                  <FormBoxElement>
                    <ServerConfigurationInfoForm serverConfig={controller.state.serverConfig} />
                    {!controller.editing && (
                      <ServerConfigurationAdminForm serverConfig={controller.state.serverConfig} />
                    )}
                  </FormBoxElement>
                  <FormBoxElement>
                    <ServerConfigurationConfigurationForm serverConfig={controller.state.serverConfig} />
                  </FormBoxElement>
                </FormBox>
              </>
            )}
          </SubmittingForm>
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
});
