import React, {useEffect, useRef, useState} from 'react';
import {PageContainer} from '@ant-design/pro-layout';
import type {FormInstance} from 'antd';
import {Alert, Button, message, Space} from 'antd';
import type {ActionType, ProColumns} from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import type {DeleteCustomerRecordNotifyRuleInterface} from '@/pages/StaffAdmin/DeleteCustomerRecord/service';
import {
  ExportDeleteCustomerRecord,
  GetDeleteCustomerRecordNotifyRule,
  QueryDeleteCustomerRecord,
  UpdateDeleteCustomerRecordRule,
} from '@/pages/StaffAdmin/DeleteCustomerRecord/service';
import {HandleRequest, ProTableRequestAdapter} from '@/utils/utils';
import styles from './index.less';
import moment from 'moment';
import type {DeleteCustomerRecordItem} from '@/pages/StaffAdmin/DeleteCustomerRecord/data';
import {CloudDownloadOutlined, SettingOutlined} from '@ant-design/icons';
import {False, True} from '../../../../config/constant';
import ProForm, {ModalForm, ProFormRadio, ProFormSwitch} from '@ant-design/pro-form';
import Text from 'antd/es/typography/Text';
import StaffTreeSelect from '@/pages/StaffAdmin/Components/Fields/StaffTreeSelect';
import type {SimpleStaffInterface} from '@/services/staff';
import {QuerySimpleStaffs} from '@/services/staff';
import type {StaffOption} from '@/pages/StaffAdmin/Components/Modals/StaffTreeSelectionModal';
import FileSaver from 'file-saver';
import {history} from "@@/core/history";

