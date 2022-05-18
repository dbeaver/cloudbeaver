package io.cloudbeaver.model.log;

import org.jkiss.dbeaver.LogHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class SLF4JLogHandler implements LogHandler {
    private static final Map<String, Logger> loggers = new ConcurrentHashMap<>();

    @Override
    public String getName(String name) {
        return name;
    }

    @Override
    public boolean isDebugEnabled(String name) {
        return getLogger(name).isDebugEnabled();
    }

    @Override
    public boolean isErrorEnabled(String name) {
        return getLogger(name).isErrorEnabled();
    }

    @Override
    public boolean isFatalEnabled(String name) {
        return isErrorEnabled(name);
    }

    @Override
    public boolean isInfoEnabled(String name) {
        return getLogger(name).isInfoEnabled();
    }

    @Override
    public boolean isTraceEnabled(String name) {
        return getLogger(name).isTraceEnabled();
    }

    @Override
    public boolean isWarnEnabled(String name) {
        return getLogger(name).isWarnEnabled();
    }

    @Override
    public void trace(String name, Object message) {
        var logger = getLogger(name);
        if (message instanceof Throwable) {
            logger.trace(message.toString(), (Throwable) message);
        } else {
            logger.trace(message.toString());
        }
    }

    @Override
    public void trace(String name, Object message, Throwable t) {
        getLogger(name).trace(message.toString(), t);
    }

    @Override
    public void debug(String name, Object message) {
        var logger = getLogger(name);
        if (message instanceof Throwable) {
            logger.debug(message.toString(), (Throwable) message);
        } else {
            logger.debug(message.toString());
        }
    }

    @Override
    public void debug(String name, Object message, Throwable t) {
        getLogger(name).debug(message.toString(), t);
    }

    @Override
    public void info(String name, Object message) {
        var logger = getLogger(name);
        if (message instanceof Throwable) {
            logger.info(message.toString(), (Throwable) message);
        } else {
            logger.info(message.toString());
        }
    }

    @Override
    public void info(String name, Object message, Throwable t) {
        getLogger(name).info(message.toString(), t);
    }

    @Override
    public void warn(String name, Object message) {
        var logger = getLogger(name);
        if (message instanceof Throwable) {
            logger.warn(message.toString(), (Throwable) message);
        } else {
            logger.warn(message.toString());
        }
    }

    @Override
    public void warn(String name, Object message, Throwable t) {
        getLogger(name).warn(message.toString(), t);
    }

    @Override
    public void error(String name, Object message) {
        var logger = getLogger(name);
        if (message instanceof Throwable) {
            logger.error(message.toString(), (Throwable) message);
        } else {
            logger.error(message.toString());
        }
    }

    @Override
    public void error(String name, Object message, Throwable t) {
        getLogger(name).error(message.toString(), t);
    }

    @Override
    public void fatal(String name, Object message) {
        error(name, message);
    }

    @Override
    public void fatal(String name, Object message, Throwable t) {
        error(name, message, t);
    }

    private Logger getLogger(String loggerName) {
        return loggers.computeIfAbsent(loggerName, LoggerFactory::getLogger);
    }
}
