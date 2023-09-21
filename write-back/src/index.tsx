import React, { useRef, useMemo } from 'react';
import {
  useContext,
  LoadingOverlay,
  ErrorOverlay,
  usePrompts,
  useQueryBuilder,
  useCustomQuery
} from '@incorta-org/component-sdk';
import WriteBackTable, { ResponseStatus } from './WriteBackTable';
import './styles.less';
import { Toast } from 'primereact/toast';

export default () => {
  const { prompts, drillDown } = usePrompts();
  const context = useContext();
  const { data } = useQueryBuilder(context, prompts);
  const customQueryObject = useMemo(() => {
    if (!data) return;
    const queryObject = data;
    const dim: any[] | undefined = context.component.bindings?.dim
    const listingTable = dim === undefined || dim.length === 0 || dim?.[0]?.settings?.aggregation === false;
    if(listingTable) {
      const newMeasures = queryObject.measures.map(measure => {
        const {aggregation: _, ...newMeasure} = measure;
        return newMeasure;
      });
      queryObject.measures = newMeasures;
      queryObject.showDetails =  true;
      queryObject.rowTotal =  false;
    }
    
    return queryObject;
  }, [data]);

  const { data: queryData, isLoading, isError, error } = useCustomQuery(customQueryObject);
  const toast = useRef<Toast>(null);

  const showMsg = (msg: string, status: ResponseStatus) => {
    switch(status) {
      case ResponseStatus.Success :
        showSuccess(msg);
        break;
      case ResponseStatus.Failure:
        showError(msg);
        break
    }
  }
  const showSuccess = (msg: string) => {
    toast.current?.show({severity:'success', summary: 'Success Response', detail:msg, closable:false, life: 3000});
  }
  const showError = (msg: string) => {
      toast.current?.show({ severity:'error', summary: 'Error Response', detail: msg, closable: false, life: 3000});
  }

  return (
    <ErrorOverlay isError={isError} error={error}>
      <LoadingOverlay isLoading={isLoading} data={data}>
      <Toast ref={toast} style={{position: 'fixed', top: '0px', right: '0px'}}/>
        {context && queryData ? (
          <WriteBackTable data={queryData} context={context} prompts={prompts} drillDown={drillDown} showMsg={showMsg}/>
          ) : null}
      </LoadingOverlay>
    </ErrorOverlay>
  );
};
