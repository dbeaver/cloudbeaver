/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */


export class NodeManagerUtils {
  /**
   * connectionId should be in format postgres-jdbc-17015e17226-60ea13802381a3ab
   *
   * @param connectionNodeId example: database://postgres-jdbc-17015e17226-60ea13802381a3ab
   */
  static connectionNodeIdToConnectionId(connectionNodeId: string): string {
    return connectionNodeId.replace('database://', '');
  }

}
