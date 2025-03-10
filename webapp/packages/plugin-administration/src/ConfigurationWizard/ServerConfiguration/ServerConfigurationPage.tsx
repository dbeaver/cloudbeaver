/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
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
  Placeholder,
  s,
  ToolsAction,
  ToolsPanel,
  useAutoLoad,
  useFocus,
  useForm,
  useFormValidator,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { getFirstException } from '@cloudbeaver/core-utils';

import { ServerConfigurationConfigurationForm } from './Form/ServerConfigurationConfigurationForm.js';
import { ServerConfigurationFeaturesForm } from './Form/ServerConfigurationFeaturesForm.js';
import { ServerConfigurationInfoForm } from './Form/ServerConfigurationInfoForm.js';
import { ServerConfigurationNavigatorViewForm } from './Form/ServerConfigurationNavigatorViewForm.js';
import { ServerConfigurationSecurityForm } from './Form/ServerConfigurationSecurityForm.js';
import { getServerConfigurationFormPart } from './getServerConfigurationFormPart.js';
import { ServerConfigurationDriversForm } from './ServerConfigurationDriversForm.js';
import { ServerConfigurationFormStateManager } from './ServerConfigurationFormStateManager.js';
import style from './ServerConfigurationPage.module.css';
import { ServerConfigurationService } from './ServerConfigurationService.js';

export const ServerConfigurationPage: AdministrationItemContentComponent = observer(function ServerConfigurationPage({ configurationWizard }) {
  const translate = useTranslate();
  const styles = useS(style);
  const [focusedRef, ref] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const serverConfigurationService = useService(ServerConfigurationService);
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const serverConfigurationFormStateManager = useService(ServerConfigurationFormStateManager);
  const configurationWizardService = useService(ConfigurationWizardService);

  const formState = serverConfigurationFormStateManager.formState!;
  const part = getServerConfigurationFormPart(formState);

  useAutoLoad(ServerConfigurationPage, [part]);
  useFormValidator(formState.validationTask, ref.reference);

  function handleChange() {
    if (configurationWizard) {
      serverConfigurationService.setDone(false);
    }

    if (!part.state.serverConfig.adminCredentialsSaveEnabled) {
      part.state.serverConfig.publicCredentialsSaveEnabled = false;
    }
  }

  const changed = part.isChanged;

  async function save() {
    if (configurationWizard) {
      configurationWizardService.next();
      return;
    }

    if (changed) {
      const result = await commonDialogService.open(ConfirmationDialog, {
        title: 'administration_server_configuration_save_confirmation_title',
        message: 'administration_server_configuration_save_confirmation_message',
      });

      if (result === DialogueStateResult.Rejected) {
        return;
      }
    }

    const saved = await formState.save();

    if (!saved) {
      const error = getFirstException(part.exception);
      if (error) {
        notificationService.logException(error, 'administration_configuration_wizard_configuration_save_error');
        return;
      }

      notificationService.logError({ title: 'administration_configuration_wizard_configuration_save_error' });
    }
  }

  const form = useForm({
    onSubmit: save,
  });

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
              onClick={() => form.submit()}
            >
              {translate('ui_processing_save')}
            </ToolsAction>
            <ToolsAction
              title={translate('administration_configuration_tools_cancel_tooltip')}
              icon="admin-cancel"
              viewBox="0 0 24 24"
              disabled={!changed}
              onClick={() => formState.reset()}
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
              <h3 className="tw:text-xl tw:font-semibold">{translate('administration_configuration_wizard_configuration_title')}</h3>
            </GroupItem>
            <GroupItem>
              <p className={s(styles, { message: true })}>{translate('administration_configuration_wizard_configuration_message')}</p>
            </GroupItem>
          </Group>
        )}
        <Form ref={focusedRef} context={form} name="server_config" contents onChange={handleChange}>
          <Container wrap gap grid medium>
            <ServerConfigurationInfoForm state={part.state} />
            <Group form gap>
              <GroupTitle>{translate('administration_configuration_wizard_configuration_plugins')}</GroupTitle>
              <ServerConfigurationConfigurationForm serverConfig={part.state.serverConfig} />
              <ServerConfigurationNavigatorViewForm configs={part.state} />
              <ServerConfigurationFeaturesForm state={part.state} configurationWizard={configurationWizard} />
              <Placeholder container={serverConfigurationService.pluginsContainer} configurationWizard={configurationWizard} state={part.state} />
            </Group>
            <Placeholder container={serverConfigurationService.configurationContainer} configurationWizard={configurationWizard} state={part.state} />
            <ServerConfigurationSecurityForm serverConfig={part.state.serverConfig} />
            <ServerConfigurationDriversForm initialServerConfig={part.initialState.serverConfig} serverConfig={part.state.serverConfig} />
          </Container>
        </Form>
      </Container>
    </ColoredContainer>
  );
});
