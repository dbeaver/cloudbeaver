/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { SessionResource, ServerConfigResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';

import { AdministrationItemService } from '../../AdministrationItem/AdministrationItemService';
import { filterConfigurationWizard } from '../../AdministrationItem/filterConfigurationWizard';
import { orderAdministrationItems } from '../../AdministrationItem/orderAdministrationItems';
import { AdministrationScreenService } from '../AdministrationScreenService';

@injectable()
export class ConfigurationWizardService {

  @computed get steps() {
    return this.administrationItemService.items
      .filter(filterConfigurationWizard(true))
      .sort(orderAdministrationItems);
  }

  @computed get stepsToFinish() {
    return this.steps.filter(step => step.configurationWizardOptions?.isDone);
  }

  @computed get finishedSteps() {
    return this.steps.filter(step => (
      step.configurationWizardOptions?.isDone && step.configurationWizardOptions.isDone()
    ));
  }

  @computed get currentStepIndex() {
    if (!this.currentStep) {
      return 0;
    }

    return this.steps.indexOf(this.currentStep) || 0;
  }

  @computed get canFinish() {
    return this.steps.every((step) => {
      if (step.configurationWizardOptions?.isDone
          && !step.configurationWizardOptions?.isDone()) {
        return false;
      }

      return true;
    });
  }

  @computed get nextStep() {
    return this.steps.find((item, index) => {
      if (index <= this.currentStepIndex) {
        return false;
      }

      if (item.configurationWizardOptions?.isDisabled && item.configurationWizardOptions.isDisabled()) {
        return false;
      }

      return true;
    });
  }

  @computed get currentStep() {
    return this.steps.find(step => step.name === this.administrationScreenService.activeItem);
  }

  constructor(
    private administrationItemService: AdministrationItemService,
    private administrationScreenService: AdministrationScreenService,
    private screenService: ScreenService,
    private sessionResource: SessionResource,
    private serverConfigResource: ServerConfigResource
  ) { }

  isStepAvailable(name: string) {
    if (this.currentStep?.name === name) {
      return true;
    }

    for (const step of this.steps) {
      if (step.name === name) {
        return true;
      }

      if (this.stepsToFinish.includes(step) && !this.finishedSteps.includes(step)) {
        return false;
      }
    }

    return false;
  }

  async finishStep(name: string) {
    const step = this.getStep(name);

    if (!step) {
      return false;
    }

    if (step.configurationWizardOptions?.onValidate) {
      const isValid = await step.configurationWizardOptions.onValidate();
      if (!isValid) {
        return false;
      }
    }

    if (step.configurationWizardOptions?.onFinish) {
      await step.configurationWizardOptions.onFinish();
    }
    return true;
  }

  async next() {
    if (!this.currentStep) {
      return;
    }

    if (!await this.finishStep(this.currentStep.name)) {
      return;
    }

    if (this.currentStepIndex + 1 < this.steps.length) {
      if (this.nextStep) {
        this.administrationScreenService.navigateTo(
          this.nextStep.name,
          this.nextStep.configurationWizardOptions?.defaultRoute
        );
      }
    } else {
      await this.finish();
    }
  }

  back() {
    if (!this.currentStep) {
      return;
    }

    if (this.currentStepIndex - 1 >= 0) {
      const step = this.steps[this.currentStepIndex - 1];
      this.administrationScreenService.navigateTo(step.name, step.configurationWizardOptions?.defaultRoute);
    }
  }

  private getStep(name: string) {
    return this.administrationItemService.items
      .find(step => filterConfigurationWizard(true)(step) && step.name === name);
  }

  private async finish() {
    for (const step of this.steps) {

      if (step?.configurationWizardOptions?.onConfigurationFinish) {
        await step.configurationWizardOptions.onConfigurationFinish();
      }
    }

    await this.serverConfigResource.update();
    await this.sessionResource.update();
    this.administrationScreenService.clearItemsState();
    this.screenService.navigateToRoot();
  }
}