const DeleteCustomerRecordList: React.FC = () => {
  const [settingsModalVisible, setSettingsModalVisible] = useState<boolean>(false);
  const [settings, setSettings] = useState<DeleteCustomerRecordNotifyRuleInterface>();
  const [allStaffs, setAllStaffs] = useState<StaffOption[]>([]);
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();

  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const queryFormRef = useRef<FormInstance>();
  const [extraFilterParams] = useState<any>();

  const formattedParams = (originParams: any) => {
    const params = {...originParams, ...extraFilterParams};
    if (params.relation_delete_at) {
      [params.delete_customer_start, params.delete_customer_end] = params.relation_delete_at;
      delete params.relation_delete_at;
    }
    if (params.relation_create_at) {
      [params.connection_create_start, params.connection_create_end] = params.relation_create_at;
      delete params.relation_create_at;
    }

    return params;
  };

  useEffect(() => {
    QuerySimpleStaffs({page_size: 5000}).then((res) => {
      if (res.code === 0) {
        const staffs = res?.data?.items?.map((item: SimpleStaffInterface) => {
          return {
            label: item.name,
            value: item.ext_id,
            ...item,
          };
        }) || [];
        setAllStaffs(staffs);
      } else {
        message.error(res.message);
      }
    });
  }, []);

  useEffect(() => {
    GetDeleteCustomerRecordNotifyRule()
      .then((resp) => {
        if (resp && resp.data) {
          const item = resp.data as DeleteCustomerRecordNotifyRuleInterface;
          setSettings(item);
        }
      })
      .catch((err) => {
        message.error(err);
      });
  }, []);

  const columns: ProColumns<DeleteCustomerRecordItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      valueType: 'text',
      hideInTable: true,
      hideInSearch: true,
    },
    {
      title: '????????????',
      dataIndex: 'ext_customer_name',
      valueType: 'text',
      hideInSearch: true,
      render: (dom, item) => {
        return (
          <div className={'customer-info-field'}>
            <img
              src={item.ext_customer_avatar}
              className={'icon'}
              alt={item.ext_customer_name}
            />
            <div className={'text-group'}>
              <p className={'text'}>
                {item.ext_customer_name}
              </p>
              {item.customer_corp_name && (
                <p className={'text'} style={{ color: '#eda150' }}>@{item.customer_corp_name}</p>
              )}
              {item.customer_type === 1 && (
                <p className={'text'} style={{ color: '#5ec75d' }}>@??????</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '?????????',
      dataIndex: 'ext_staff_id',
      valueType: 'text',
      renderFormItem: () => {
        return <StaffTreeSelect options={allStaffs}/>;
      },
      render: (dom, item) => {
        return (
          <Space>
            <div className={'tag-like-staff-item'}>
              <img src={item.ext_staff_avatar} className={'icon'} alt={item.staff_name}/>
              <span className={'text'}>{item.staff_name}</span>
            </div>
          </Space>
        );
      },
    },
    {
      title: '????????????',
      dataIndex: 'relation_delete_at',
      valueType: 'dateRange',
      sorter: true,
      filtered: true,
      render: (dom, item) => {
        return (
          <div
            dangerouslySetInnerHTML={{
              __html: moment(item.relation_delete_at)
                .format('YYYY-MM-DD HH:mm')
                .split(' ')
                .join('<br />'),
            }}
          />
        );
      },
    },
    {
      title: '????????????',
      dataIndex: 'relation_create_at',
      valueType: 'dateRange',
      sorter: true,
      filtered: true,
      render: (dom, item) => {
        return (
          <div
            dangerouslySetInnerHTML={{
              __html: moment(item.relation_create_at)
                .format('YYYY-MM-DD HH:mm')
                .split(' ')
                .join('<br />'),
            }}
          />
        );
      },
    },

    {
      title: '??????',
      width: 180,
      valueType: 'option',
      render: (__,item) => [
        <a
          key={'detail'}
          onClick={() => {
            history.push(`/staff-admin/customer-management/customer/detail?ext_customer_id=${item.ext_customer_id}`);
          }}
        >
          ????????????
        </a>,
      ],
    },
  ];

  return (
    <PageContainer
      fixedHeader
      header={{
        title: '????????????',
        subTitle: (
          <a
            target={'_blank'}
            className={styles.tipsLink}
            // href={'https://www.openscrm.cn/wiki/contact-way'}
          >
            ????????????????????????
          </a>
        ),
      }}
      extra={[
        <Button
          type="dashed"
          key={'settings'}
          icon={<SettingOutlined style={{fontSize: 16, verticalAlign: '-3px'}}/>}
          onClick={() => {
            setSettingsModalVisible(true);
          }}
        >
          ??????
        </Button>,

        <Button
          key={'export'}
          type="dashed"
          loading={exportLoading}
          icon={<CloudDownloadOutlined style={{fontSize: 16, verticalAlign: '-3px'}}/>}
          onClick={async () => {
            setExportLoading(true);
            try {
              const content = await ExportDeleteCustomerRecord(
                formattedParams(queryFormRef.current?.getFieldsValue()),
              );
              const blob = new Blob([content], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              });
              FileSaver.saveAs(blob, `????????????.xlsx`);
            } catch (e) {
              console.log(e);
              message.error('????????????');
            }
            setExportLoading(false);
          }}
        >
          ??????Excel
        </Button>,
      ]}
    >
      <ProTable<DeleteCustomerRecordItem>
        actionRef={actionRef}
        className={'table'}
        scroll={{x: 'max-content'}}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSizeOptions: ['5', '10', '20', '50', '100'],
          pageSize: 5,
        }}
        toolBarRender={false}
        bordered={false}
        tableAlertRender={false}
        params={{}}
        request={async (originParams: any, sort, filter) => {
          return ProTableRequestAdapter(
            formattedParams(originParams),
            sort,
            filter,
            QueryDeleteCustomerRecord,
          );
        }}
        dateFormatter="string"
      />

      <ModalForm
        formRef={formRef}
        width={660}
        className={'dialog from-item-label-100w'}
        layout={'horizontal'}
        visible={settingsModalVisible}
        onVisibleChange={setSettingsModalVisible}
        onFinish={async (values: DeleteCustomerRecordNotifyRuleInterface) => {
          console.log(values);
          return await HandleRequest(
            {
              is_notify_staff: values.is_notify_staff ? True : False,
              notify_type: values?.notify_type,
              ext_staff_ids: values?.ext_staff_ids,
            },
            UpdateDeleteCustomerRecordRule,
            () => {
              actionRef.current?.clearSelected?.();
              actionRef.current?.reload?.();
            },
          );
        }}
      >
        <h2 className="dialog-title"> ?????????????????? </h2>
        <Alert
          showIcon={true}
          closable={false}
          style={{marginBottom: 16}}
          type="info"
          message={
            <Text type={'secondary'}>
              ???????????????????????????????????????????????????????????????????????????????????????????????????????????????
            </Text>
          }
        />
        <ProFormSwitch
          label={'???????????????'}
          checkedChildren="??????"
          unCheckedChildren="??????"
          name="is_notify_staff"
          initialValue={settings?.is_notify_staff === True}
        />

        <ProForm.Item
          label="?????????????????????"
          name="ext_staff_ids"
          style={{width: 435}}
          initialValue={settings?.ext_staff_ids || []}
        >
          <StaffTreeSelect options={allStaffs}/>
        </ProForm.Item>

        <ProFormRadio.Group
          name="notify_type"
          label="????????????"
          initialValue={settings?.notify_type}
          options={[
            {
              label: '????????????',
              value: 1,
            },
            {
              label: '???????????????????????????8-9????????????????????????',
              value: 2,
            },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default DeleteCustomerRecordList;
