package io.cloudbeaver.utils;

import java.io.File;

public class WebAppUtils {
    public static String getRelativePath(String path, String curDir) {
        return getRelativePath(path, new File(curDir));
    }

    public static String getRelativePath(String path, File curDir) {
        if (path.startsWith("/") || path.length() > 2 && path.charAt(1) == ':') {
            return path;
        }
        return new File(curDir, path).getAbsolutePath();
    }

}
