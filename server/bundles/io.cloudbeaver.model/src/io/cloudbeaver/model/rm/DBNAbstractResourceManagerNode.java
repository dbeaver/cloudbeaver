package io.cloudbeaver.model.rm;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPObjectWithDetails;
import org.jkiss.dbeaver.model.navigator.DBNNode;
import org.jkiss.dbeaver.model.rm.RMResource;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.utils.ArrayUtils;

import java.util.Arrays;
import java.util.Comparator;
import java.util.Queue;

public abstract class DBNAbstractResourceManagerNode extends DBNNode implements DBPObjectWithDetails {
    protected DBNResourceManagerResource[] children;

    public DBNAbstractResourceManagerNode(DBNNode parentNode) {
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

    public void addChildResourceNode(@NotNull Queue<RMResource> resourcePath) {
        if (children == null) {
            // initialize children
            try {
                getChildren(new VoidProgressMonitor());
            } catch (DBException e) {
                return;
            }
        }
        if (resourcePath.isEmpty()) {
            return;
        }
        var expectedResource = resourcePath.poll();
        var node = RMNavigatorUtils.findResourceNode(children, expectedResource);
        if (node == null) { // we are in expected parent node
            DBNResourceManagerResource newResourceNode = new DBNResourceManagerResource(this, expectedResource);
            children = ArrayUtils.add(DBNResourceManagerResource.class, children, newResourceNode);
            Arrays.sort(children, Comparator.comparing(DBNNode::getName));
            return;
        }
        if (resourcePath.size() > 0) {
            node.addChildResourceNode(resourcePath);
        }

    }
}
