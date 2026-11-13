/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { AdministrationItemService, filterHiddenAdministrationItem } from '../../AdministrationItem/AdministrationItemService.js';
import { filterConfigurationWizard } from '../../AdministrationItem/filterConfigurationWizard.js';
import type { IAdministrationItem } from '../../AdministrationItem/IAdministrationItem.js';
import { orderAdministrationItems } from '../../AdministrationItem/orderAdministrationItems.js';
import { AdministrationScreenService } from '../AdministrationScreenService.js';

export class ConfigurationWizardServiceImpl {
  get steps(): IAdministrationItem[] {
    return this.administrationItemService
      .getUniqueItems(true)
      .filter(item => filterConfigurationWizard(true)(item) && filterHiddenAdministrationItem(true)(item))
      .sort(orderAdministrationItems(true));
  }

  get stepsToFinish(): IAdministrationItem[] {
    return this.steps.filter(step => step.configurationWizardOptions?.isDone);
  }

  get finishedSteps(): IAdministrationItem[] {
    return this.steps.filter(step => step.configurationWizardOptions?.isDone && step.configurationWizardOptions.isDone());
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

      if (item.configurationWizardOptions?.isDisabled && item.configurationWizardOptions.isDisabled()) {
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
  ) {
    makeObservable(this, {
      steps: computed,
      stepsToFinish: computed,
      finishedSteps: computed,
      currentStepIndex: computed,
      canFinish: computed,
      nextStep: computed,
      currentStep: computed,
    });
  }

  isStepAvailable(name: string): boolean {
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
      const step = this.steps[this.currentStepIndex - 1]!;
      this.administrationScreenService.navigateTo(step.name, step.configurationWizardOptions?.defaultRoute);
    }
  }

  private getStep(name: string) {
    return this.administrationItemService.getUniqueItems(true).find(step => filterConfigurationWizard(true)(step) && step.name === name);
  }

  private async finish() {
    try {
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
    } catch (exception: any) {
      this.notificationService.logException(exception, 'core_administration_configuration_wizard_finish_fail_title');
    }
  }
}

export type ConfigurationWizardService = ConfigurationWizardServiceImpl;

export class ConfigurationWizardServiceDI extends Context.Service<ConfigurationWizardServiceDI, ConfigurationWizardServiceImpl>()(
  '@cloudbeaver/core-administration/AdministrationScreen/ConfigurationWizard/ConfigurationWizardService#ConfigurationWizardService',
) {
  static readonly implementation = ConfigurationWizardServiceImpl;

  static readonly dependencies = () => [AdministrationItemService, AdministrationScreenService, NotificationService] as const;
  static readonly make: Effect.Effect<
    ConfigurationWizardServiceImpl,
    never,
    | Context.Service.Identifier<typeof AdministrationItemService>
    | Context.Service.Identifier<typeof AdministrationScreenService>
    | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeConfigurationWizardService() {
    const administrationItemService = yield* AdministrationItemService;
    const administrationScreenService = yield* AdministrationScreenService;
    const notificationService = yield* NotificationService;

    return new ConfigurationWizardServiceImpl(administrationItemService, administrationScreenService, notificationService);
  });
  static readonly layer: Layer.Layer<
    ConfigurationWizardServiceDI,
    never,
    | Context.Service.Identifier<typeof AdministrationItemService>
    | Context.Service.Identifier<typeof AdministrationScreenService>
    | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConfigurationWizardService = ConfigurationWizardServiceDI;
