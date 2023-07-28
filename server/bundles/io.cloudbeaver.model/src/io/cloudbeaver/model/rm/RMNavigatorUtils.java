package io.cloudbeaver.model.rm;

import org.jkiss.dbeaver.model.rm.RMResource;

class RMNavigatorUtils {
    public static DBNResourceManagerResource findResourceNode(DBNResourceManagerResource[] resourceNodes, String expectedResource) {
        DBNResourceManagerResource node = null;
        for (DBNResourceManagerResource resourceNode : resourceNodes) {
            var nodeResource = resourceNode.getResource();
            if (nodeResource.getName().equals(expectedResource)) {
                node = resourceNode;
                break;
            }
        }
        return node;
    }
}
