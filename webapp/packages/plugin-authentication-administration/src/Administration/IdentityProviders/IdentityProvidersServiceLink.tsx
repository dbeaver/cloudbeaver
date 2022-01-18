/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ServiceDescriptionComponent } from '@cloudbeaver/core-authentication';
import { Link } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { Translate } from '@cloudbeaver/core-localization';

import { AuthConfigurationsAdministrationNavService } from './AuthConfigurationsAdministrationNavService';

export const IdentityProvidersServiceLink: ServiceDescriptionComponent = function IdentityProvidersServiceLink({
  configurationWizard,
}) {
  const authConfigurationsAdministrationNavService = useService(AuthConfigurationsAdministrationNavService);

  if (configurationWizard) {
    return null;
  }

  return (
    <Link onClick={() => authConfigurationsAdministrationNavService.navToRoot()}>
      <Translate token="administration_identity_providers_service_link" />
    </Link>
  );
};
