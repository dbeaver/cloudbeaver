/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IInitializableController, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';

import { ILogEntry } from '../ILogEntry';
import { LogEntryDetailsDialog } from './LogEntryDetailsDialog';

@injectable()
export class LogEntryController implements IInitializableController {

  get hasDetails() {
    return Boolean(this.item.stackTrace);
  }

  showDetails = () => this.commonDialogService.open(LogEntryDetailsDialog, this.item);

  private item!: ILogEntry;

  constructor(private commonDialogService: CommonDialogService) {
  }

  init(item: ILogEntry) {
    this.item = item;
  }

}
