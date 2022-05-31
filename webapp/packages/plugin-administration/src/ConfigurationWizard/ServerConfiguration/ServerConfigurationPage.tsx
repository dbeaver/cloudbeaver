/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AdministrationItemContentComponent, ADMINISTRATION_TOOLS_PANEL_STYLES, ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { BASE_CONTAINERS_STYLES, ColoredContainer, Container, Group, GroupItem, GroupTitle, ToolsAction, Loader, Placeholder, SubmittingForm, useFocus, useFormValidator, ToolsPanel } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { useStyles } from '@cloudbeaver/core-theming';

import { ServerConfigurationConfigurationForm } from './Form/ServerConfigurationConfigurationForm';
import { ServerConfigurationFeaturesForm } from './Form/ServerConfigurationFeaturesForm';
import { ServerConfigurationInfoForm } from './Form/ServerConfigurationInfoForm';
import { ServerConfigurationNavigatorViewForm } from './Form/ServerConfigurationNavigatorViewForm';
import { ServerConfigurationSecurityForm } from './Form/ServerConfigurationSecurityForm';
import { ServerConfigurationDriversForm } from './ServerConfigurationDriversForm';
import { ServerConfigurationService } from './ServerConfigurationService';

const styles = css`
  SubmittingForm {
    flex: 1;
    display: flex;
    overflow: auto;
    flex-direction: column;
  }

  p {
    white-space: pre-wrap;
    line-height: 2;
  }
`;

export const ServerConfigurationPage: AdministrationItemContentComponent = observer(function ServerConfigurationPage({
  configurationWizard,
}) {
  const translate = useTranslate();
  const style = useStyles(styles, ADMINISTRATION_TOOLS_PANEL_STYLES, BASE_CONTAINERS_STYLES);
  const [focusedRef, state] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const service = useService(ServerConfigurationService);
  const serverConfigResource = useService(ServerConfigResource);
  const commonDialogService = useService(CommonDialogService);
  const configurationWizardService = useService(ConfigurationWizardService);
  const changed = serverConfigResource.isChanged() || serverConfigResource.isNavigatorSettingsChanged();
  useFormValidator(service.validationTask, state.reference);

  function handleChange() {
    service.changed();

    if (!service.state.serverConfig.adminCredentialsSaveEnabled) {
      service.state.serverConfig.publicCredentialsSaveEnabled = false;
    }
  }

  function reset() {
    service.loadConfig(true);
  }

  async function save() {
    if (configurationWizard) {
      await configurationWizardService.next();
    } else {
      if (serverConfigResource.isChanged()) {
        const result = await commonDialogService.open(ConfirmationDialog, {
          title: 'administration_server_configuration_save_confirmation_title',
          message: 'administration_server_configuration_save_confirmation_message',
        });

        if (result === DialogueStateResult.Rejected) {
          return;
        }
      }
      await service.saveConfiguration(true);
    }
  }

  return styled(style)(
    <SubmittingForm ref={focusedRef} name='server_config' onChange={handleChange}>
      {!configurationWizard && (
        <ToolsPanel>
          <ToolsAction
            title={translate('administration_configuration_tools_save_tooltip')}
            icon="admin-save"
            viewBox="0 0 24 24"
            disabled={!changed}
            onClick={save}
          >
            {translate('ui_processing_save')}
          </ToolsAction>
          <ToolsAction
            title={translate('administration_configuration_tools_cancel_tooltip')}
            icon="admin-cancel"
            viewBox="0 0 24 24"
            disabled={!changed}
            onClick={reset}
          >
            {translate('ui_processing_cancel')}
          </ToolsAction>
        </ToolsPanel>
      )}
      <ColoredContainer wrap gap overflow parent>
        {configurationWizard && (
          <Group form>
            <GroupItem>
              <h3>{translate('administration_configuration_wizard_configuration_title')}</h3>
            </GroupItem>
            <GroupItem>
              <p>{translate('administration_configuration_wizard_configuration_message')}</p>
            </GroupItem>
          </Group>
        )}
        <Loader state={service}>
          {() => styled(style)(
            <Container wrap gap grid medium>
              <ServerConfigurationInfoForm state={service.state} />
              <Group form gap>
                <GroupTitle>{translate('administration_configuration_wizard_configuration_plugins')}</GroupTitle>
                <ServerConfigurationConfigurationForm serverConfig={service.state.serverConfig} />
                <ServerConfigurationNavigatorViewForm configs={service.state} />
                <ServerConfigurationFeaturesForm state={service.state} configurationWizard={configurationWizard} />
                <Placeholder
                  container={service.pluginsContainer}
                  configurationWizard={configurationWizard}
                  state={service.state}
                />
              </Group>
              <Placeholder
                container={service.configurationContainer}
                configurationWizard={configurationWizard}
                state={service.state}
              />
              <ServerConfigurationSecurityForm serverConfig={service.state.serverConfig} />
              <ServerConfigurationDriversForm serverConfig={service.state.serverConfig} />
            </Container>
          )}
        </Loader>
      </ColoredContainer>
    </SubmittingForm>
  );
});
