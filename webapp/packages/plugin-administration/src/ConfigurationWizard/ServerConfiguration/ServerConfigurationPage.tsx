/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  AdministrationPageContent,
  AdministrationPageHeader,
  AdministrationPageLayout,
  AdministrationPageTitle,
  type AdministrationItemContentComponent,
  ConfigurationWizardService,
} from '@cloudbeaver/core-administration';
import {
  Button,
  ConfirmationDialog,
  Container,
  Form,
  Group,
  GroupTitle,
  Loader,
  Placeholder,
  useAutoLoad,
  useFocus,
  useForm,
  useFormValidator,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';
import { getFirstException } from '@cloudbeaver/core-utils';

import { ServerConfigurationConfigurationForm } from './Form/ServerConfigurationConfigurationForm.js';
import { ServerConfigurationFeaturesForm } from './Form/ServerConfigurationFeaturesForm.js';
import { ServerConfigurationInfoForm } from './Form/ServerConfigurationInfoForm.js';
import { ServerConfigurationNavigatorViewForm } from './Form/ServerConfigurationNavigatorViewForm.js';
import { ServerConfigurationSecurityForm } from './Form/ServerConfigurationSecurityForm.js';
import { getServerConfigurationFormPart } from './getServerConfigurationFormPart.js';
import { ServerConfigurationDriversForm } from './ServerConfigurationDriversForm.js';
import { ServerConfigurationFormStateManager } from './ServerConfigurationFormStateManager.js';
import { ServerConfigurationService } from './ServerConfigurationService.js';

export const ServerConfigurationPage: AdministrationItemContentComponent = observer(function ServerConfigurationPage({ configurationWizard }) {
  const translate = useTranslate();
  const [focusedRef, ref] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const serverConfigurationService = useService(ServerConfigurationService);
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const serverConfigurationFormStateManager = useService(ServerConfigurationFormStateManager);
  const configurationWizardService = useService(ConfigurationWizardService);

  const formState = serverConfigurationFormStateManager.formState;
  const part = formState ? getServerConfigurationFormPart(formState) : null;

  useAutoLoad(ServerConfigurationPage, part ?? []);
  useFormValidator(formState?.validationTask, ref.reference);

  function handleChange() {
    if (configurationWizard) {
      serverConfigurationService.setDone(false);
    }

    if (part && !part.state.serverConfig.adminCredentialsSaveEnabled) {
      part.state.serverConfig.publicCredentialsSaveEnabled = false;
    }
  }

  const changed = formState?.isChanged ?? false;

  async function save() {
    if (!formState || !part) {
      return;
    }

    if (configurationWizard) {
      configurationWizardService.next();
      return;
    }

    if (changed) {
      const { status } = await commonDialogService.open(ConfirmationDialog, {
        title: 'administration_server_configuration_save_confirmation_title',
        message: 'administration_server_configuration_save_confirmation_message',
      });

      if (status === DialogueStateResult.Rejected) {
        return;
      }
    }

    const saved = await serverConfigurationFormStateManager.save();

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

  if (!formState || !part) {
    return <Loader />;
  }

  return (
    <AdministrationPageLayout>
      <AdministrationPageHeader
        actionsSlot={
          !configurationWizard && (
            <>
              <Button
                type="button"
                variant="secondary"
                title={translate('administration_configuration_tools_cancel_tooltip')}
                disabled={!changed}
                onClick={() => formState.reset()}
              >
                {translate('ui_processing_cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                title={translate('administration_configuration_tools_save_tooltip')}
                disabled={!changed}
                onClick={() => form.submit()}
              >
                {translate('ui_processing_save')}
              </Button>
            </>
          )
        }
      >
        <AdministrationPageTitle docLink={WEBSITE_LINKS.SERVER_CONFIGURATION_DOCUMENTATION_PAGE}>
          {translate('administration_configuration_wizard_configuration')}
        </AdministrationPageTitle>
      </AdministrationPageHeader>
      <AdministrationPageContent>
        {configurationWizard && (
          <div className="tw:shrink-0 tw:max-w-prose">
            <h3 className="tw:text-xl tw:font-semibold">{translate('administration_configuration_wizard_configuration_title')}</h3>
            <p className="tw:my-4 tw:whitespace-pre-wrap tw:leading-loose">
              {translate('administration_configuration_wizard_configuration_message')}
            </p>
          </div>
        )}
        <Form ref={focusedRef} context={form} name="server_config" contents onChange={handleChange}>
          <Container wrap gap grid medium keepSize>
            <ServerConfigurationInfoForm state={part.state} formState={formState} configurationWizard={configurationWizard} />
            <Group form gap>
              <GroupTitle>{translate('administration_configuration_wizard_configuration_plugins')}</GroupTitle>
              <ServerConfigurationConfigurationForm serverConfig={part.state.serverConfig} />
              <ServerConfigurationNavigatorViewForm configs={part.state} />
              <ServerConfigurationFeaturesForm state={part.state} configurationWizard={configurationWizard} />
              <Placeholder container={serverConfigurationService.pluginsContainer} configurationWizard={configurationWizard} state={part.state} />
            </Group>
            <Placeholder container={serverConfigurationService.configurationContainer} configurationWizard={configurationWizard} state={part.state} />
            <ServerConfigurationSecurityForm configurationWizard={configurationWizard} state={part.state} />
            <ServerConfigurationDriversForm initialServerConfig={part.initialState.serverConfig} serverConfig={part.state.serverConfig} />
          </Container>
        </Form>
      </AdministrationPageContent>
    </AdministrationPageLayout>
  );
});
