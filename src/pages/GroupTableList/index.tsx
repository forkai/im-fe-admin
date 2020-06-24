import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Dropdown, Menu, message, Modal } from 'antd';
import React, { useState, useRef } from 'react';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import ProTable, { ProColumns, ActionType } from '@ant-design/pro-table';
import { SorterResult } from 'antd/es/table/interface';

import CreateForm from './components/CreateForm';
import UpdateForm, { FormValueType } from './components/UpdateForm';
import { TableListItem } from './data';
import { queryRule, updateRule, addRule, removeRule, disabledGroup, muteGroup } from './service';

/**
 * 添加节点
 * @param fields
 */
const handleAdd = async (fields: TableListItem) => {
  const hide = message.loading('正在添加');
  try {
    await addRule({ ...fields });
    hide();
    message.success('添加成功');
    return true;
  } catch (error) {
    hide();
    message.error('添加失败请重试！');
    return false;
  }
};

/**
 * 更新节点
 * @param fields
 */
const handleUpdate = async (fields: FormValueType) => {
  const hide = message.loading('正在配置');
  try {
    await updateRule({
      name: fields.name,
      desc: fields.desc,
      key: fields.key,
    });
    hide();

    message.success('配置成功');
    return true;
  } catch (error) {
    hide();
    message.error('配置失败请重试！');
    return false;
  }
};

/**
 *  删除节点
 * @param selectedRows
 */
const handleRemove = async (selectedRows: TableListItem[]) => {
  const hide = message.loading('正在删除');
  if (!selectedRows) return true;
  try {
    await removeRule({
      key: selectedRows.map((row) => row.key),
    });
    hide();
    message.success('删除成功，即将刷新');
    return true;
  } catch (error) {
    hide();
    message.error('删除失败，请重试');
    return false;
  }
};

/**
 *
 * 禁言群组
 * @param currentItem
 */
const editAndDelete = (key: string, status: boolean, record: any, actionRef: any) => {
  const title = key === 'disabled' ? '封禁状态' : '禁言状态';
  let content = key === 'disabled' ? '封禁' : '禁言';
  content = (status ? '' : '解除') + content;

  Modal.confirm({
    title,
    content: `确定${content}该群组吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      const hide = message.loading('正在处理');
      try {
        if (key === 'disabled') {
          console.log({
            disabled: status,
            id: record.id,
          });

          await disabledGroup({
            disabled: status,
            id: record.id,
          });
        } else {
          await muteGroup({
            mute: status,
            id: record.id,
          });
        }
        hide();
        message.success('成功，即将刷新');
        if (actionRef.current) {
          actionRef.current.reloadAndRest();
        }
        return true;
      } catch (error) {
        hide();
        message.error('失败，请重试');
        return false;
      }
    },
  });
};

const TableList: React.FC<{}> = () => {
  const [sorter, setSorter] = useState<string>('');
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [updateModalVisible, handleUpdateModalVisible] = useState<boolean>(false);
  const [stepFormValues, setStepFormValues] = useState({});
  const actionRef = useRef<ActionType>();
  const columns: ProColumns<TableListItem>[] = [
    {
      title: '群组名称',
      dataIndex: 'name',
      rules: [
        {
          required: true,
          message: '规则名称为必填项',
        },
      ],
    },
    {
      title: '描述',
      dataIndex: 'introduction',
      valueType: 'textarea',
    },
    {
      title: '状态',
      dataIndex: 'disabled',
      hideInForm: true,
      filters: [],
      valueEnum: {
        false: { text: '未封禁', status: 'Success' },
        true: { text: '已封禁', status: 'Error' },
      },
    },
    {
      title: '禁言状态',
      dataIndex: 'mute',
      hideInForm: true,
      filters: [],
      valueEnum: {
        false: { text: '未禁言', status: 'Success', filter: undefined },
        true: { text: '已禁言', status: 'Error' },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'updatedAt',
      sorter: true,
      valueType: 'dateTime',
      hideInForm: true,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => {
        const DisA: React.FC<{}> = () => {
          return record.disabled ? (
            <a
              onClick={() => {
                editAndDelete('disabled', false, record, actionRef);
              }}
            >
              解除封禁
            </a>
          ) : (
            <a
              onClick={() => {
                editAndDelete('disabled', true, record, actionRef);
              }}
            >
              封禁
            </a>
          );
        };

        const MuseA: React.FC<{}> = () => {
          return record.mute ? (
            <a
              onClick={() => {
                editAndDelete('mute', false, record, actionRef);
              }}
            >
              解除禁言
            </a>
          ) : (
            <a
              onClick={() => {
                editAndDelete('mute', true, record, actionRef);
              }}
            >
              禁言
            </a>
          );
        };

        return (
          <>
            <DisA />
            <Divider type="vertical" />
            <MuseA />
          </>
        );
      },
    },
  ];

  return (
    <PageHeaderWrapper>
      <ProTable<TableListItem>
        headerTitle="查询表格"
        actionRef={actionRef}
        rowKey="id"
        onChange={(_, _filter, _sorter) => {
          const sorterResult = _sorter as SorterResult<TableListItem>;
          if (sorterResult.field) {
            setSorter(`${sorterResult.field}_${sorterResult.order}`);
          }
        }}
        params={{
          sorter,
        }}
        toolBarRender={(action, { selectedRows }) => [
          <Button type="primary" onClick={() => handleModalVisible(true)}>
            <PlusOutlined /> 新建
          </Button>,
          selectedRows && selectedRows.length > 0 && (
            <Dropdown
              overlay={
                <Menu
                  onClick={async (e) => {
                    if (e.key === 'remove') {
                      await handleRemove(selectedRows);
                      action.reload();
                    }
                  }}
                  selectedKeys={[]}
                >
                  <Menu.Item key="remove">批量删除</Menu.Item>
                  <Menu.Item key="approval">批量审批</Menu.Item>
                </Menu>
              }
            >
              <Button>
                批量操作 <DownOutlined />
              </Button>
            </Dropdown>
          ),
        ]}
        tableAlertRender={({ selectedRowKeys, selectedRows }) => (
          <div>
            已选择 <a style={{ fontWeight: 600 }}>{selectedRowKeys.length}</a> 项&nbsp;&nbsp;
            <span>
              服务调用次数总计 {selectedRows.reduce((pre, item) => pre + item.callNo, 0)} 万
            </span>
          </div>
        )}
        request={(params, sort) => queryRule(params, sort)}
        columns={columns}
        rowSelection={false}
        search={false}
      />
      <CreateForm onCancel={() => handleModalVisible(false)} modalVisible={createModalVisible}>
        <ProTable<TableListItem, TableListItem>
          onSubmit={async (value) => {
            const success = await handleAdd(value);
            if (success) {
              handleModalVisible(false);
              if (actionRef.current) {
                actionRef.current.reload();
              }
            }
          }}
          rowKey="key"
          type="form"
          columns={columns}
          rowSelection={{}}
        />
      </CreateForm>
      {stepFormValues && Object.keys(stepFormValues).length ? (
        <UpdateForm
          onSubmit={async (value) => {
            const success = await handleUpdate(value);
            if (success) {
              handleUpdateModalVisible(false);
              setStepFormValues({});
              if (actionRef.current) {
                actionRef.current.reload();
              }
            }
          }}
          onCancel={() => {
            handleUpdateModalVisible(false);
            setStepFormValues({});
          }}
          updateModalVisible={updateModalVisible}
          values={stepFormValues}
        />
      ) : null}
    </PageHeaderWrapper>
  );
};

export default TableList;