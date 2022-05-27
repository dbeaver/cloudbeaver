package io.cloudbeaver.service.rm;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBPObjectWithDetails;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.utils.ArrayUtils;

import java.util.Queue;

abstract class DBNAbstractResourceManagerNode extends DBNNode implements DBPObjectWithDetails {
    protected DBNResourceManagerResource[] children;

    DBNAbstractResourceManagerNode(DBNNode parentNode) {
        super(parentNode);
    }

    public void removeChildResourceNode(@NotNull Queue<RMResource> resourcePath) {
        if (children == null || resourcePath.isEmpty()) {
            return;
        }
        var expectedResource = resourcePath.poll();
        var node = RMNavigatorUtils.findResourceNode(children, expectedResource);
        if (node == null) {
            return;
        }

        if (resourcePath.isEmpty()) { // we are in expected parent node
            children = ArrayUtils.remove(DBNResourceManagerResource.class, children, node);
        } else {
            node.removeChildResourceNode(resourcePath);
        }
    }
}
