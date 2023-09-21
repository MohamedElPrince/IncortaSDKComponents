import { AppliedPrompts, ColumnField, Context, ResponseData, TContext, onDrillDownFunction } from '@incorta-org/component-sdk';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import './primereact.css';
import { handleClick } from './actions.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { SplitButton } from 'primereact/splitbutton';
import ConfirmDialog from './ConfirmDialog.js';
import { classNames } from 'primereact/utils';
import { BodyParams, ConfirmType, Layout } from './utils/types.js';

export enum ResponseStatus {
  Idel,
  Inprogress,
  Success,
  Failure
};

interface Props {
  context: Context<TContext>;
  data: ResponseData;
  prompts: AppliedPrompts;
  drillDown: onDrillDownFunction;
  showMsg: (msg: string, status: ResponseStatus) => void
}

const WriteBackTable = ({ context, data, showMsg }: Props) => {
  //console.log("WriteBackTable");


  // Get parameters ---------------------------------------------------------------------------------------------------
  const [visible, setVisible] = useState(false);
  const layoutOptions = context.component.settings?.layoutoptions
  const tablePaginationRows = context.component.settings?.tablePaginationRows || 5;
  const showGridLines = context.component.settings?.showGridLines || false;
  const stripedRows = context.component.settings?.stripedRows || false;
  const tableSortable = context.component.settings?.tableSortable || false;
  const resizableColumns = context.component.settings?.resizableColumns || false;
  const rowtotal = context.component.settings?.rowtotal || false;
  const contextBinding = context.component.bindings?.['tray-key']

  // Condigurable Fields For Single Button Action
  // TODO: Support Incorta 10.x send insight-id from context instead setting's field.
  const insightID = context.component.settings?.insightID;
  const tableName = context.component.settings?.tableName;
  const datafile = context.component.settings?.datafile;
  const multiSelectRows: boolean = context.component.settings?.multiSelectRows ?? false;
  const loginName = context["session"]["loginName"];
  const tenant = context["session"]["tenantName"];
  // Button Settings
  const apiUrl = context.component.settings?.apiUrl ?? '';
  const reqType = context.component.settings?.requestType ?? '';
  const accessToken = context.component.settings?.accessToken ?? '';
  const bodyParams = context.component.settings?.bodyParams ?? BodyParams.All;
  const buttonColor = context.component.settings?.buttonColor ?? '';
  const buttonIcon = context.component.settings?.buttonIcon ?? '';
  const btnText = context.component.settings?.buttonText ?? '';
  const enableOptions = context.component.settings?.enableOptions;
  const btnOptionsStr = context.component.settings?.actionsOptions ?? '';
  const btnOptions = btnOptionsStr.split(',');

  const [actionStatus, setActionStatus] = useState<any>()
  const [textValue, setTextValue] = useState({
    value: ''
  });
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<ResponseStatus>(ResponseStatus.Idel);

  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number>();
  const [confirmDilogVisible, setConfirmDilogVisible] = useState(false);
  // The column index contains settings for request info as token and url.
  const [columnActionIndex, setColumnActionIndex] = useState<number>(0);
  const selectedOptionRef = useRef<string | undefined>();
  const editModeRef = useRef<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const isEnableAction = () => {
    return selectedRows.length > 0 || !multiSelectRows;
  }

  const bindingContext = context.component.bindings?.['tray-key'][0]; // the 'field' is the tray key
  const field = bindingContext?.field;
  const fieldColumn = field && (field as ColumnField).column;


  // Gets dimensions and measures columns Start -----------------------------------------------------------------------
  const dims =
    data.rowHeaders?.map(cell => {
      return { field: cell.id, header: cell.label, type: 'dimention' };
    }) ?? [];
  const maasures = data.measureHeaders.map(cell => {
    return { field: cell.id, header: cell.label, type: 'measure' };
  });

  let cols = dims.concat(maasures);
  switch (layoutOptions) {
    case Layout.ButtonForEachRow:
      cols.push({ field: '', header: '', type: 'action' });
      break;
    case Layout.SingleButtonAction:
      cols.unshift({ field: 'guid', header: '', type: 'checkbox' });
      break;
  }

  // Gets rows data ---------------------------------------------------------------------------------------------------
  useMemo(() => {
    let datalen = data?.data?.length ?? 0;
    // if (rowtotal) datalen = datalen - 1;
    let isCheckboxCol = layoutOptions === Layout.SingleButtonAction;
    const rowsItems: any[] = [];
    for (let j = 0; j < datalen; j++) {
      let c = {};
      const colsLength = isCheckboxCol ? data.data?.[j]?.length + 1 : data.data?.[j]?.length
      for (let i = 0; i < colsLength; i++) {
        if (isCheckboxCol) {
          if (i === 0) {
            c[cols[i].field] = `guid_${j}_${i}`;
          } else {
            c[cols[i].field] = data.data[j][i - 1].formatted;
          }
        } else {
          c[cols[i].field] = data.data[j][i].formatted;
        }
      }
      rowsItems.push(c);
    }

    if (datalen == 0) {
      for (let j = 0; j < 1; j++) {
        let c = {};
        for (let i = 0; i < cols.length; i++) {
          c[cols[i].field] = '';
        }
        rowsItems.push(c);
      }
    }
    setRows(rowsItems);
  }, [data.data]);

  // Tag status
  const getSeverity = (status: ResponseStatus): { severty: string, label: string } => {
    switch (status) {
      case ResponseStatus.Success:
        return { severty: 'success', label: 'Success' };
      case ResponseStatus.Failure:
        return { severty: 'danger', label: 'Failed' };
      case ResponseStatus.Inprogress:
        return { severty: 'help', label: 'Loading....' };
      default:
        return { severty: 'info', label: 'Info' };
    }
  }

  const getTag = (status: ResponseStatus) => {
    if (status === ResponseStatus.Idel) return undefined;

    const severityObj = getSeverity(status);
    return (<Tag severity={severityObj.severty} value={severityObj.label} />)
  }

  // Button   ---------------------------------------------------------------------------------------------------------
  interface GetButtonOptionsArgs {
    optionAction: () => void;
  }
  const getButtonOptions = ({ optionAction }: GetButtonOptionsArgs) => btnOptions.map((option: String,) => {
    return {
      label: option.trim(),
      command: ({ item }: { item: any }) => {
        selectedOptionRef.current = item.label;
        optionAction();
      }
    }
  });

  const buttonTemplate = (columnIndex: number, rows: any, options: ColumnBodyOptions) => {
    const rowId = context.component.bindings?.dim?.[0]?.id
    const specificRow = context.component.bindings?.dim?.[0]
    const columnsNames = context.component.bindings?.['tray-key'].map((measure) => (measure.name)) || []
    const rowsNames = context.component.bindings?.['dim'].map((row) => (row.name)) || [];
    const values = Object.values(rows);
    const [result, setResult] = useState(null);
    const [isDisabled, setIsDisabled] = useState(false);
    const identity = context.component.settings?.identity || 'noneprovided';
    const login = context["session"]["loginName"];
    setColumnActionIndex(columnIndex);
    const handleOptionsAction = async () => {
      setStatus(ResponseStatus.Idel);
      setSelectedButtonIndex(options.rowIndex);
      setIsDisabled(true);

      // Build parameters ----------------------------------------
      var Params = [];
      for (let i = 0; i < rowsNames.length; i++) {
        Params.push([rowsNames[i], values[i]]);
      }
      for (let i = 0; i < columnsNames.length; i++) {
        const index = i + rowsNames.length;
        Params.push([columnsNames[i], index < values.length ? values[index] : textValue.value]);
      }

      Params.push(["Identity", identity]);
      Params.push(["Creator", login]);
      selectedOptionRef.current && Params.push(["option", selectedOptionRef.current]);

      setStatus(ResponseStatus.Inprogress);
      const result: any = await handleClick(apiUrl, reqType, Params, accessToken)
      setActionStatus(result.result)
      // Wait for a five minutes before dissmis the status tag.
      setTimeout(() => {
        setStatus(ResponseStatus.Idel);
      }, 5000);
      if (result.result) {
        showMsg('Resquest is Success', ResponseStatus.Success);
        setStatus(ResponseStatus.Success);
      } else if (result.error) {
        showMsg(result.error.message, ResponseStatus.Failure);
        setStatus(ResponseStatus.Failure);
      }
    }

    return (<div className="flex flex-wrap align-items-center justify-content-space-around gap-2">
      {
        enableOptions ?
          <SplitButton label={btnText} icon={buttonIcon} severity={buttonColor} model={getButtonOptions({ optionAction: handleOptionsAction })} />
          :
          <Button style={{ boxShadow: 'none' }} label={btnText} icon={buttonIcon} severity={buttonColor} onClick={handleOptionsAction} />
      }
      {layoutOptions === Layout.ButtonForEachRow && options.rowIndex === selectedButtonIndex && getTag(status)}
    </div>);
  };

  const keyForOption = (options: ColumnBodyOptions) => (options.column as any).key.slice(2) ?? '';
  //Input Text Field ------------------------------------------------------------------------------------------------
  const inputTextTemplate = (columnIndex: number, data: any, options: ColumnBodyOptions) => {

    const validateFields = context.component.bindings?.['tray-key'][columnIndex]?.settings?.['validateFields']
    const maxValue = context.component.bindings?.['tray-key'][columnIndex]?.settings?.['maxValue'] ?? Number.MAX_VALUE;
    const minValue = context.component.bindings?.['tray-key'][columnIndex]?.settings?.['minValue'] ?? Number.MIN_VALUE;

    const handleChange = (value: any, options: ColumnBodyOptions) => {
      const key = keyForOption(options);
      const rowIndex = options.rowIndex;
      let updateRows = rows;
      updateRows[rowIndex][key] = value;
      validateFields && (updateRows[rowIndex]['isValid'] = isFieldValid(value));
      setRows(updateRows);
      setTextValue({ value });
      setSelectedRows(prev => {
        const updateIndex = prev.findIndex(row => row[key] === updateRows[rowIndex][key]);
        if (updateIndex >= 0) {
          prev[updateIndex]
          return prev
        }
        return [...prev, updateRows[rowIndex]]
      }
      );
    }

    const isFieldValid = (data: any) => {
      if (data <= maxValue && data >= minValue) {
        return true;
      }
      return false;
    };

    const key = keyForOption(options);
    return (
      <InputText className={classNames(validateFields && { 'p-invalid': data?.['isValid'] === false })} type="text" key={key} value={data?.[key] ?? ''} onChange={(e) => handleChange(e.target.value, options)} />
    );
  };

  // Get table columns   ----------------------------------------------------------------------------------------------
  const dynamicColumns = cols.map((col, columnIndex) => {
    //console.log("dynamicColumns", col, columnIndex);

    // we have to skip the dimensions and checkbox col
    const colsLengthBefore = layoutOptions === Layout.ButtonForEachRow ? dims.length : dims.length + 1
    columnIndex = columnIndex - colsLengthBefore;

    const settings = context.component.bindings?.['tray-key'][columnIndex]?.settings
    const enblActionsFlag = context.component.bindings?.['tray-key'][columnIndex]?.settings?.['editableFields']
    /**
     * Hide Column if The measure is enabled hide option.
     * Hide UUID column.
     */
    const hidecolumn = context.component.bindings?.['tray-key'][columnIndex]?.settings?.['hidecolumn'] || col.header.toLowerCase().includes('uuid');

    if (col.type == 'action')
      return (
        <Column
          key={col.field}
          header={col.header}
          body={(rows, options) => buttonTemplate(columnIndex, rows, options)}
          style={{ width: '30%' }}
        />
      );

    if (col.type === 'checkbox') {
      return multiSelectRows && (
        <Column key={col.field}
          header={col.header}
          selectionMode="multiple"
          headerStyle={{ width: '3rem' }}
          style={{ width: '5%' }} />
      );
    }

    if (enblActionsFlag == true && col.type == 'measure') {
      editModeRef.current = true;
      return (
        console.log(cols.values),
        <Column
          key={col.field}
          header={col.header}
          body={(data, options) => inputTextTemplate(columnIndex, data, options)}
          style={{ width: '25%' }}
        />
      );
    }
    if (hidecolumn != true) {
      return (
        <Column
          key={col.field}
          field={col.field}
          header={col.header}
          sortable={tableSortable}
          style={{ width: '25%', textAlign: 'left' }}
        />
      );
    }
  });

  const showConfirmDialog = () => {
    setConfirmDilogVisible(true);
  }

  // Prepare updated rows for params and delete old values from rows.
  const getFlatUpdateRows = () => {
    return selectedRows.map(row => {
      if (bodyParams === BodyParams.UUID) {
        return Object.values(row)[1];
      } else {
        return Object.values(row).slice(1, cols.length);
      }
    });
  }

  const getRowsForReview = () => selectedRows.map(item => {
    const { guid: _, ...newObj } = item
    return newObj
  });

  const isUpdateDataMode = () => multiSelectRows || editModeRef.current === true;

  const isValidatUpdatedData = () => {
    if (selectedRows.length > 0) {
      return !selectedRows.some(item => item?.isValid === false);
    }
    return true;
  }

  const getConfirmType = () => {
    if (!isUpdateDataMode()) {
      return ConfirmType.DirectAction
    }

    if (isValidatUpdatedData()) {
      return ConfirmType.ChangeData;
    }
    return ConfirmType.PreventAction;
  }

  const getColsForReivew = () => cols.filter(col => col.field !== 'guid' && !col.header.toLowerCase().includes('uuid'));

  const resetUpdatedRows = () => {
    setSelectedRows([]);
  };

  const handleSubmit = async (isOK: boolean) => {
    setStatus(ResponseStatus.Idel);
    setConfirmDilogVisible(false);
    if (!isOK) return;
    
    // Don't submit first checkbox column.
    let headers = cols.map(col => col.header).slice(1);
    let flatRows = getFlatUpdateRows();
    let params: { [key: string]: any } = {
      'modifiedBy': loginName,
      'modificationDate': Date.now(),
    }

    switch (bodyParams) {
      case BodyParams.UUID:
        params['uuids'] = flatRows;
        params['tableName'] = tableName;
        params['dataFile'] = datafile;
        params['status'] = selectedOptionRef.current;
        break;
      case BodyParams.TableName:
        params = { 'tableName': tableName };
        break;
      case BodyParams.All:
        params['updatedRows'] = flatRows;
        params['insightId'] = insightID;
        params['tableName'] = tableName;
        params["headers"] = headers;
        params['tenant'] = tenant;
        params["dataFile"] = datafile;
        break;
    }

    setStatus(ResponseStatus.Inprogress);
    const result: any = await handleClick(apiUrl, reqType, params, accessToken, true)
    setActionStatus(result.result)
    // Wait for a five minutes before dissmis the status tag.
    setTimeout(() => {
      setStatus(ResponseStatus.Idel);
    }, 5000);
    if (result.result) {
      showMsg(`Resquest is Success: ${result.result?.message}`, ResponseStatus.Success);
      setStatus(ResponseStatus.Success);
      resetUpdatedRows();
    } else if (result.error) {
      showMsg(result.error.message, ResponseStatus.Failure);
      setStatus(ResponseStatus.Failure);
    }
  }

  const header = (
    (layoutOptions === Layout.SingleButtonAction &&
      <div className="flex flex-wrap align-items-center align-content-center justify-content-end gap-2" style={{ height: '30px' }}>
        {getTag(status)}
        {
          enableOptions ?
            <SplitButton label={btnText} icon={buttonIcon} severity={buttonColor} model={getButtonOptions({ optionAction: showConfirmDialog })} style={{ boxShadow: 'none' }} disabled={!isEnableAction()} /> :
            <Button label={btnText} icon={buttonIcon} severity={buttonColor} style={{ boxShadow: 'none' }} disabled={!isEnableAction()} onClick={showConfirmDialog} />
        }
        <ConfirmDialog selectedRows={getRowsForReview()} cols={getColsForReivew()} visible={confirmDilogVisible} typeInfo={[getConfirmType(), btnText]} onConfirm={handleSubmit} />
      </div>)
  );

  // Build the table --------------------------------------------------------------------------------------------------
  return (
    <div>
      <div className="card">
        <DataTable
          header={header}
          value={rows}
          resizableColumns={resizableColumns}
          showGridlines={showGridLines}
          stripedRows={stripedRows}
          paginator
          responsiveLayout="scroll"
          paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
          rows={tablePaginationRows}
          selection={selectedRows}
          onSelectionChange={(e) => setSelectedRows(e.value)}
        >
          {dynamicColumns}
        </DataTable>
      </div>
      <div>{actionStatus?.error}</div>
    </div>
  );

};

export default WriteBackTable;
