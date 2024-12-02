/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IResourceOffsetPage {
  from: number;
  to: number;
  items: any[];
  outdated: boolean;

  get(from: number, to: number): any[];

  isOutdated(): boolean;
  isHasCommonSegment(range: IResourceOffsetPage): boolean;
  isHasCommonSegment(from: number, to: number): boolean;
  isInRange(from: number, to: number): boolean;

  setSize(from: number, to: number): this;

  setOutdated(outdated: boolean): this;

  update(from: number, items: any[]): this;
}
