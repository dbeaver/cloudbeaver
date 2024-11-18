/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export interface IHoliday {
  startDate: Date;
  endDate: Date;
  isHoliday: boolean;
  name: string;
  logoSrc: string;
  iconSrc: string;
  activeIconSrc?: string;
  isCelebrating: boolean;
  startCelebration(): void;
  stopCelebration(): void;
}
