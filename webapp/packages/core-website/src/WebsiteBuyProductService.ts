/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';

@injectable()
export class WebsiteBuyProductService {
  constructor(private readonly serverConfigResource: ServerConfigResource) {}

  get enterpriseProductPage() {
    return 'https://dbeaver.com/products/cloudbeaver-enterprise/ ';
  }

  get teamEditionProductPage() {
    return 'https://dbeaver.com/products/team-edition/';
  }

  getCurrentProductBuyPage() {
    if (this.serverConfigResource.distributed) {
      return this.teamEditionProductPage;
    }

    return this.enterpriseProductPage;
  }
}
