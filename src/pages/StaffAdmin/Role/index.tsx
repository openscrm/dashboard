import React, {useEffect, useRef, useState} from 'react';
import {PageContainer} from '@ant-design/pro-layout';
import type {FormInstance} from 'antd';
import {Button, Dropdown, Menu, Space, Tabs} from 'antd';
import {MoreOutlined, PlusOutlined, PlusSquareFilled} from '@ant-design/icons';
import ProCard from '@ant-design/pro-card';
import styles from './index.less';
import {False, True} from '../../../../config/constant';
import type {RoleItem} from '@/pages/StaffAdmin/Role/data';
import {message} from 'antd/es';
import {AssignRoleToStaff, Query, QueryRoleStaff, Update} from '@/pages/StaffAdmin/Role/service';
import TabPane from '@ant-design/pro-card/es/components/TabPane';
import Search from 'antd/es/input/Search';
import type {StaffInterface} from '@/services/staff';
import type {ProColumns} from '@ant-design/pro-table/es';
import type {ActionType} from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import {HandleRequest, ProTableRequestAdapter} from '@/utils/utils';
import {ModalForm, ProFormSelect} from '@ant-design/pro-form';
import RoleForm from '@/pages/StaffAdmin/Role/Components/form';
import type {CommonResp} from '@/services/common';
import {history} from '@@/core/history';

