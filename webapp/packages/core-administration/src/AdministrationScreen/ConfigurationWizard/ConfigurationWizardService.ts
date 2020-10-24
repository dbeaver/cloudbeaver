/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';

import { AdministrationItemService } from '../../AdministrationItem/AdministrationItemService';
import { filterConfigurationWizard } from '../../AdministrationItem/filterConfigurationWizard';
import { IAdministrationItem } from '../../AdministrationItem/IAdministrationItem';
import { orderAdministrationItems } from '../../AdministrationItem/orderAdministrationItems';
import { AdministrationScreenService } from '../AdministrationScreenService';

@injectable()
export class ConfigurationWizardService {
  @computed get steps(): IAdministrationItem[] {
    return this.administrationItemService.items
      .filter(filterConfigurationWizard(true))
      .sort(orderAdministrationItems(true));
  }

  @computed get stepsToFinish(): IAdministrationItem[] {
    return this.steps.filter(step => step.configurationWizardOptions?.isDone);
  }

  @computed get finishedSteps(): IAdministrationItem[] {
    return this.steps.filter(step => (
      step.configurationWizardOptions?.isDone && step.configurationWizardOptions.isDone()
    ));
  }

  @computed get currentStepIndex(): number {
    if (!this.currentStep) {
      return 0;
    }

    return this.steps.indexOf(this.currentStep) || 0;
  }

  @computed get canFinish(): boolean {
    return this.steps.every(step => {
      if (step.configurationWizardOptions?.isDone
          && !step.configurationWizardOptions?.isDone()) {
        return false;
      }

      return true;
    });
  }

  @computed get nextStep(): IAdministrationItem | undefined {
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

  @computed get currentStep(): IAdministrationItem | undefined {
    return this.steps.find(step => step.name === this.administrationScreenService.activeScreen?.item);
  }

  constructor(
    private administrationItemService: AdministrationItemService,
    private administrationScreenService: AdministrationScreenService,
    private screenService: ScreenService,
    private serverConfigResource: ServerConfigResource
  ) { }

  isStepAvailable(name: string): boolean {
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

  async finishStep(name: string): Promise<boolean> {
    const step = this.getStep(name);

    if (!step) {
      return false;
    }

    if (step.configurationWizardOptions?.onFinish) {
      const isValid = await step.configurationWizardOptions.onFinish();
      if (!isValid) {
        return false;
      }
    }
    return true;
  }

  async next(): Promise<void> {
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

  back(): void {
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

    this.administrationScreenService.clearItemsState();
    this.screenService.navigateToRoot();
  }
}
