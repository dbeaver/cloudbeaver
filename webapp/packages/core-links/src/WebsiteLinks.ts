/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
function extractDocsVersion(version: string | undefined): string | null {
  if (!version) {
    return null;
  }
  const parts = version.split('.');
  const major = parts[0];
  const minor = parts[1];
  if (!major || !minor) {
    return null;
  }

  return `${major}.${minor}`;
}

export const WEBSITE_LINKS = {
  ROOT_PAGE: 'https://dbeaver.com/',
  DOCS_PAGE: 'https://dbeaver.com/docs/cloudbeaver/',
  TEAM_EDITION_DOCS_PAGE: 'https://dbeaver.com/docs/team-edition/',
  DATA_EDITOR_DOCUMENTATION_PAGE: 'https://dbeaver.com/docs/cloudbeaver/Data-editor/',
  SQL_EDITOR_DOCUMENTATION_PAGE: 'https://dbeaver.com/docs/cloudbeaver/SQL-Editor/',
  SSL_CONFIGURATION_DOCUMENTATION_PAGE: 'https://dbeaver.com/docs/cloudbeaver/SSL-Configuration/',
  SERVER_CONFIGURATION_RESOURCE_QUOTAS_PAGE: 'https://dbeaver.com/docs/cloudbeaver/Server-configuration/#resource-quotas',
  DATABASE_NAVIGATOR_DOCUMENTATION_PAGE: 'https://dbeaver.com/docs/cloudbeaver/Database-Navigator/',
  AWS_DEPLOY_UPDATE_PAGE: 'https://github.com/dbeaver/cloudbeaver-deploy?tab=readme-ov-file#updating-the-cluster',
  PROXY_CONFIGURATION_DOCUMENTATION_PAGE: 'https://dbeaver.com/docs/cloudbeaver/Proxy-Configuration/',

  ENTERPRISE_BUY_PRODUCT_PAGE: 'https://dbeaver.com/products/cloudbeaver-enterprise/',
  TEAM_EDITION_BUY_PRODUCT_PAGE: 'https://dbeaver.com/products/team-edition/',
  LATEST_COMMUNITY_VERSION_PAGE: 'https://dbeaver.com/product/cloudbeaver-ce-version.json',
  TEAM_ARCHIVE: 'https://dbeaver.com/downloads-team',
  CONTACT_PAGE: 'https://dbeaver.com/contact/',
  TECH_SUPPORT_PAGE: 'https://dbeaver.com/tickets/',

  getTeamArchiveById(id: string): string {
    return `${WEBSITE_LINKS.TEAM_ARCHIVE}/${id}`;
  },

  getProductBuyPage(distributed: boolean): string {
    if (distributed) {
      return WEBSITE_LINKS.TEAM_EDITION_BUY_PRODUCT_PAGE;
    }

    return WEBSITE_LINKS.ENTERPRISE_BUY_PRODUCT_PAGE;
  },

  getDocumentationPage(distributed: boolean, version: string | undefined): string {
    let url = distributed ? WEBSITE_LINKS.TEAM_EDITION_DOCS_PAGE : WEBSITE_LINKS.DOCS_PAGE;

    const majorMinor = extractDocsVersion(version);
    if (majorMinor) {
      url += `${majorMinor}/`;
    }

    return url;
  },
};