const RoleList: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [keyword, setKeyword] = useState<string>('');
  const [assignRoleModalVisible, setAssignRoleModalVisible] = useState<boolean>(false);
  const [currentStaff, setCurrentStaff] = useState<StaffInterface>();
  const [currentRole, setCurrentRole] = useState<RoleItem>();
  const [timeStamp, setTimeStamp] = useState<Date>(new Date());
  const actionRef = useRef<ActionType>();
  const [activeTabPaneKey, setActiveTabPaneKey] = useState<string>('staff_list');
  const roleForm = useRef<FormInstance>();

  const extStaffID = (new URLSearchParams(window.location.search)).get('ext_staff_id') || "";

  useEffect(() => {
    Query({page_size: 5000}).then((res) => {
      if (res.code === 0) {
        setRoles(res?.data?.items || []);
      } else {
        message.error(res.message);
      }
    });
  }, [timeStamp]);


  const columns: ProColumns<StaffInterface>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      valueType: 'text',
      hideInTable: true,
      hideInSearch: true,
    },
    {
      title: '??????',
      dataIndex: 'name',
      valueType: 'text',
      hideInSearch: false,
      render: (dom, item) => {
        return (
          <Space>
            <div className={'tag-like-staff-item'}>
              <img src={item.avatar_url} className={'icon'} alt={item.name}/>
              <span className={'text'}>{item.name}</span>
            </div>
          </Space>
        );
      },
    },
    {
      title: '????????????',
      dataIndex: 'departments',
      valueType: 'text',
      hideInSearch: true,
      render: (dom) => {
        // @ts-ignore
        const arr = dom?.length > 1 ? dom?.slice(1) : dom;
        return (
          <Space>
            {arr?.map((i: any) => (
              <span key={i.id}>{i.name}</span>
            ))}
          </Space>
        );
      },
    },
    {
      title: '??????',
      dataIndex: 'role_type',
      hideInSearch: false,
      valueType: 'select',
      valueEnum: {
        '': {text: '????????????', role_type: ''},
        superAdmin: {text: '???????????????', role_type: 'superAdmin'},
        admin: {text: '?????????', role_type: 'admin'},
        departmentAdmin: {text: '???????????????', role_type: 'departmentAdmin'},
        staff: {text: '??????', role_type: 'staff'},
      },
    },
    {
      title: '????????????',
      dataIndex: 'external',
      valueType: 'text',
      hideInSearch: true,
    },
    {
      title: '??????',
      hideInSearch: true,
      width: 100,
      render: (_, item) => {
        return (
          <a
            type={'link'}
            onClick={() => {
              setCurrentStaff(item);
              setAssignRoleModalVisible(true);
            }}>
            ????????????
          </a>
        );
      },
    },
  ];

  // @ts-ignore
  // @ts-ignore
  return (
    <PageContainer
      fixedHeader
      className={styles.roleListContainer}
      extra={[
        <Button
          key='create'
          type='primary'
          icon={<PlusOutlined style={{fontSize: 16, verticalAlign: '-3px'}}/>}
          onClick={() => {
            history.push('/staff-admin/company-management/role/create');
          }}
        >
          ????????????
        </Button>,
      ]}
    >
      <ProCard gutter={8} ghost>
        <ProCard colSpan={{
          md: '240px',
        }} bordered className={styles.leftPart}>
          <div className={styles.header}>
            <Button
              key='1'
              className={styles.button}
              type='text'
              icon={<PlusSquareFilled style={{color: 'rgb(154,173,193)', fontSize: 15}}/>}
              onClick={() => {
                history.push('/staff-admin/company-management/role/create');
              }}
            >
              ????????????
            </Button>
          </div>
          <Menu
            onSelect={() => {
            }}
            defaultSelectedKeys={['0']}
            mode='inline'
            className={styles.menuList}
          >
            <Menu.Item
              key='0'
              onClick={() => {
                setCurrentRole({});
                setActiveTabPaneKey('staff_list');
              }}
            >
              ??????
            </Menu.Item>
            {roles.map((item) => (
              <Menu.Item
                key={item.id}
                onClick={() => {
                  setCurrentRole(item);
                }}
              >
                <div className={styles.menuItem}>
                  {item.name}
                  <span className={styles.count}
                        style={{marginRight: item.is_default === True ? 16 : 0}}>{item.count}</span>
                </div>
                {item.is_default === False && (
                  <Dropdown
                    className={'more-actions'}
                    overlay={
                      <Menu
                        onClick={(e) => {
                          e.domEvent.preventDefault();
                          e.domEvent.stopPropagation();
                        }}
                      >
                        <Menu.Item
                          onClick={() => {
                            history.push(`/staff-admin/company-management/role/edit?id=${item.id}`);
                          }}
                          key='edit'
                        >
                          ??????
                        </Menu.Item>
                      </Menu>
                    }
                    trigger={['hover']}
                  >
                    <MoreOutlined style={{color: '#9b9b9b', fontSize: 18}}/>
                  </Dropdown>
                )}
              </Menu.Item>
            ))}
          </Menu>
        </ProCard>

        <ProCard bordered className={styles.rightPart}>
          <Tabs
            activeKey={activeTabPaneKey}
            onChange={(key) => {
              setActiveTabPaneKey(key);
            }}
            tabBarExtraContent={{
              right: (
                <>
                  {activeTabPaneKey === 'staff_list' && (
                    <Search
                      placeholder='????????????'
                      allowClear={true}
                      onSearch={setKeyword}
                    />
                  )}
                  {activeTabPaneKey === 'permission' && currentRole?.is_default === False && (
                    <Button
                      key='edit'
                      type='dashed'
                      onClick={() => {
                        history.push(`/staff-admin/company-management/role/edit?id=${currentRole?.id}`);
                      }}
                    >
                      ????????????
                    </Button>
                  )}
                </>
              ),
            }}>
            <TabPane className={styles.tabPane} tab='????????????' key='staff_list'>
              <ProTable
                actionRef={actionRef}
                className={'table'}
                columns={columns}
                rowKey='id'
                pagination={{
                  pageSizeOptions: ['5', '10', '20', '50', '100'],
                  pageSize: 50,
                }}
                toolBarRender={false}
                search={false}
                bordered={true}
                tableAlertRender={false}
                params={{
                  name: keyword,
                  role_id: currentRole?.id,
                  ext_staff_id: extStaffID,
                }}
                request={async (values, sort, filter) => {
                  return ProTableRequestAdapter(values, sort, filter, QueryRoleStaff);
                }}
                dateFormatter='string'
              />
            </TabPane>

            <TabPane className={styles.tabPane} tab='????????????' key='permission' disabled={!currentRole?.id}>
              <RoleForm
                mode={'simpleEdit'}
                currentItem={currentRole}
                // @ts-ignore
                formRef={roleForm}
                onFinish={async (params) => {
                  const hide = message.loading('?????????');
                  const res: CommonResp = await Update(params);
                  hide();
                  if (res.code === 0) {
                    message.success('????????????');
                    return true;
                  }

                  if (res.message) {
                    message.error(res.message);
                    return false;
                  }

                  message.error('????????????');
                  return false;
                }}
              />
            </TabPane>

          </Tabs>
        </ProCard>

      </ProCard>

      <ModalForm
        className={'dialog from-item-label-100w'}
        layout={'horizontal'}
        width={'560px'}
        visible={assignRoleModalVisible}
        onVisibleChange={setAssignRoleModalVisible}
        onFinish={async (params) =>
          HandleRequest({
            ext_staff_ids: [currentStaff?.ext_staff_id],
            role_id: params.role_id,
          }, AssignRoleToStaff, () => {
            actionRef.current?.reload();
            setTimeStamp(new Date());
          })
        }
      >
        <h2 className='dialog-title'> ???????????? </h2>
        <ProFormSelect
          width={'md'}
          name='role_id'
          label='????????????'
          // @ts-ignore
          options={roles.map((role) => {
            if (role.type === 'superAdmin') {
              return '';
            }
            return {value: role.id, label: role.name};
          }).filter((role) => role)}
          placeholder='???????????????'
          rules={[{required: true, message: '???????????????'}]}
        />
      </ModalForm>

    </PageContainer>
  );
};

export default RoleList;
