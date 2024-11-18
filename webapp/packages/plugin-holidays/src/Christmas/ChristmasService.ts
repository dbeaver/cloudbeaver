/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { HolidaysService } from '../HolidaysService.js';
import type { IHoliday } from '../IHoliday.js';
import { Christmas } from './Christmas.js';

@injectable()
export class ChristmasService extends Bootstrap implements IHoliday {
  private readonly christmas: Christmas;
  public name = 'Merry Christmas';
  public logoSrc = '/icons/logo-christmas.svg';
  public iconSrc = '/icons/christmas-action.svg';
  public startDate = new Date(new Date().getFullYear(), 9, 1);
  public endDate = new Date(new Date().getFullYear(), 0, 7);

  constructor(private readonly holidayService: HolidaysService) {
    super();
    this.christmas = new Christmas();
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
    console.log(this.christmas);
    this.christmas.start();
  }

  stopCelebration(): void {
    this.christmas.stop();
  }
}
