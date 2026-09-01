/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

public final class CloudBeaverLauncher {
    private static final List<String> JVM_ARGUMENTS = List.of(
        "-Dfile.encoding=UTF-8",
        "--enable-native-access=ALL-UNNAMED",
        "--add-modules=ALL-DEFAULT",
        "--add-opens=java.base/java.io=ALL-UNNAMED",
        "--add-opens=java.base/java.lang=ALL-UNNAMED",
        "--add-opens=java.base/java.lang.reflect=ALL-UNNAMED",
        "--add-opens=java.base/java.net=ALL-UNNAMED",
        "--add-opens=java.base/java.nio=ALL-UNNAMED",
        "--add-opens=java.base/java.nio.charset=ALL-UNNAMED",
        "--add-opens=java.base/java.text=ALL-UNNAMED",
        "--add-opens=java.base/java.time=ALL-UNNAMED",
        "--add-opens=java.base/java.util=ALL-UNNAMED",
        "--add-opens=java.base/java.util.concurrent=ALL-UNNAMED",
        "--add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED",
        "--add-opens=java.base/jdk.internal.vm=ALL-UNNAMED",
        "--add-opens=java.base/jdk.internal.misc=ALL-UNNAMED",
        "--add-opens=java.base/sun.nio.ch=ALL-UNNAMED",
        "--add-opens=java.base/sun.security.ssl=ALL-UNNAMED",
        "--add-opens=java.base/sun.security.util=ALL-UNNAMED",
        "--add-opens=java.security.jgss/sun.security.jgss=ALL-UNNAMED",
        "--add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED",
        "--add-opens=java.sql/java.sql=ALL-UNNAMED"
    );

    private CloudBeaverLauncher() {
    }

    public static void main(String[] args) throws Exception {
        initializeWorkspace();

        var command = new ArrayList<String>();
        command.add(Path.of(System.getProperty("java.home"), "bin", javaExecutable()).toString());
        addJavaOptions(command);
        command.addAll(JVM_ARGUMENTS);
        command.add("-jar");
        command.add(findLauncherJar().toString());
        command.addAll(Arrays.asList(args));
        command.addAll(List.of(
            "-product", "io.cloudbeaver.product.ce.product",
            "-web-config", "conf/cloudbeaver.conf",
            "-nl", "en",
            "-registryMultiLanguage"
        ));

        System.out.println("Starting CloudBeaver Server");
        var process = new ProcessBuilder(command).inheritIO().start();
        var shutdownHook = Thread.ofPlatform().name("cloudbeaver-shutdown").unstarted(() -> stop(process));
        Runtime.getRuntime().addShutdownHook(shutdownHook);

        int exitCode = process.waitFor();
        Runtime.getRuntime().removeShutdownHook(shutdownHook);
        System.exit(exitCode);
    }

    private static void initializeWorkspace() throws Exception {
        var workspace = Path.of("workspace");
        if (Files.notExists(workspace.resolve(".metadata"))) {
            Files.createDirectories(workspace.resolve(".metadata"));
            var dataSources = workspace.resolve("GlobalConfiguration/.dbeaver/data-sources.json");
            Files.createDirectories(dataSources.getParent());
            if (Files.notExists(dataSources)) {
                Files.copy(Path.of("conf/initial-data-sources.conf"), dataSources);
            }
        }
    }

    private static Path findLauncherJar() throws Exception {
        try (var plugins = Files.list(Path.of("server/plugins"))) {
            return plugins
                .filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString().startsWith("org.jkiss.dbeaver.launcher"))
                .filter(path -> path.getFileName().toString().endsWith(".jar"))
                .sorted()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("CloudBeaver launcher JAR not found"));
        }
    }

    private static void addJavaOptions(List<String> command) {
        var javaOptions = System.getenv("JAVA_OPTS");
        if (javaOptions != null && !javaOptions.isBlank()) {
            command.addAll(Arrays.asList(javaOptions.trim().split("\\s+")));
        }
    }

    private static String javaExecutable() {
        return System.getProperty("os.name").startsWith("Windows") ? "java.exe" : "java";
    }

    private static void stop(Process process) {
        process.destroy();
        try {
            if (!process.waitFor(10, TimeUnit.SECONDS)) {
                process.destroyForcibly();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            process.destroyForcibly();
        }
    }
}
