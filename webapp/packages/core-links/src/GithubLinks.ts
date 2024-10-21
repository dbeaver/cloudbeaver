/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export class GithubLinks {
  static CLOUDBEAVER_REPO = 'https://github.com/dbeaver/cloudbeaver';
  static EE_DEPLOY_REPO = 'https://github.com/dbeaver/cloudbeaver-deploy';
  static TE_DEPLOY_REPO = 'https://github.com/dbeaver/team-edition-deploy';

  getDeployRepo(distributed: boolean) {
    if (distributed) {
      return GithubLinks.TE_DEPLOY_REPO;
    }

    return GithubLinks.EE_DEPLOY_REPO;
  }
}
