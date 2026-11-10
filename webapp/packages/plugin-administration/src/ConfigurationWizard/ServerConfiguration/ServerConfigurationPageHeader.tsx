/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { AdministrationPageDescription, AdministrationPageTitle } from '@cloudbeaver/core-administration';
import { Alert, useTranslate } from '@cloudbeaver/core-blocks';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';

interface Props {
  configurationWizard: boolean;
}

export const ServerConfigurationPageHeader = observer<Props>(function ServerConfigurationPageHeader({ configurationWizard }) {
  const translate = useTranslate();

  if (!configurationWizard) {
    return (
      <AdministrationPageTitle docLink={WEBSITE_LINKS.SERVER_CONFIGURATION_DOCUMENTATION_PAGE}>
        {translate('administration_configuration_wizard_configuration')}
      </AdministrationPageTitle>
    );
  }

  return (
    <div className="tw:flex tw:flex-1 tw:min-w-0 tw:flex-col tw:gap-6">
      <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-2">
        <AdministrationPageTitle docLink={WEBSITE_LINKS.SERVER_CONFIGURATION_DOCUMENTATION_PAGE}>
          {translate('administration_configuration_wizard_configuration')}
        </AdministrationPageTitle>
        <AdministrationPageDescription>{translate('administration_configuration_wizard_configuration_description')}</AdministrationPageDescription>
      </div>
      <Alert
        variant="info"
        title={translate('administration_configuration_wizard_configuration_password_warning')}
        className="tw:w-full tw:lg:w-3/4"
      />
    </div>
  );
});
