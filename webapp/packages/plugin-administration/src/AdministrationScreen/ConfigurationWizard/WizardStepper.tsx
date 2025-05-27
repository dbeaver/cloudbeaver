/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { Button, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import styles from './WizardStepper.module.css';

export const WizardStepper = observer(function WizardStepper() {
  const service = useService(ConfigurationWizardService);
  const translate = useTranslate();
  const style = useS(styles);

  return (
    <div className={s(style, { wizardStepper: true })}>
      <div className={s(style, { actions: true })}>
        <Button type="button" variant="secondary" disabled={service.currentStepIndex === 0} onClick={() => service.back()}>
          {translate('ui_stepper_back')}
        </Button>
        <Button type="button" onClick={() => service.next()}>
          {translate(service.currentStepIndex === service.steps.length - 1 ? 'ui_stepper_finish' : 'ui_stepper_next')}
        </Button>
      </div>
      <div className={s(style, { wizardText: true })}>{translate(service.currentStep?.configurationWizardOptions?.description || '')}</div>
    </div>
  );
});
