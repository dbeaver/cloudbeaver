package io.cloudbeaver.server;

public class CBPlatformActivator extends WebPlatformActivator {

    @Override
    protected void shutdownPlatform() {
        try {
            // Dispose core
            if (CBPlatform.instance != null) {
                CBPlatform.instance.dispose();
            }
        } catch (Throwable e) {
            e.printStackTrace();
            System.err.println("Internal error after shutdown process:" + e.getMessage()); //$NON-NLS-1$
        }
    }
}
