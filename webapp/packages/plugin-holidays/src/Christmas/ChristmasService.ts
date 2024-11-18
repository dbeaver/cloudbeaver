/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import type { HolidaysService } from '../HolidaysService.js';
import type { IHoliday } from '../IHoliday.js';
import type { Christmas } from './Christmas.js';

@injectable()
export class ChristmasService extends Bootstrap implements IHoliday {
  public name = 'Christmas';
  public logoSrc = '/icons/logo_christmas.svg';
  public iconSrc = '/icons/icon_christmas_action.svg';
  public startDate = new Date(new Date().getFullYear(), 11, 1);
  public endDate = new Date(new Date().getFullYear(), 0, 7);

  constructor(
    private readonly holidayService: HolidaysService,
    private readonly christmas: Christmas,
  ) {
    super();
  }

  override register(): void {
    this.holidayService.addHoliday(this);
  }

  get isCelebrating() {
    return this.christmas.isSnowFalling;
  }

  get isHoliday() {
    const now = new Date();

    return now >= this.startDate || now <= this.endDate;
  }

  startCelebration(): void {
    this.christmas.start();
  }

  stopCelebration(): void {
    this.christmas.stop();
  }
}
