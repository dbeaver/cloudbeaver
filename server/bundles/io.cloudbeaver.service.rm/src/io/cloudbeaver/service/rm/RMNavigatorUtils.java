package io.cloudbeaver.service.rm;

import org.jkiss.dbeaver.model.rm.RMResource;

class RMNavigatorUtils {
    public static DBNResourceManagerResource findResourceNode(DBNResourceManagerResource[] resourceNodes, RMResource expectedResource) {
        DBNResourceManagerResource node = null;
        for (DBNResourceManagerResource resourceNode : resourceNodes) {
            var nodeResource = resourceNode.getResource();
            if (nodeResource.getName().equals(expectedResource.getName()) && nodeResource.isFolder() == expectedResource.isFolder()) {
                node = resourceNode;
                break;
            }
        }
        return node;
    }
}
