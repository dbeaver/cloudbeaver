package io.cloudbeaver.service.sql;

import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.server.CBConstants;
import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.*;
import org.jkiss.dbeaver.model.exec.*;
import org.jkiss.dbeaver.model.impl.data.DBDValueError;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;
import org.jkiss.dbeaver.utils.ContentUtils;
import org.jkiss.utils.CommonUtils;
import org.jkiss.utils.IOUtils;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.sql.Timestamp;
import java.util.List;


public class WebSQLDataLOBReceiver implements DBDDataReceiver {
    private static final Log log = Log.getLog(WebSQLDataLOBReceiver.class);
    public static final File DATA_EXPORT_FOLDER = CBPlatform.getInstance().getTempFolder(new VoidProgressMonitor(), "sql-lob-files");

    private final WebSQLContextInfo contextInfo;
    private final DBSDataContainer dataContainer;

    private DBDAttributeBinding binding;
    private DBDValue lobValue;
    private int rowIndex;

    WebSQLDataLOBReceiver(WebSQLContextInfo contextInfo, DBSDataContainer dataContainer, int rowIndex) {
        this.contextInfo = contextInfo;
        this.dataContainer = dataContainer;
        this.rowIndex = rowIndex;
        if (!DATA_EXPORT_FOLDER.exists()){
            DATA_EXPORT_FOLDER.mkdirs();
        }

    }

    public String createLobFile(DBCSession session) throws DBCException, IOException {
        String exportFileName = CommonUtils.truncateString(dataContainer.getName(), 32);
        StringBuilder fileName = new StringBuilder(exportFileName);
        fileName.append("_")
                .append(binding.getName())
                .append("_");
        Timestamp ts = new Timestamp(System.currentTimeMillis());
        fileName.append(ts.getTime());
        exportFileName = CommonUtils.escapeFileName(fileName.toString());
        byte[] binaryValue;
        Number fileSizeLimit = CBApplication.getInstance().getAppConfiguration().getResourceQuota(CBConstants.QUOTA_PROP_FILE_LIMIT);
        if (lobValue instanceof DBDContent) {
            binaryValue = ContentUtils.getContentBinaryValue(session.getProgressMonitor(), (DBDContent) lobValue);
        } else {
            binaryValue = lobValue.getRawValue().toString().getBytes();
        }
        if (binaryValue == null) {
            throw new DBCException("Lob value is null");
        }
        if (binaryValue.length > fileSizeLimit.longValue()) {
            throw new DBQuotaException(
                    "Data export quota exceeded", CBConstants.QUOTA_PROP_FILE_LIMIT, fileSizeLimit.longValue(), binaryValue.length);
        }
        File file = new File(DATA_EXPORT_FOLDER, exportFileName);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            IOUtils.writeFileFromBuffer(file, binaryValue);
        }
        return exportFileName;
    }



    @Override
    public void fetchStart(DBCSession session, DBCResultSet resultSet, long offset, long maxRows) throws DBCException {
        DBCResultSetMetaData meta = resultSet.getMeta();
        List<DBCAttributeMetaData> attributes = meta.getAttributes();
        DBCAttributeMetaData attrMeta = attributes.get(rowIndex);
        binding = new DBDAttributeBindingMeta(dataContainer, resultSet.getSession(), attrMeta);
    }
    @Override
    public void fetchRow(DBCSession session, DBCResultSet resultSet) throws DBCException {

        try {
            Object cellValue = binding.getValueHandler().fetchValueObject(
                    resultSet.getSession(),
                    resultSet,
                    binding.getMetaAttribute(),
                    rowIndex);
            lobValue = (DBDValue) cellValue;
        } catch (Throwable e) {
            lobValue = new DBDValueError(e);
        }
    }

    @Override
    public void fetchEnd(DBCSession session, DBCResultSet resultSet) throws DBCException {

    }

    @Override
    public void close() {

    }
}
