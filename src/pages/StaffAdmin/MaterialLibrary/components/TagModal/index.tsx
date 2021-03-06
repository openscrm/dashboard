import type {Dispatch, SetStateAction} from 'react';
import React, {useEffect, useState} from 'react';
import type {ModalProps} from 'antd';
import {message} from 'antd';
import {Button, Empty, Input, Row, Space, Tag, Modal} from 'antd';
import styles from "./index.less";
import {PlusOutlined, CloseOutlined} from "@ant-design/icons";
import {CreateMaterialLibraryTag, DeleteMaterialLibraryTag} from "../../service";
import {ModalForm} from "@ant-design/pro-form";

export type FormParams = {
  selected_tag_ids: string[];
};

export type TagModalProps = ModalProps & {
  isFilterComp?: boolean;
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  onFinish?: (selectedTags: MaterialTag.Item[]) => void;
  defaultCheckedTags?: () => MaterialTag.Item[];
  allTags: MaterialTag.Item[];
  setAllTags: Dispatch<SetStateAction<MaterialTag.Item[]>>
  isEditable?: boolean;
  reloadTags?: Dispatch<SetStateAction<number>>;
};

const TagModal: React.FC<TagModalProps> = (props) => {
  const {
    visible,
    setVisible,
    onFinish,
    allTags,
    setAllTags,
    defaultCheckedTags,
    isEditable,
    reloadTags,
    isFilterComp,
    ...rest
  } = props;
  const [creatButtonClick, setCreateButtonClick] = useState(false)
  const [inputLoading, setInputLoading] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<MaterialTag.Item[]>(defaultCheckedTags || []);
  const [deleteTag, setDeleteTag] = useState<MaterialTag.Item>({} as MaterialTag.Item)
  const [tags, setTags] = useState<MaterialTag.Item[]>([])

  useEffect(() => {
    setSelectedTags(defaultCheckedTags || []);
    setKeyword('');
  }, [defaultCheckedTags, visible]);

  useEffect(() => {
    const filteredTags = allTags.filter((tag) => {
      if (keyword.trim() === '') {
        return true;
      }

      if (tag.name?.includes(keyword)) {
        return true;
      }
      return false;

    });
    setTags(filteredTags || []);
  }, [allTags, keyword])

  return (
    <ModalForm
      {...rest}
      key={'manageModal'}
      width={props?.width || 500}
      className={'dialog from-item-label-100w'}
      visible={visible}
      layout={'horizontal'}
      onVisibleChange={setVisible}
      submitter={{
        submitButtonProps: {
          disabled: selectedTags.length === 0,
          style: {display: isEditable ? 'none' : 'block'}
        }
      }}
      onFinish={async (values: FormParams) => {
        const params = {...values};
        // @ts-ignore
        params.selected_tag_ids = selectedTags.map((tag) => tag.id) || [];
        if (onFinish) {
          onFinish(selectedTags);
          setVisible(false);
        }
      }}
    >
      <h2 className="dialog-title"> {isEditable ? '??????????????????' : '??????????????????'} </h2>
      <Row>
        <Input
          allowClear={true}
          placeholder={'???????????????????????????????????????'}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.currentTarget.value)
          }}
        />
      </Row>
      <div className={styles.tagList}>
        <Row>
          <Space direction={'horizontal'} wrap={true}>
            <Button
              size="middle"
              icon={<PlusOutlined/>}
              onClick={() => {
                setCreateButtonClick(true)
              }}
            >
              ??????
            </Button>
            {
              creatButtonClick && (
                <Input
                  size="middle"
                  width={'100px'}
                  autoFocus={true}
                  disabled={inputLoading}
                  placeholder='???????????????????????????'
                  onBlur={() => setCreateButtonClick(false)}
                  onPressEnter={async (e) => {
                    setCreateButtonClick(false)
                    setInputLoading(true);
                    const res = await CreateMaterialLibraryTag({
                      names: e.currentTarget.value
                        .replace('???', ',')
                        .split(',')
                        .filter((val) => val),
                    });
                    if (res.code === 0) {
                      reloadTags?.(Date.now)
                    } else {
                      message.error(res.message);
                    }
                    setInputLoading(false);
                  }}
                />
              )
            }
            {tags?.map((tag) => {
              const isSelected = selectedTags?.map((selectedTag) => selectedTag?.id)?.includes(tag?.id);
              return (
                <Space direction={'horizontal'} wrap={true}>
                  <Tag
                    className={`tag-item ${isSelected ? ' selected-tag-item' : ''}`}
                    style={{
                      cursor: isEditable ? 'default' : 'pointer'
                    }}
                    key={tag.id}
                    onClick={() => {
                      if (!isEditable) {
                        if (isSelected) {
                          // ????????????
                          setSelectedTags(selectedTags.filter((selectedTag) => {
                            return selectedTag.id !== tag?.id
                          }))
                        } else {
                          // ??????
                          setSelectedTags([...selectedTags, tag])
                        }
                      }
                    }}
                  >
                    {tag.name}
                    {isEditable ? <span>
                      &nbsp;&nbsp;
                      <CloseOutlined
                        style={{fontSize: '12px', cursor: 'pointer'}}
                        onClick={() => {
                          if (!tag?.id) {
                            return;
                          }
                          if (isEditable) {
                            // ????????????
                            setDeleteTag(tag)
                          }
                        }}
                      />

                    </span> : null}
                  </Tag>
                </Space>
              )
            })}
          </Space>
        </Row>
        {tags?.length === 0 && <Empty style={{marginTop: 36, marginBottom: 36}} image={Empty.PRESENTED_IMAGE_SIMPLE}/>}
      </div>
      <Modal
        key={'confirmModal'}
        visible={!!(deleteTag as MaterialTag.Item).id}
        onOk={() => {
          DeleteMaterialLibraryTag({ids: [deleteTag.id]}).then(res => {
            if (res?.code === 0) {
              message.success('????????????????????????')
              reloadTags?.(Date.now)
            } else {
              message.error('????????????')
            }
            setDeleteTag({} as MaterialTag.Item)
          })
        }}
        onCancel={() => {
          setDeleteTag({} as MaterialTag.Item)
        }}
      >
        <h3>??????</h3>
        <h4>???????????????{(deleteTag as MaterialTag.Item).name}????????????????????????????????????????????????</h4>
      </Modal>
    </ModalForm>

  );
};

export default TagModal;
