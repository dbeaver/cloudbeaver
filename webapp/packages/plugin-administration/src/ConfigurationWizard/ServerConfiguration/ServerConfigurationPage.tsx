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
  AdministrationPageNavigation,
  AdministrationPageTitle,
  AdministrationTabList,
  type AdministrationItemContentComponent,
  ConfigurationWizardService,
} from '@cloudbeaver/core-administration';
import { Button, ConfirmationDialog, Form, Loader, useAutoLoad, useFocus, useForm, useFormValidator, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';
import { getFirstException } from '@cloudbeaver/core-utils';
import { TabPanelList, TabsState } from '@cloudbeaver/core-ui';

import { getServerConfigurationFormPart } from './getServerConfigurationFormPart.js';
import { ServerConfigurationFormService } from './ServerConfigurationFormService.js';
import { ServerConfigurationFormStateManager } from './ServerConfigurationFormStateManager.js';
import { ServerConfigurationService } from './ServerConfigurationService.js';

export const ServerConfigurationPage: AdministrationItemContentComponent = observer(function ServerConfigurationPage({ configurationWizard }) {
  const translate = useTranslate();
  const [focusedRef, ref] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const serverConfigurationService = useService(ServerConfigurationService);
  const serverConfigurationFormService = useService(ServerConfigurationFormService);
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
      <Form ref={focusedRef} context={form} name="server_config" contents onChange={handleChange}>
        <TabsState container={serverConfigurationFormService.parts} formState={formState} configurationWizard={configurationWizard}>
          <AdministrationPageNavigation>
            <AdministrationTabList aria-label={translate('administration_configuration_wizard_configuration')} />
          </AdministrationPageNavigation>
          <AdministrationPageContent>
            {configurationWizard && (
              <div className="tw:shrink-0">
                <h3 className="tw:text-xl tw:font-semibold">{translate('administration_configuration_wizard_configuration_title')}</h3>
                <p className="tw:mt-4 tw:mb-0 tw:whitespace-pre-wrap tw:leading-loose">
                  {translate('administration_configuration_wizard_configuration_message')}
                </p>
              </div>
            )}
            <TabPanelList contents />
          </AdministrationPageContent>
        </TabsState>
      </Form>
    </AdministrationPageLayout>
  );
});
