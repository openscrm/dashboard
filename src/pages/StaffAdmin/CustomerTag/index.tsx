import React, {useEffect, useRef, useState} from 'react';
import {PageContainer} from '@ant-design/pro-layout';
import type {FormInstance} from 'antd';
import {Button, Col, Empty, Input, Modal, Row, Space, Spin, Tag, Tooltip} from 'antd';
import {HandleRequest} from '@/utils/utils';
import {DeleteOutlined, DragOutlined, EditOutlined, FolderFilled, PlusOutlined, SyncOutlined,} from '@ant-design/icons';
import {ProFormText, QueryFilter} from '@ant-design/pro-form';
import ProCard from '@ant-design/pro-card';
import type {DepartmentOption} from '@/pages/StaffAdmin/Components/Modals/DepartmentSelectionModal';
import {message} from 'antd/es';
import type {DepartmentInterface} from '@/services/department';
import {QueryDepartment} from '@/services/department';
import {Create, CreateTag, Delete, ExchangeOrder, Query, Sync, Update,} from '@/pages/StaffAdmin/CustomerTag/service';
import type {CommonResp} from '@/services/common';
import styles from './index.less';
import DepartmentTreeSelect from '@/pages/StaffAdmin/Components/Fields/DepartmentTreeSelect';
import type {CustomerTagGroupItem} from '@/pages/StaffAdmin/CustomerTag/data';
import CreateModalForm from '@/pages/StaffAdmin/CustomerTag/Components/createModalForm';
import type {Dictionary} from 'lodash';
import _ from 'lodash';
import {ReactSortable} from "react-sortablejs";
import Form from 'antd/lib/form';

