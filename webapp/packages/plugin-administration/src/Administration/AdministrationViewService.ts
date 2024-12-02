/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService, type IAdministrationItemRoute } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';
import { type IActiveView, View } from '@cloudbeaver/core-view';

@injectable()
export class AdministrationViewService extends View<IAdministrationItemRoute | null> {
  constructor(private readonly administrationScreenService: AdministrationScreenService) {
    super();
    this.getView = this.getView.bind(this);
  }

  getView(): IActiveView<IAdministrationItemRoute | null> | null {
    return {
      context: this.administrationScreenService.activeScreen,
      extensions: [],
    };
  }
}
