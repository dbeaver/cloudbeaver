/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { TopNavService } from '@cloudbeaver/plugin-top-app-bar';

import { HolidayActionButtonLazy } from './HolidayActionButtonLazy.js';
import type { IHoliday } from './IHoliday.js';

@injectable()
export class HolidaysService extends Bootstrap {
  private readonly holidays: IHoliday[] = [];

  constructor(private readonly topNavService: TopNavService) {
    super();
  }

  override register() {
    this.topNavService.placeholder.add(HolidayActionButtonLazy, 4);
  }

  addHoliday(holiday: IHoliday) {
    if (this.holidays.find(h => h.name === holiday.name)) {
      throw new Error(`Holiday with name ${holiday.name} already exists`);
    }
    this.holidays.push(holiday);
  }

  get holiday(): IHoliday | undefined {
    return this.holidays.find(holiday => holiday.isOngoingHoliday);
  }
}
