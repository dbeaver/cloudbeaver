/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s, Translate, useS } from '@cloudbeaver/core-blocks';

import styles from './ConfigurationWizardTitle.module.css';

export function ConfigurationWizardTitle() {
  const style = useS(styles);
  return (
    <div className={s(style, { wizardTitle: true })}>
      <Translate token="administration_configuration_wizard_title" />
    </div>
  );
}
