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
  public logoSrc = '/icons/christmas_logo.svg';
  public iconSrc = '/icons/christmas_action.svg';
  public startDate = new Date(new Date().getFullYear(), 11, 12); // Since December, 12, 00:00:00
  public endDate = new Date(new Date().getFullYear(), 0, 8); // Before January, 7 23:59:59

  constructor(private readonly holidayService: HolidaysService) {
    super();
    this.christmas = new Christmas();
  }

  override register(): void {
    this.holidayService.addHoliday(this);
  }

  get isEffectsActive() {
    return this.christmas.isSnowFalling;
  }

  get isOngoingHoliday() {
    const now = new Date();

    return now >= this.startDate || now <= this.endDate;
  }

  startEffects(): void {
    this.christmas.start();
  }

  stopEffects(): void {
    this.christmas.stop();
  }
}
