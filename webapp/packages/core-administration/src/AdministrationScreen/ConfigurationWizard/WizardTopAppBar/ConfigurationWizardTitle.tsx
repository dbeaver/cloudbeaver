/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { Translate } from '@cloudbeaver/core-localization';

const styles = css`
  wizard-title {
    text-transform: uppercase;
    font-weight: 700;
  }
`;

export function ConfigurationWizardTitle() {
  return styled(styles)(
    <wizard-title as='div'><Translate token='administration_configuration_wizard_title' /></wizard-title>
  );
}
