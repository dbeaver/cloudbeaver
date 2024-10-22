/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export class GithubLinks {
  static CLOUDBEAVER_REPO = 'https://github.com/dbeaver/cloudbeaver';

  static EE_DEPLOY_UPDATE = 'https://github.com/dbeaver/cloudbeaver-deploy?tab=readme-ov-file#updating-the-cluster';
  static TE_DEPLOY_UPDATE = 'https://github.com/dbeaver/team-edition-deploy?tab=readme-ov-file#server-version-update';

  static getDeployUpdateLink(distributed: boolean) {
    if (distributed) {
      return GithubLinks.TE_DEPLOY_UPDATE;
    }

    return GithubLinks.EE_DEPLOY_UPDATE;
  }
}
