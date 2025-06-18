/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export const WEBSITE_LINKS = {
  ROOT_PAGE: 'https://dbeaver.com/',
  DOCS_PAGE: 'https://dbeaver.com/docs/cloudbeaver/',
  DATA_EDITOR_DOCUMENTATION_PAGE: 'https://dbeaver.com/docs/cloudbeaver/Data-editor/',
  SQL_EDITOR_DOCUMENTATION_PAGE: 'https://dbeaver.com/docs/cloudbeaver/SQL-Editor/',
  SERVER_CONFIGURATION_RESOURCE_QUOTAS_PAGE: 'https://dbeaver.com/docs/cloudbeaver/Server-configuration/#resource-quotas',
  DATABASE_NAVIGATOR_DOCUMENTATION_PAGE: 'https://dbeaver.com/docs/cloudbeaver/Database-Navigator/',
  AWS_DEPLOY_UPDATE_PAGE: 'https://github.com/dbeaver/cloudbeaver-deploy?tab=readme-ov-file#updating-the-cluster',

  ENTERPRISE_BUY_PRODUCT_PAGE: 'https://dbeaver.com/products/cloudbeaver-enterprise/',
  TEAM_EDITION_BUY_PRODUCT_PAGE: 'https://dbeaver.com/products/team-edition/',
  LATEST_COMMUNITY_VERSION_PAGE: 'https://dbeaver.com/product/cloudbeaver-ce-version.json',
  TEAM_ARCHIVE: 'https://dbeaver.com/downloads-team',
  CONTACT_PAGE: 'https://dbeaver.com/contact/',

  getTeamArchiveById(id: string) {
    return `${WEBSITE_LINKS.TEAM_ARCHIVE}/${id}`;
  },

  getProductBuyPage(distributed: boolean) {
    if (distributed) {
      return WEBSITE_LINKS.TEAM_EDITION_BUY_PRODUCT_PAGE;
    }

    return WEBSITE_LINKS.ENTERPRISE_BUY_PRODUCT_PAGE;
  },
};