const CustomerTagGroupList: React.FC = () => {
  const [currentItem, setCurrentItem] = useState<CustomerTagGroupItem>({});
  const [tagGroups, setTagGroups] = useState<CustomerTagGroupItem[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [inputLoading, setInputLoading] = useState<boolean>(false);
  const [minOrder, setMinOrder] = useState<number>(10000);
  const [maxOrder, setMaxOrder] = useState<number>(100000);
  const [currentInputTagGroupExtID, setCurrentInputTagGroupExtID] = useState<string>();
  const [allDepartments, setAllDepartments] = useState<DepartmentOption[]>([]);
  const [allDepartmentMap, setAllDepartmentMap] = useState<Dictionary<DepartmentOption>>({});
  const queryFilterFormRef = useRef<FormInstance>();

  useEffect(() => {
    QueryDepartment({page_size: 5000}).then((res) => {
      if (res.code === 0) {
        const departments =
          res?.data?.items?.map((item: DepartmentInterface) => {
            return {
              label: item.name,
              value: item.ext_id,
              ...item,
            };
          }) || [];
        setAllDepartments(departments);
        setAllDepartmentMap(_.keyBy<DepartmentOption>(departments, 'ext_id'));

      } else {
        message.error(res.message);
      }
    });
    queryFilterFormRef.current?.submit();
  }, []);

  // @ts-ignore
  // @ts-ignore
  return (
    <PageContainer
      fixedHeader
      header={{
        title: '??????????????????',
      }}
      extra={[
        <Button
          key='create'
          type='primary'
          icon={<PlusOutlined style={{fontSize: 16, verticalAlign: '-3px'}}/>}
          onClick={() => {
            setCreateModalVisible(true);
          }}
        >
          ???????????????
        </Button>,

        <Button
          key={'sync'}
          type='dashed'
          icon={<SyncOutlined style={{fontSize: 16, verticalAlign: '-3px'}}/>}
          loading={syncLoading}
          onClick={async () => {
            setSyncLoading(true);
            const res: CommonResp = await Sync();
            if (res.code === 0) {
              setSyncLoading(false);
              message.success('????????????');
              queryFilterFormRef.current?.submit();
            } else {
              setSyncLoading(false);
              message.error(res.message);
            }
          }}
        >
          ????????????????????????
        </Button>,
      ]}
    >
      <ProCard className={styles.queryFilter}>
        <QueryFilter
          formRef={queryFilterFormRef}
          onReset={() => {
            queryFilterFormRef.current?.submit();
          }}
          onFinish={async (params: any) => {
            setActionLoading(true);
            const res: CommonResp = await Query({
              ...params,
              page_size: 5000,
              sort_field: 'order',
              sort_type: 'desc',
            });
            setActionLoading(false);
            if (res.code === 0) {
              setTagGroups(res.data.items);
              if (res.data?.items[0]) {
                setMaxOrder(res.data.items[0]?.order);
              }
              if (res.data?.items.length >= 1 && res.data?.items[res.data?.items.length - 1]) {
                let min = res.data?.items[res.data?.items.length - 1];
                min = min - 1 >= 0 ? min - 1 : 0;
                setMinOrder(min);
              }
            } else {
              message.error('??????????????????');
              setTagGroups([]);
            }
          }}
        >
          <Form.Item label='????????????' name='ext_department_ids'>
            <DepartmentTreeSelect
              onChange={() => {
                queryFilterFormRef.current?.submit();
              }}
              options={allDepartments}
            />
          </Form.Item>

          <ProFormText width={'md'} name='name' label='??????' placeholder='??????????????????'/>

        </QueryFilter>
      </ProCard>

      <ProCard style={{marginTop: 12}} bodyStyle={{paddingTop: 0}} gutter={0}>
        <Spin spinning={actionLoading}>
          {(!tagGroups || tagGroups.length === 0) && <Empty style={{marginTop: 36, marginBottom: 36}}/>}
          {tagGroups && tagGroups.length > 0 && (
            <ReactSortable<any>
              handle={'.draggable-button'}
              className={styles.tagGroupList}
              list={tagGroups}
              setList={setTagGroups}
              swap={true}
              onEnd={async (e) => {
                // @ts-ignore
                const from = tagGroups[e.newIndex];
                // @ts-ignore
                const to = tagGroups[e.oldIndex];
                const res = await ExchangeOrder({id: from.id, exchange_order_id: to.id});
                if (res.code !== 0) {
                  message.error(res.message)
                }
              }}
            >
              {tagGroups.map((tagGroup) => (
                <Row className={styles.tagGroupItem} data-id={tagGroup.id} key={tagGroup.ext_id}>
                  <Col md={4} className={styles.tagName}>
                    <h4>{tagGroup.name}</h4>
                  </Col>
                  <Col md={16} className={styles.tagList}>
                    <Row>
                      ???????????????
                      {tagGroup.department_list && !tagGroup.department_list.includes(0) ? (
                        <Space direction={'horizontal'} wrap={true} style={{marginBottom: 6}}>
                          {tagGroup.department_list.map((id) => (
                            <div key={id}>
                            <span>
                              <FolderFilled
                                style={{
                                  color: '#47a7ff',
                                  fontSize: 20,
                                  marginRight: 6,
                                  verticalAlign: -6,
                                }}
                              />
                              {allDepartmentMap[id]?.name}
                            </span>
                            </div>
                          ))}
                        </Space>
                      ) : (
                        <span>??????????????????</span>
                      )}
                    </Row>
                    <Row style={{marginTop: 12}}>
                      <Space direction={'horizontal'} wrap={true}>
                        <Button
                          icon={<PlusOutlined/>}
                          onClick={() => {
                            setCurrentInputTagGroupExtID(tagGroup.ext_id);
                          }}
                        >
                          ??????
                        </Button>

                        {currentInputTagGroupExtID === tagGroup.ext_id && (
                          <Input
                            autoFocus={true}
                            disabled={inputLoading}
                            placeholder='???????????????????????????'
                            onBlur={() => setCurrentInputTagGroupExtID('')}
                            onPressEnter={async (e) => {
                              setInputLoading(true);
                              const res = await CreateTag({
                                names: e.currentTarget.value
                                  .replace('???', ',')
                                  .split(',')
                                  .filter((val) => val),
                                ext_tag_group_id: tagGroup.ext_id || '',
                              });
                              if (res.code === 0) {
                                setCurrentInputTagGroupExtID('');
                                tagGroup.tags?.unshift(...res.data);
                              } else {
                                message.error(res.message);
                              }
                              setInputLoading(false);
                            }}
                          />
                        )}
                        {tagGroup.tags?.map((tag) => (
                          <Tag className={styles.tagItem} key={tag.id}>
                            {tag.name}
                          </Tag>
                        ))}
                      </Space>
                    </Row>
                  </Col>
                  <Col md={4} className={styles.groupAction}>
                    <Tooltip title="?????????????????????" trigger={['click']}>
                      <Button
                        className={'draggable-button'}
                        icon={<DragOutlined
                          style={{cursor: 'grabbing'}}
                        />}
                        type={'text'}
                      >
                        ??????
                      </Button>
                    </Tooltip>

                    <Button
                      icon={<EditOutlined/>}
                      type={'text'}
                      onClick={() => {
                        setCurrentItem(tagGroup);
                        setEditModalVisible(true);
                      }}
                    >
                      ??????
                    </Button>
                    <Button
                      icon={<DeleteOutlined/>}
                      type={'text'}
                      onClick={() => {
                        Modal.confirm({
                          title: `??????????????????`,
                          content: `?????????????????????${tagGroup.name}????????????`,
                          okText: '??????',
                          okType: 'danger',
                          cancelText: '??????',
                          onOk() {
                            return HandleRequest({ext_ids: [tagGroup.ext_id]}, Delete, () => {
                              queryFilterFormRef.current?.submit();
                            });
                          },
                        });
                      }}
                    >
                      ??????
                    </Button>
                  </Col>
                </Row>
              ))}
            </ReactSortable>
          )}
        </Spin>
      </ProCard>

      <CreateModalForm
        // ????????????
        type={'create'}
        minOrder={minOrder}
        maxOrder={maxOrder}
        allDepartments={allDepartments}
        setVisible={setCreateModalVisible}
        initialValues={{tags: [{name: ''}], department_list: [0]}}
        visible={createModalVisible}
        onFinish={async (values) => {
          await HandleRequest(values, Create, () => {
            queryFilterFormRef.current?.submit();
            setCreateModalVisible(false);
          });
        }}
      />

      <CreateModalForm
        // ????????????
        type={'edit'}
        destroyOnClose={true}
        minOrder={minOrder}
        maxOrder={maxOrder}
        allDepartments={allDepartments}
        setVisible={setEditModalVisible}
        visible={editModalVisible}
        initialValues={currentItem}
        onFinish={async (values) => {
          await HandleRequest(values, Update, () => {
            queryFilterFormRef.current?.submit();
            setEditModalVisible(false);
          });
        }}
      />
    </PageContainer>
  );
};

export default CustomerTagGroupList;
