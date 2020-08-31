/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { SessionResource, ServerConfigResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';

import { AdministrationItemService } from '../../AdministrationItem/AdministrationItemService';
import { filterConfigurationWizard } from '../../AdministrationItem/filterConfigurationWizard';
import { orderAdministrationItems } from '../../AdministrationItem/orderAdministrationItems';
import { AdministrationScreenService } from '../AdministrationScreenService';

const CONFIGURATION_WIZARD_BASE_KEY = 'configuration_wizard_state';

export interface IConfigurationWizardState {
  finishedSteps: string[];
}

@injectable()
export class ConfigurationWizardService {
  @observable state: IConfigurationWizardState

  @computed get steps() {
    return this.administrationItemService.items
      .filter(filterConfigurationWizard(true))
      .sort(orderAdministrationItems);
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

  @computed get canNext() {
    if (this.currentStep?.configurationWizardOptions?.isDone
        && !this.currentStep?.configurationWizardOptions?.isDone()) {
      return false;
    }

    return true;
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
    private autoSaveService: LocalStorageSaveService,
    private screenService: ScreenService,
    private sessionResource: SessionResource,
    private serverConfigResource: ServerConfigResource
  ) {
    this.state = {
      finishedSteps: [],
    };

    this.autoSaveService.withAutoSave(this.state, CONFIGURATION_WIZARD_BASE_KEY);
  }

  isStepAvailable(name: string) {
    if (this.currentStep?.name === name || this.state.finishedSteps.includes(name)) {
      return true;
    }

    for (const step of this.steps) {
      if (step.name === name) {
        return true;
      }

      if (step.configurationWizardOptions?.isDone
          && !step.configurationWizardOptions?.isDone()) {
        return false;
      }
    }

    return false;
  }

  async finishStep(name: string) {
    const step = this.getStep(name);

    if (!step) {
      return;
    }

    if (step.configurationWizardOptions?.onFinish) {
      await step.configurationWizardOptions.onFinish();
    }

    if (this.state.finishedSteps.includes(name)) {
      return;
    }

    this.state.finishedSteps.push(name);
  }

  next() {
    if (!this.currentStep || !this.canNext) {
      return;
    }

    this.finishStep(this.currentStep.name);

    if (this.currentStepIndex + 1 < this.steps.length) {
      if (this.nextStep) {
        this.administrationScreenService.navigateToItem(this.nextStep.name);
      }
    } else {
      this.finish();
    }
  }

  back() {
    if (!this.currentStep) {
      return;
    }

    if (this.currentStepIndex - 1 >= 0) {
      this.administrationScreenService.navigateToItem(this.steps[this.currentStepIndex - 1].name);
    }
  }

  private getStep(name: string) {
    return this.administrationItemService.items
      .find(step => filterConfigurationWizard(true)(step) && step.name === name);
  }

  private async finish() {
    for (const name of this.state.finishedSteps) {
      const step = this.getStep(name);

      if (step?.configurationWizardOptions?.onConfigurationFinish) {
        await step.configurationWizardOptions.onConfigurationFinish();
      }
    }
    await this.serverConfigResource.update();
    await this.sessionResource.update();
    this.administrationScreenService.clearItemsState();
    this.state.finishedSteps = [];
    this.administrationScreenService.configurationWizard = false;
    this.screenService.navigateToRoot();
  }
}
