/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export class WebsiteLinks {
  static DATA_EDITOR_DOCUMENTATION_PAGE = 'https://dbeaver.com/docs/cloudbeaver/Data-editor/';
  static SQL_EDITOR_DOCUMENTATION_PAGE = 'https://dbeaver.com/docs/cloudbeaver/SQL-Editor/';
  static SERVER_CONFIGURATION_RESOURCE_QUOTAS_PAGE = 'https://dbeaver.com/docs/cloudbeaver/Server-configuration/#resource-quotas';
  static DATABASE_NAVIGATOR_DOCUMENTATION_PAGE = 'https://dbeaver.com/docs/cloudbeaver/Database-Navigator/';

  static ENTERPRISE_BUY_PRODUCT_PAGE = 'https://dbeaver.com/products/cloudbeaver-enterprise/';
  static TEAM_EDITION_BUY_PRODUCT_PAGE = 'https://dbeaver.com/products/team-edition/';
  static LATEST_COMMUNITY_VERSION_PAGE = 'https://dbeaver.com/product/cloudbeaver-ce-version.json';

  static TEAM_ARCHIVE = 'https://dbeaver.com/downloads-team';
  static CONTACT_PAGE = 'https://dbeaver.com/contact/';

  static GITHUB_REPOSITORY_PAGE = 'https://github.com/dbeaver/cloudbeaver';

  static getTeamArchiveById(id: string) {
    return `${WebsiteLinks.TEAM_ARCHIVE}/${id}`;
  }

  static getProductBuyPage(distributed: boolean) {
    if (distributed) {
      return WebsiteLinks.TEAM_EDITION_BUY_PRODUCT_PAGE;
    }

    return WebsiteLinks.ENTERPRISE_BUY_PRODUCT_PAGE;
  }
}
