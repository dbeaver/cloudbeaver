/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import { isNotNullDefined } from '@cloudbeaver/core-utils';

import { AdministrationItemService, filterHiddenAdministrationItem } from '../../AdministrationItem/AdministrationItemService';
import { filterConfigurationWizard } from '../../AdministrationItem/filterConfigurationWizard';
import type { IAdministrationItem } from '../../AdministrationItem/IAdministrationItem';
import { orderAdministrationItems } from '../../AdministrationItem/orderAdministrationItems';
import { AdministrationScreenService } from '../AdministrationScreenService';

@injectable()
export class ConfigurationWizardService {
  get steps(): IAdministrationItem[] {
    return this.administrationItemService
      .getUniqueItems(true)
      .filter(item => filterConfigurationWizard(true)(item) && filterHiddenAdministrationItem(true)(item))
      .sort(orderAdministrationItems(true));
  }

  get stepsToFinish(): IAdministrationItem[] {
    return this.steps.filter(step => step.configurationWizardOptions?.isDone);
  }

  get currentStepIndex(): number {
    if (!this.currentStep) {
      return 0;
    }

    return this.steps.indexOf(this.currentStep) || 0;
  }

  get canFinish(): boolean {
    return this.steps.every(step => {
      if (step.configurationWizardOptions?.isDone && !step.configurationWizardOptions?.isDone()) {
        return false;
      }

      return true;
    });
  }

  get nextStep(): IAdministrationItem | undefined {
    return this.steps.find((item, index) => {
      if (index <= this.currentStepIndex) {
        return false;
      }

      if (this.isStepDisabled(item)) {
        return false;
      }

      return true;
    });
  }

  get currentStep(): IAdministrationItem | undefined {
    return this.steps.find(step => step.name === this.administrationScreenService.activeScreen?.item);
  }

  constructor(
    private administrationItemService: AdministrationItemService,
    private administrationScreenService: AdministrationScreenService,
    private notificationService: NotificationService,
    private screenService: ScreenService,
    private serverConfigResource: ServerConfigResource,
  ) {
    makeObservable(this, {
      steps: computed,
      stepsToFinish: computed,
      currentStepIndex: computed,
      canFinish: computed,
      nextStep: computed,
      currentStep: computed,
    });

    this.screenService.routeChange.addHandler(this.onRouteChange.bind(this));
  }

  private async onRouteChange() {
    await this.serverConfigResource.load();

    const isExistingPage =
      isNotNullDefined(this.administrationScreenService?.activeScreen?.item) &&
      this.isStepAvailable(this.administrationScreenService.activeScreen.item);
    const isCurrentStepAvailable = isNotNullDefined(this.currentStep) && this.isStepAvailable(this.currentStep.name);

    if (!this.serverConfigResource.data?.configurationMode) {
      return;
    }

    if (!isExistingPage || !isCurrentStepAvailable) {
      this.administrationScreenService.navigateToRoot();
    }
  }

  private isStepDone(step: IAdministrationItem): boolean {
    return step.configurationWizardOptions?.isDone ? step.configurationWizardOptions.isDone() : true;
  }

  private isStepDisabled(step: IAdministrationItem): boolean {
    return step.configurationWizardOptions?.isDisabled ? step.configurationWizardOptions.isDisabled() : false;
  }

  isStepAvailable(name: string): boolean {
    const stepIndex = this.steps.findIndex(step => step.name === name);

    if (stepIndex === -1) {
      return false;
    }

    for (let i = 0; i < stepIndex; i++) {
      const prevStep = this.steps[i];

      if (!this.isStepDone(prevStep) || this.isStepDisabled(prevStep)) {
        return false;
      }
    }

    return !this.isStepDisabled(this.steps[stepIndex]);
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

    if (step.configurationWizardOptions?.isDone) {
      const isDone = step.configurationWizardOptions.isDone();
      if (!isDone) {
        return false;
      }
    }

    return true;
  }

  async next(): Promise<void> {
    if (!this.currentStep) {
      return;
    }

    if (!(await this.finishStep(this.currentStep.name))) {
      return;
    }

    if (this.currentStepIndex + 1 < this.steps.length) {
      if (this.nextStep) {
        this.administrationScreenService.navigateTo(this.nextStep.name, this.nextStep.configurationWizardOptions?.defaultRoute);
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
    return this.administrationItemService.getUniqueItems(true).find(step => filterConfigurationWizard(true)(step) && step.name === name);
  }

  private async finish() {
    for (const step of this.steps) {
      if (step?.configurationWizardOptions?.onConfigurationFinish) {
        await step.configurationWizardOptions.onConfigurationFinish();
      }
    }

    this.administrationScreenService.clearItemsState();
    this.administrationScreenService.navigateToRoot();
    this.notificationService.logSuccess({
      title: 'administration_configuration_wizard_finish_success_title',
      message: 'administration_configuration_wizard_finish_success_message',
    });
  }
}
