/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';

import type { IHoliday } from './IHoliday.js';

@injectable()
export class HolidaysService {
  private readonly holidays: IHoliday[] = [];

  constructor() {}

  celebrate() {
    this.holiday?.startCelebration();
  }

  stopCelebration() {
    this.holiday?.stopCelebration();
  }

  addHoliday(holiday: IHoliday) {
    this.holidays.push(holiday);
  }

  get holiday(): IHoliday | undefined {
    return this.holidays.find(holiday => holiday.isHoliday);
  }

  get isHoliday() {
    return !!this.holiday;
  }

  get isCelebrating() {
    return this.holiday?.isCelebrating;
  }
}
