/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AuthProvidersResource, PasswordPolicyService } from '@cloudbeaver/core-authentication';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { DefaultNavigatorSettingsResource, PasswordPolicyResource, ProductInfoResource, ServerConfigResource } from '@cloudbeaver/core-root';
import type { IFormState } from '@cloudbeaver/core-ui';

import { ServerConfigurationFormPart } from './ServerConfigurationFormPart.js';

const DATA_CONTEXT_SERVER_CONFIGURATION_FORM_PART = createDataContext<ServerConfigurationFormPart>('Server Configuration form Part');

export function getServerConfigurationFormPart(formState: IFormState<null>): ServerConfigurationFormPart {
  return formState.getPart(DATA_CONTEXT_SERVER_CONFIGURATION_FORM_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const administrationScreenService = di.getService(AdministrationScreenService);
    const serverConfigResource = di.getService(ServerConfigResource);
    const defaultNavigatorSettingsResource = di.getService(DefaultNavigatorSettingsResource);
    const productInfoResource = di.getService(ProductInfoResource);
    const authProvidersResource = di.getService(AuthProvidersResource);
    const passwordPolicyResource = di.getService(PasswordPolicyResource);
    const passwordPolicyService = di.getService(PasswordPolicyService);

    return new ServerConfigurationFormPart(
      formState,
      administrationScreenService,
      serverConfigResource,
      productInfoResource,
      defaultNavigatorSettingsResource,
      authProvidersResource,
      passwordPolicyResource,
      passwordPolicyService,
    );
  });
}
