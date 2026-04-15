import { BaseEntity, BaseColumn, MyEntity, boolNumColumn } from 'src/common/entity/BaseEntity'
import { BoolNum } from 'src/common/type/base'

export enum MessageType {
  todo = 'todo',
  cc = 'cc',
}

export const messageTypeMap = {
  [MessageType.todo]: '待办',
  [MessageType.cc]: '待阅',
}

@MyEntity('sys_message')
export class Message extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ length: 100, comment: '消息标题' })
  title: string

  @BaseColumn({ type: 'text', comment: '消息内容' })
  content: string

  @BaseColumn({ length: 20, name: 'message_type', comment: '消息类型' })
  messageType: string

  @BaseColumn({ length: 50, nullable: true, name: 'source_type', comment: '来源类型' })
  sourceType: string

  @BaseColumn({ length: 50, nullable: true, name: 'source_id', comment: '来源ID' })
  sourceId: string

  @BaseColumn({ length: 50, name: 'receiver_id', comment: '接收人ID' })
  receiverId: string

  @BaseColumn({ length: 50, nullable: true, name: 'sender_id', comment: '发送人ID' })
  senderId: string

  @BaseColumn(boolNumColumn('已读', 'is_read', BoolNum.No))
  isRead: BoolNum

  @BaseColumn({ type: 'datetime', nullable: true, name: 'read_time', comment: '已读时间' })
  readTime: string

  @BaseColumn({ length: 20, default: 'system', name: 'channel', comment: '消息通道' })
  channel: string

  @BaseColumn({ length: 20, default: 'route', name: 'link_type', comment: '跳转类型' })
  linkType: string

  @BaseColumn({ length: 200, nullable: true, name: 'link_url', comment: '跳转地址' })
  linkUrl: string

  @BaseColumn({ type: 'json', nullable: true, name: 'link_params', comment: '跳转参数' })
  linkParams: Record<string, any>

  @BaseColumn({ type: 'json', nullable: true, name: 'extra_data', comment: '扩展数据' })
  extraData: Record<string, any>

  @BaseColumn(boolNumColumn('启用', 'is_active', BoolNum.Yes))
  isActive: BoolNum
}
