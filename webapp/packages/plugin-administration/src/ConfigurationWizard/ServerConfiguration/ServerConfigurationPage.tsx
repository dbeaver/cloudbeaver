/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type AdministrationItemContentComponent, ConfigurationWizardService } from '@cloudbeaver/core-administration';
import {
  ColoredContainer,
  ConfirmationDialog,
  Container,
  Form,
  Group,
  GroupItem,
  GroupTitle,
  Loader,
  Placeholder,
  s,
  ToolsAction,
  ToolsPanel,
  useFocus,
  useFormValidator,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { DefaultNavigatorSettingsResource, ServerConfigResource } from '@cloudbeaver/core-root';

import { ServerConfigurationConfigurationForm } from './Form/ServerConfigurationConfigurationForm.js';
import { ServerConfigurationFeaturesForm } from './Form/ServerConfigurationFeaturesForm.js';
import { ServerConfigurationInfoForm } from './Form/ServerConfigurationInfoForm.js';
import { ServerConfigurationNavigatorViewForm } from './Form/ServerConfigurationNavigatorViewForm.js';
import { ServerConfigurationSecurityForm } from './Form/ServerConfigurationSecurityForm.js';
import { ServerConfigurationDriversForm } from './ServerConfigurationDriversForm.js';
import style from './ServerConfigurationPage.module.css';
import { ServerConfigurationService } from './ServerConfigurationService.js';

export const ServerConfigurationPage: AdministrationItemContentComponent = observer(function ServerConfigurationPage({ configurationWizard }) {
  const translate = useTranslate();
  const styles = useS(style);
  const [focusedRef, state] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const service = useService(ServerConfigurationService);
  const serverConfigResource = useService(ServerConfigResource);
  const defaultNavigatorSettingsResource = useService(DefaultNavigatorSettingsResource);
  const commonDialogService = useService(CommonDialogService);
  const configurationWizardService = useService(ConfigurationWizardService);
  const changed = serverConfigResource.isChanged() || defaultNavigatorSettingsResource.isChanged();
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

  return (
    <ColoredContainer vertical wrap gap parent>
      {!configurationWizard && (
        <Group box keepSize>
          <ToolsPanel rounded>
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
        </Group>
      )}

      <Container overflow gap wrap>
        {configurationWizard && (
          <Group form>
            <GroupItem>
              <h3>{translate('administration_configuration_wizard_configuration_title')}</h3>
            </GroupItem>
            <GroupItem>
              <p className={s(styles, { message: true })}>{translate('administration_configuration_wizard_configuration_message')}</p>
            </GroupItem>
          </Group>
        )}
        <Loader state={service}>
          {() => (
            <Loader className={s(styles, { loader: true })} suspense>
              <Form ref={focusedRef} name="server_config" contents onChange={handleChange}>
                <Container wrap gap grid medium>
                  <ServerConfigurationInfoForm state={service.state} />
                  <Group form gap>
                    <GroupTitle>{translate('administration_configuration_wizard_configuration_plugins')}</GroupTitle>
                    <ServerConfigurationConfigurationForm serverConfig={service.state.serverConfig} />
                    <ServerConfigurationNavigatorViewForm configs={service.state} />
                    <ServerConfigurationFeaturesForm state={service.state} configurationWizard={configurationWizard} />
                    <Placeholder container={service.pluginsContainer} configurationWizard={configurationWizard} state={service.state} />
                  </Group>
                  <Placeholder container={service.configurationContainer} configurationWizard={configurationWizard} state={service.state} />
                  <ServerConfigurationSecurityForm serverConfig={service.state.serverConfig} />
                  <ServerConfigurationDriversForm serverConfig={service.state.serverConfig} />
                </Container>
              </Form>
            </Loader>
          )}
        </Loader>
      </Container>
    </ColoredContainer>
  );
});
