package io.cloudbeaver.service.sql;

import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDAttributeBindingMeta;
import org.jkiss.dbeaver.model.data.DBDDataReceiver;
import org.jkiss.dbeaver.model.data.DBDValue;
import org.jkiss.dbeaver.model.exec.*;
import org.jkiss.dbeaver.model.impl.data.DBDValueError;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;


public class WebSQLDataLOBReceiver implements DBDDataReceiver {
    private static final Log log = Log.getLog(WebSQLDataLOBReceiver.class);
    public static final File DATA_EXPORT_FOLDER = CBPlatform.getInstance().getTempFolder(new VoidProgressMonitor(), "sql-lob-files");

    private final WebSQLContextInfo contextInfo;
    private final DBSDataContainer dataContainer;

    private DBDAttributeBinding binding;
    private DBDValue row;
    private int rowIndex;

    WebSQLDataLOBReceiver(WebSQLContextInfo contextInfo, DBSDataContainer dataContainer, int rowIndex) {
        this.contextInfo = contextInfo;
        this.dataContainer = dataContainer;
        this.rowIndex = rowIndex;
        if (!DATA_EXPORT_FOLDER.exists()){
            DATA_EXPORT_FOLDER.mkdirs();
        }

    }

    public String createBlobFile() throws IOException {
        StringBuilder fileName = new StringBuilder(dataContainer.getName());
        fileName.append("_");
        fileName.append(binding.getName());
        fileName.append("_");
        Timestamp ts = new Timestamp(System.currentTimeMillis());
        fileName.append(ts.getTime());
        File file = new File(DATA_EXPORT_FOLDER, fileName.toString());
        try (FileOutputStream fos = new FileOutputStream(file)) {
            byte[] val = (byte[]) row.getRawValue();
            fos.write(val);
        }
        return fileName.toString();
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
            row = (DBDValue) cellValue;
        } catch (Throwable e) {
            row = new DBDValueError(e);
        }
    }

    @Override
    public void fetchEnd(DBCSession session, DBCResultSet resultSet) throws DBCException {

    }

    @Override
    public void close() {

    }
}
