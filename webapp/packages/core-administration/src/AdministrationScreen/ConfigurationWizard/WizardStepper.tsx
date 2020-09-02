/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConfigurationWizardService } from './ConfigurationWizardService';

const styles = composes(
  css`
    wizard-stepper {
      composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
    }
    actions, wizard-step {
      composes: theme-border-color-background from global;
    }
  `,
  css`
    wizard-stepper {
      position: sticky;
      top: 0;
      height: 48px;
      display: flex;
      padding: 0 16px;
      align-items: center;
      border-bottom: solid 2px;
      z-index: 1;
      flex-shrink: 0;
    }

    actions, wizard-step {
      border-right: solid 1px;
    }

    actions {
      & Button {
        margin-right: 16px;
      }
    }

    actions, wizard-text, wizard-step {
      display: flex;
      align-items: center;
      height: 28px;
    }

    wizard-text, wizard-step {
      padding: 0 16px;
    }
  `
);

export const WizardStepper = observer(function WizardStepper() {
  const service = useService(ConfigurationWizardService);
  const translate = useTranslate();

  return styled(useStyles(styles))(
    <wizard-stepper as='div'>
      <actions as='div'>
        <Button
          type="button"
          mod={['outlined']}
          onClick={() => service.back()}
          disabled={service.currentStepIndex === 0}
        >
          {translate('ui_stepper_back')}
        </Button>
        <Button
          type="button"
          mod={['unelevated']}
          onClick={() => service.next()}
        >
          {translate(service.currentStepIndex === service.steps.length - 1 ? 'ui_stepper_finish' : 'ui_stepper_next')}
        </Button>
      </actions>
      {service.stepsToFinish.length > 1 && <wizard-step as='div'>{service.finishedSteps.length} / {service.stepsToFinish.length}</wizard-step>}
      <wizard-text as='div'>{translate(service.currentStep?.configurationWizardOptions?.description || '')}</wizard-text>
    </wizard-stepper>
  );
});
