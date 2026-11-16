/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { TopNavService } from '@cloudbeaver/plugin-top-app-bar';

import { HolidayActionButtonLazy } from './HolidayActionButtonLazy.js';
import type { IHoliday } from './IHoliday.js';

export class HolidaysServiceImpl extends Bootstrap {
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

export type HolidaysService = HolidaysServiceImpl;

export class HolidaysServiceDI extends Context.Service<HolidaysServiceDI, HolidaysServiceImpl>()(
  '@cloudbeaver/plugin-holidays/HolidaysService#HolidaysService',
) {
  static readonly implementation = HolidaysServiceImpl;

  static readonly dependencies = () => [TopNavService] as const;
  static readonly make: Effect.Effect<HolidaysServiceImpl, never, Context.Service.Identifier<typeof TopNavService>> = Effect.gen(
    function* makeHolidaysService() {
      const topNavService = yield* TopNavService;

      return new HolidaysServiceImpl(topNavService);
    },
  );
  static readonly layer: Layer.Layer<HolidaysServiceDI, never, Context.Service.Identifier<typeof TopNavService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const HolidaysService = HolidaysServiceDI;
