package io.cloudbeaver.utils;

import org.jkiss.dbeaver.model.DBConstants;

import java.text.DateFormat;
import java.text.SimpleDateFormat;

public class WebConstants {
    public static final DateFormat ISO_DATE_FORMAT = new SimpleDateFormat(DBConstants.DEFAULT_ISO_TIMESTAMP_FORMAT);
}
