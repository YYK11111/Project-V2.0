# 基于Nest-Admin开发项目管理系统 完整设计方案

本方案基于Nest-Admin开源框架进行二次开发，完全遵循NestJS + Vue3 + TypeScript技术栈，保留框架原生的权限体系、基础组件和部署能力，仅增量开发项目管理相关业务模块，实现“不重复造轮子、完全可控、可长期维护”的企业级项目管理系统，适配各类团队（研发、产品、运营等）的项目协作需求。

# 一、方案总则

## 1.1 设计目标

- 复用Nest-Admin框架底座，快速搭建项目管理核心业务，缩短开发周期（2~2.5周完成可用版）；

- 实现项目、任务、工单、文档等核心模块的全流程管理，支持多人协作、权限分级、进度可视化；

- 保持框架原有的代码规范和架构设计，确保系统可扩展、可维护、可交接；

- 适配企业内部部署需求，支持Docker一键部署，兼容MySQL、Redis等主流组件；

- 复用框架自带的通知、文件上传、操作日志等能力，降低二次开发成本。

## 1.2 技术栈确认（完全匹配框架+需求）

|模块|技术选型|说明|
|---|---|---|
|后端框架|NestJS 10+、TypeScript|复用Nest-Admin原生框架，遵循其分层架构，无需额外引入核心依赖|
|ORM|TypeORM（Nest-Admin原生）|框架自带ORM工具，用于数据库建模、迁移和数据操作，替代原方案的Prisma，贴合Nest-Admin原生规范|
|数据库|MySQL 8.0+（支持PostgreSQL，适配Nest-Admin多数据库特性）|复用框架数据库配置，新增业务表，不改动原有系统表，支持多数据库切换|
|缓存|Redis|复用框架缓存配置，用于登录态、任务缓存、限流等，无需额外配置|
|前端框架|Vue3 + Vite + Element Plus（支持React，适配Nest-Admin多前端特性）|复用框架前端组件、路由、权限控制，新增业务页面，可根据需求切换前端框架|
|状态管理|Pinia（Vue3）/ Redux（React）|框架原生支持，用于管理前端全局状态（如当前项目、任务筛选条件）|
|实时通知|WebSocket|框架自带，用于任务指派、逾期提醒等实时消息推送，无需额外开发|
|部署|Docker + Docker Compose、CI/CD|复用框架部署脚本，支持一键启动、持续集成，适配生产环境部署需求|
## 1.3 框架基础信息

- 框架地址：Gitee https://gitee.com/hixinla/nest-admin （官方开源地址，社区活跃、2026年持续更新）

- 开源协议：MIT（可商用、可二次开发，无版权限制，企业内部使用无风险）

- 核心底座：用户管理、角色权限（RBAC）、菜单管理、数据权限、操作日志、文件上传、字典管理、定时任务、WebSocket通知、部门管理、表单引擎、接口管理

- 开发规范：遵循NestJS分层架构（Controller/Service/Repository）、TS类型约束、前端组件化开发，工程化能力完善

# 二、系统架构设计

## 2.1 整体架构（基于Nest-Admin原生架构，增量扩展）

整体采用前后端分离架构，复用Nest-Admin的请求链路和组件，仅新增业务模块的分层实现，架构如下：

```plain text
前端（Vue3/React，可切换）
    ↓↑（HTTP/WS）
Nginx（反向代理、静态资源，框架原生配置）
    ↓↑
后端（NestJS，Nest-Admin核心）
    ├─ 框架原生模块（用户、权限、菜单、日志、部门、字典等）
    └─ 新增项目管理业务模块（项目、任务、工单等）
        ↓↑
Redis（缓存、登录态、实时通知，框架原生配置）
    ↓↑
数据库（MySQL/PostgreSQL，框架系统表 + 新增业务表）
```

## 2.2 后端分层架构（复用Nest-Admin规范，新增业务分层）

完全遵循Nest-Admin的分层设计，新增业务模块均按照以下分层开发，确保代码规范统一，与框架原生代码无缝衔接：

1. Controller层：接收前端请求，参数校验，返回统一响应（复用框架的响应拦截器、异常处理）；

2. Service层：核心业务逻辑实现，调用Repository层操作数据，处理事务，复用框架的事务封装；

3. Repository层：数据访问层，基于TypeORM实现CRUD操作，复用框架的数据库封装、分页工具；

4. Entity层：TypeORM实体类，定义业务表结构和关联关系，与Nest-Admin原生实体类规范一致；

5. Common层：复用框架的工具类、异常处理、权限装饰器、分页封装、全局常量等；

6. Module层：每个业务模块独立封装为NestJS模块，注册到根模块，实现模块解耦，遵循Nest-Admin模块化规范。

## 2.3 前端架构（复用Nest-Admin基础，新增业务页面）

复用Nest-Admin的布局、路由、权限控制、组件库，仅新增项目管理相关页面和组件，保持与框架一致的UI风格和交互逻辑，支持Vue3/React切换，以下以Vue3为例：

1. 布局层：复用框架的侧边栏、头部导航、面包屑、布局模板，仅新增业务菜单；

2. 路由层：复用框架的动态路由（基于角色权限），新增业务路由，配置权限关联，适配框架路由守卫；

3. 组件层：复用框架的Curd组件、表格、弹窗、表单、文件上传等，新增看板、甘特图等业务组件；

4. 状态层：复用Pinia，新增业务状态（如任务看板状态、项目筛选条件），与框架状态管理规范一致；

5. 请求层：复用框架的Axios封装（请求拦截、响应拦截、异常提示），新增业务接口请求函数；

6. 权限层：复用框架的按钮权限、页面权限指令，配置业务模块的权限规则，与框架权限体系无缝衔接。

# 三、数据库设计（增量新增，不改动框架原有表）

基于Nest-Admin现有的数据库（MySQL/PostgreSQL），新增6张核心业务表，通过TypeORM实体类定义，执行数据库迁移命令即可生成表结构，与框架原有系统表（sys_user、sys_role、sys_menu等）关联，不改动任何原有表结构，贴合Nest-Admin数据库规范。

## 3.1 TypeORM实体类完整定义（可直接复制使用，贴合Nest-Admin规范）

```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SysUser } from '../../sys/entity/sys-user.entity'; // 复用Nest-Admin原生用户实体

// 项目表
@Entity('project')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, comment: '项目名称', unique: true })
  name: string;

  @Column({ type: 'varchar', length: 50, comment: '项目编号，规则：PROJ-{YYYYMMDD}-001', unique: true })
  code: string;

  @Column({ type: 'varchar', length: 36, comment: '项目负责人（关联sys_user.id）' })
  leaderId: string;

  @Column({ type: 'datetime', comment: '开始时间' })
  startDate: Date;

  @Column({ type: 'datetime', comment: '结束时间' })
  endDate: Date;

  @Column({ type: 'int', comment: '项目状态：1-未开始，2-进行中，3-已完成，4-已暂停，5-已取消' })
  status: number;

  @Column({ type: 'int', comment: '优先级：1-低，2-中，3-高' })
  priority: number;

  @Column({ type: 'text', comment: '项目描述', nullable: true })
  description: string;

  @Column({ type: 'json', comment: '项目附件（存储文件路径数组）', nullable: true })
  attachments: string[];

  @Column({ type: 'boolean', comment: '是否归档', default: false })
  isArchived: boolean;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系：项目负责人（关联Nest-Admin原生用户表）
  @ManyToOne(() => SysUser, (user) => user.projects, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'leaderId' })
  leader: SysUser;

  // 关联项目成员
  @OneToMany(() => ProjectMember, (member) => member.project, { cascade: true, onDelete: 'CASCADE' })
  members: ProjectMember[];

  // 关联任务
  @OneToMany(() => Task, (task) => task.project, { cascade: true, onDelete: 'CASCADE' })
  tasks: Task[];

  // 关联工单
  @OneToMany(() => Ticket, (ticket) => ticket.project, { cascade: true, onDelete: 'CASCADE' })
  tickets: Ticket[];

  // 关联文档
  @OneToMany(() => Document, (document) => document.project, { cascade: true, onDelete: 'CASCADE' })
  documents: Document[];
}

// 项目成员表（项目与用户的关联表）
@Entity('project_member')
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, comment: '项目ID' })
  projectId: string;

  @Column({ type: 'varchar', length: 36, comment: '用户ID（关联sys_user.id）' })
  userId: string;

  @Column({ type: 'int', comment: '成员角色：1-项目经理，2-普通成员，3-访客' })
  role: number;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => SysUser, (user) => user.projectMembers, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: SysUser;

  // 联合唯一：一个用户在一个项目中只能有一个角色
  @Column({ type: 'varchar', length: 100, unique: true, select: false })
  projectIdUserId: string;

  // 插入前自动生成联合唯一字段
  beforeInsert() {
    this.projectIdUserId = `${this.projectId}_${this.userId}`;
  }
}

// 任务表（支持父子任务）
@Entity('task')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, comment: '所属项目ID' })
  projectId: string;

  @Column({ type: 'varchar', length: 100, comment: '任务名称' })
  name: string;

  @Column({ type: 'varchar', length: 50, comment: '任务编号：TASK-{00001}', unique: true })
  code: string;

  @Column({ type: 'varchar', length: 36, comment: '负责人（关联sys_user.id）' })
  leaderId: string;

  @Column({ type: 'varchar', length: 1000, comment: '经办人（关联sys_user.id数组，支持多人）' })
  executorIds: string; // 存储JSON字符串，前端转换为数组

  @Column({ type: 'varchar', length: 36, comment: '父任务id（关联自身，实现子任务）', nullable: true })
  parentId: string;

  @Column({ type: 'datetime', comment: '开始时间' })
  startDate: Date;

  @Column({ type: 'datetime', comment: '截止时间' })
  endDate: Date;

  @Column({ type: 'int', comment: '任务状态：1-待处理，2-处理中，3-已完成，4-已驳回，5-暂缓' })
  status: number;

  @Column({ type: 'int', comment: '优先级：1-低，2-中，3-高' })
  priority: number;

  @Column({ type: 'int', comment: '进度（0-100）', default: 0 })
  progress: number;

  @Column({ type: 'text', comment: '任务描述', nullable: true })
  description: string;

  @Column({ type: 'json', comment: '任务附件', nullable: true })
  attachments: string[];

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => SysUser, (user) => user.taskLeaders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'leaderId' })
  leader: SysUser;

  // 自关联：父子任务
  @ManyToOne(() => Task, (task) => task.children, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: Task;

  @OneToMany(() => Task, (task) => task.parent, { cascade: true })
  children: Task[];

  // 关联任务评论
  @OneToMany(() => TaskComment, (comment) => comment.task, { cascade: true, onDelete: 'CASCADE' })
  comments: TaskComment[];
}

// 任务评论表
@Entity('task_comment')
export class TaskComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, comment: '任务ID' })
  taskId: string;

  @Column({ type: 'varchar', length: 36, comment: '评论人ID（关联sys_user.id）' })
  userId: string;

  @Column({ type: 'text', comment: '评论内容' })
  content: string;

  @Column({ type: 'json', comment: '评论附件', nullable: true })
  attachments: string[];

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Task, (task) => task.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => SysUser, (user) => user.taskComments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: SysUser;
}

// 工单/缺陷表
@Entity('ticket')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, comment: '所属项目ID' })
  projectId: string;

  @Column({ type: 'varchar', length: 36, comment: '所属任务ID（可选）', nullable: true })
  taskId: string;

  @Column({ type: 'varchar', length: 100, comment: '工单标题' })
  title: string;

  @Column({ type: 'int', comment: '工单类型：1-缺陷，2-需求，3-反馈' })
  type: number;

  @Column({ type: 'varchar', length: 36, comment: '提交人ID（关联sys_user.id）' })
  submitterId: string;

  @Column({ type: 'varchar', length: 36, comment: '处理人ID（关联sys_user.id）', nullable: true })
  handlerId: string;

  @Column({ type: 'int', comment: '状态：1-待处理，2-处理中，3-已解决，4-已关闭' })
  status: number;

  @Column({ type: 'text', comment: '工单内容' })
  content: string;

  @Column({ type: 'json', comment: '工单附件', nullable: true })
  attachments: string[];

  @Column({ type: 'text', comment: '解决方案（处理完成后填写）', nullable: true })
  solution: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Project, (project) => project.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => Task, (task) => task.tickets, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => SysUser, (user) => user.tickets, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'submitterId' })
  submitter: SysUser;

  @ManyToOne(() => SysUser, (user) => user.handledTickets, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'handlerId' })
  handler: SysUser;
}

// 项目文档表
@Entity('document')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, comment: '所属项目ID' })
  projectId: string;

  @Column({ type: 'varchar', length: 100, comment: '文档名称' })
  name: string;

  @Column({ type: 'int', comment: '文档类型：1-富文本，2-文件' })
  type: number;

  @Column({ type: 'text', comment: '富文本内容（type=1时使用）', nullable: true })
  content: string;

  @Column({ type: 'varchar', length: 255, comment: '文件路径（type=2时使用）', nullable: true })
  fileUrl: string;

  @Column({ type: 'int', comment: '文件大小（KB）', nullable: true })
  fileSize: number;

  @Column({ type: 'varchar', length: 20, comment: '版本号', default: '1.0.0' })
  version: string;

  @Column({ type: 'varchar', length: 36, comment: '上传人ID（关联sys_user.id）' })
  uploaderId: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Project, (project) => project.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => SysUser, (user) => user.documents, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploaderId' })
  uploader: SysUser;
}

// 关联Nest-Admin原生用户表（无需修改，仅扩展关联关系）
import { SysUser } from '../../sys/entity/sys-user.entity';
// 扩展SysUser实体的关联关系（在Nest-Admin原有实体基础上新增，不修改原文件）
declare module '../../sys/entity/sys-user.entity' {
  interface SysUser {
    // 项目负责人关联
    projects: Project[];
    // 项目成员关联
    projectMembers: ProjectMember[];
    // 任务负责人关联
    taskLeaders: Task[];
    // 任务评论关联
    taskComments: TaskComment[];
    // 工单提交人关联
    tickets: Ticket[];
    // 工单处理人关联
    handledTickets: Ticket[];
    // 文档上传人关联
    documents: Document[];
  }
}
```

## 3.2 表关系说明

- 用户（SysUser）与项目（Project）：一对多，一个用户可作为多个项目的负责人；

- 项目（Project）与项目成员（ProjectMember）：一对多，一个项目可拥有多个成员，一个用户可加入多个项目；

- 项目（Project）与任务（Task）：一对多，一个项目包含多个任务；

- 任务（Task）与自身：自关联，支持父子任务层级；

- 任务（Task）与任务评论（TaskComment）：一对多，一个任务可有多条评论；

- 项目（Project）与工单（Ticket）：一对多，一个项目可包含多个工单；

- 任务（Task）与工单（Ticket）：一对多，一个任务可关联多个工单（可选）；

- 项目（Project）与文档（Document）：一对多，一个项目可包含多个文档。

## 3.3 字典配置（复用Nest-Admin字典功能）

无需新增字典表，复用Nest-Admin的sys_dict字典表，新增以下字典项，用于业务状态、优先级等统一管理，适配框架字典管理规范：

|字典类型|字典编码|字典值|说明|
|---|---|---|---|
|project_status|项目状态|1-未开始，2-进行中，3-已完成，4-已暂停，5-已取消|项目模块状态管理，与框架字典规范一致|
|project_priority|项目优先级|1-低，2-中，3-高|项目优先级区分|
|task_status|任务状态|1-待处理，2-处理中，3-已完成，4-已驳回，5-暂缓|任务模块状态管理|
|task_priority|任务优先级|1-低，2-中，3-高|任务优先级区分|
|ticket_type|工单类型|1-缺陷，2-需求，3-反馈|工单模块类型管理|
|ticket_status|工单状态|1-待处理，2-处理中，3-已解决，4-已关闭|工单模块状态管理|
|project_member_role|项目成员角色|1-项目经理，2-普通成员，3-访客|项目成员权限区分，适配Nest-Admin权限体系|
|document_type|文档类型|1-富文本，2-文件|文档模块类型管理|
# 四、后端开发设计（增量开发，复用Nest-Admin能力）

后端开发遵循Nest-Admin的模块设计规范，新增6个业务模块，每个模块独立封装，注册到根模块，复用框架的权限装饰器、异常处理、分页、文件上传、事务封装等能力，无需重复开发，贴合Nest-Admin原生开发规范。

## 4.1 后端目录结构（新增业务模块标注★）

```plain text
src/
├── app.module.ts                // 根模块，注册所有新增业务模块，复用Nest-Admin根模块配置
├── common/                      // 框架原生通用模块（复用，不修改）
│   ├── decorators/              // 权限、分页等装饰器（复用，如@RequiresPermissions）
│   ├── filters/                 // 异常过滤器（复用，统一处理业务异常）
│   ├── guards/                  // 权限守卫（复用，如JwtAuthGuard、RolesGuard）
│   ├── interceptors/            // 响应拦截器（复用，统一响应格式）
│   ├── pipes/                   // 参数校验管道（复用，如ValidationPipe）
│   └── utils/                   // 工具类（复用，如分页工具、日期工具）
├── config/                      // 框架原生配置（复用，可新增业务配置）
├── modules/                     // 模块目录
│   ├── sys/                     // 框架原生系统模块（用户、角色、菜单等，不修改）
│   ├── project/                 // ★ 项目管理模块（独立封装，遵循Nest-Admin模块规范）
│   ├── project-member/          // ★ 项目成员模块
│   ├── task/                    // ★ 任务管理模块（核心业务模块）
│   ├── task-comment/            // ★ 任务评论模块
│   ├── ticket/                  // ★ 工单管理模块
│   └── document/                // ★ 文档管理模块
├── shared/                      // 框架原生共享模块（复用，如数据库模块、缓存模块）
└── main.ts                      // 入口文件（复用，无需修改，框架自动加载所有模块）
```

## 4.2 新增业务模块详细设计（每个模块统一结构，贴合Nest-Admin规范）

每个新增业务模块均包含Controller、Service、Repository、DTO、Entity、Module，结构统一，与Nest-Admin原生模块规范一致，以下以核心的任务管理模块（task）为例，其他模块结构类似，仅业务逻辑不同。

### 4.2.1 任务管理模块（task）

1. task.module.ts（模块注册，贴合Nest-Admin模块化规范）
        `import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskRepository } from './task.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entity/task.entity';
// 复用Nest-Admin系统模块和共享模块
import { SysModule } from '../sys/sys.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]), // 注册任务实体，贴合Nest-Admin数据库模块规范
    SysModule, // 引入系统模块（用户、权限等）
    SharedModule // 引入共享模块（缓存、文件上传等）
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskRepository],
  exports: [TaskService] // 供其他模块调用（如工单模块关联任务）
})
export class TaskModule {}`

2. DTO（数据传输对象，参数校验，复用Nest-Admin校验规范）
        `// task.create.dto.ts（创建任务）
import { IsString, IsNotEmpty, IsDateString, IsInt, IsOptional, ArrayMinSize, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseDTO } from '../../common/dto/base.dto'; // 复用Nest-Admin基础DTO

export class CreateTaskDto extends BaseDTO {
  @ApiProperty({ description: '项目ID', required: true })
  @IsString()
  @IsNotEmpty({ message: '项目ID不能为空' })
  projectId: string;

  @ApiProperty({ description: '任务名称', required: true })
  @IsString()
  @IsNotEmpty({ message: '任务名称不能为空' })
  name: string;

  @ApiProperty({ description: '负责人ID', required: true })
  @IsString()
  @IsNotEmpty({ message: '负责人ID不能为空' })
  leaderId: string;

  @ApiProperty({ description: '经办人ID数组', required: true, type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: '至少选择一个经办人' })
  executorIds: string[];

  @ApiProperty({ description: '父任务ID（可选）' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ description: '开始时间', required: true })
  @IsDateString({}, { message: '开始时间格式不正确' })
  startDate: string;

  @ApiProperty({ description: '截止时间', required: true })
  @IsDateString({}, { message: '截止时间格式不正确' })
  endDate: string;

  @ApiProperty({ description: '任务状态（1-待处理，2-处理中...）', required: true })
  @IsInt({ message: '状态必须为数字' })
  status: number;

  @ApiProperty({ description: '优先级（1-低，2-中，3-高）', required: true })
  @IsInt({ message: '优先级必须为数字' })
  priority: number;

  @ApiProperty({ description: '任务描述（可选）' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '任务附件（可选，文件路径数组）' })
  @IsOptional()
  attachments?: string[];
}

// 其他DTO：UpdateTaskDto（编辑任务）、TaskQueryDto（分页查询）等，均继承BaseDTO，结构类似，按需添加校验规则`

3. Repository层（数据访问，基于TypeORM，贴合Nest-Admin数据访问规范）
        `import { Injectable, Inject } from '@nestjs/common';
import { Repository, Like } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entity/task.entity';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto';
import { PaginationResult, PaginationUtil } from '../../common/utils/pagination.util'; // 复用Nest-Admin分页工具

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly paginationUtil: PaginationUtil, // 复用框架分页工具
  ) {}

  // 分页查询任务（复用框架分页工具，贴合Nest-Admin分页规范）
  async findAll(query: TaskQueryDto): Promise<PaginationResult> {
    const { page, size, projectId, status, leaderId, keyword } = query;
    // 构建查询条件
    const where = {
      projectId,
      status,
      leaderId,
      name: keyword ? Like(`%${keyword}%`) : undefined,
    };
    // 调用框架分页工具，实现分页查询
    return this.paginationUtil.paginate(
      this.taskRepository,
      { page, size },
      {
        where,
        relations: ['leader'], // 关联查询负责人信息
        order: { updatedAt: 'DESC' },
      },
    );
  }

  // 根据ID查询任务（含子任务、评论）
  async findById(id: string) {
    return this.taskRepository.findOne({
      where: { id },
      relations: [
        'leader',
        'children', // 子任务
        'comments',
        'comments.user' // 评论人信息
      ],
    });
  }

  // 创建任务
  async create(data: CreateTaskDto) {
    // 生成任务编号：TASK-00001（自增，贴合业务规范）
    const count = await this.taskRepository.count();
    const code = `TASK-${(count + 1).toString().padStart(5, '0')}`;
    // 转换经办人数组为字符串（适配数据库存储）
    const executorIds = JSON.stringify(data.executorIds);
    const task = this.taskRepository.create({ ...data, code, executorIds });
    return this.taskRepository.save(task);
  }

  // 编辑任务
  async update(id: string, data: UpdateTaskDto) {
    // 若修改经办人，转换为字符串
    if (data.executorIds) {
      data.executorIds = JSON.stringify(data.executorIds);
    }
    await this.taskRepository.update(id, data);
    return this.findById(id);
  }

  // 删除任务（级联删除子任务和评论）
  async delete(id: string) {
    return this.taskRepository.delete(id);
  }

  // 其他方法：更新任务进度、查询子任务、根据项目ID查询任务等，按需添加
  async updateProgress(id: string, progress: number) {
    await this.taskRepository.update(id, { progress });
    return this.findById(id);
  }
}
`

4. Service层（业务逻辑，复用Nest-Admin工具和服务）
`import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TaskRepository } from './task.repository';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto';
import { PaginationResult } from '../../common/utils/pagination.util';
import { SysUserService } from '../sys/service/sys-user.service'; // 复用Nest-Admin用户服务
import { MessageService } from '../sys/service/message.service'; // 复用Nest-Admin通知服务
import { ProjectMemberRepository } from '../project-member/project-member.repository'; // 项目成员Repository

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userService: SysUserService,
    private readonly messageService: MessageService,
    private readonly projectMemberRepository: ProjectMemberRepository,
  ) {}

  // 分页查询任务（权限校验：只能查询自己参与的项目的任务，贴合Nest-Admin权限规范）
  async findAll(query: TaskQueryDto, userId: string): Promise<PaginationResult> {
    // 1. 校验用户是否有权限查看该项目的任务（复用项目成员权限逻辑）
    const hasPermission = await this.checkTaskPermission(query.projectId, userId);
    if (!hasPermission) {
      throw new ForbiddenException('无权限查看该项目的任务');
    }
    // 2. 查询任务
    return this.taskRepository.findAll(query);
  }

  // 根据ID查询任务（权限校验）
  async findById(id: string, userId: string) {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    // 权限校验
    const hasPermission = await this.checkTaskPermission(task.projectId, userId);
    if (!hasPermission) {
      throw new ForbiddenException('无权限查看该任务');
    }
    // 转换经办人字符串为数组，返回给前端
    task.executorIds = JSON.parse(task.executorIds);
    return task;
  }

  // 创建任务（权限校验：只能在自己参与的项目中创建任务）
  async create(data: CreateTaskDto, userId: string) {
    // 1. 权限校验
    const hasPermission = await this.checkTaskPermission(data.projectId, userId);
    if (!hasPermission) {
      throw new ForbiddenException('无权限在该项目中创建任务');
    }
    // 2. 校验负责人和经办人是否存在（复用Nest-Admin用户服务）
    await this.validateUserExists([data.leaderId, ...data.executorIds]);
    // 3. 创建任务
    const task = await this.taskRepository.create(data);
    // 4. 发送通知（复用Nest-Admin WebSocket通知服务）
    await this.messageService.send({
      receiveIds: [data.leaderId, ...data.executorIds],
      title: '任务指派通知',
      content: `您被指派为任务【${task.name}】的负责人/经办人，请及时处理`,
      type: 1, // 任务相关通知，与框架通知类型规范一致
    });
    return task;
  }

  // 编辑任务（权限校验：只能编辑自己负责或创建的任务）
  async update(id: string, data: UpdateTaskDto, userId: string) {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    // 权限校验：负责人或项目管理员可编辑
    const isLeader = task.leaderId === userId;
    const isProjectAdmin = await this.checkProjectAdmin(task.projectId, userId);
    if (!isLeader && !isProjectAdmin) {
      throw new ForbiddenException('无权限编辑该任务');
    }
    // 校验经办人是否存在（若修改）
    if (data.executorIds) {
      await this.validateUserExists(data.executorIds);
    }
    // 编辑任务
    const updatedTask = await this.taskRepository.update(id, data);
    // 若修改负责人/经办人，发送通知
    if (data.leaderId || data.executorIds) {
      const receiveIds = [...(data.leaderId ? [data.leaderId] : []), ...(data.executorIds || [])];
      await this.messageService.send({
        receiveIds,
        title: '任务更新通知',
        content: `任务【${updatedTask.name}】已更新，请及时查看`,
        type: 1,
      });
    }
    return updatedTask;
  }

  // 删除任务（权限校验：项目管理员可删除）
  async delete(id: string, userId: string) {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    const isProjectAdmin = await this.checkProjectAdmin(task.projectId, userId);
    if (!isProjectAdmin) {
      throw new ForbiddenException('无权限删除该任务');
    }
    return this.taskRepository.delete(id);
  }

  // 辅助方法：校验用户是否有权限查看项目任务
  private async checkTaskPermission(projectId: string, userId: string) {
    // 查询用户是否是该项目的成员（复用项目成员Repository）
    const member = await this.projectMemberRepository.findOne({
      where: { projectId, userId },
    });
    return !!member;
  }

  // 辅助方法：校验用户是否是项目管理员（项目经理）
  private async checkProjectAdmin(projectId: string, userId: string) {
    const member = await this.projectMemberRepository.findOne({
      where: { projectId, userId },
    });
    return member?.role === 1; // 1-项目经理
  }

  // 辅助方法：校验用户是否存在（复用Nest-Admin用户服务）
  private async validateUserExists(userIds: string[]) {
    const users = await this.userService.findByIds(userIds);
    if (users.length !== userIds.length) {
      throw new NotFoundException('部分用户不存在');
    }
  }
}
`

5. Controller层（接口暴露，复用Nest-Admin权限装饰器和接口规范）
        `import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; // 复用Nest-Admin登录守卫
import { RolesGuard } from '../../common/guards/roles.guard'; // 复用Nest-Admin角色守卫
import { RequiresPermissions } from '../../common/decorators/requires-permissions.decorator'; // 复用框架权限装饰器
import { CurrentUser } from '../../common/decorators/current-user.decorator'; // 复用框架当前用户装饰器

@ApiTags('任务管理') // Swagger标签，贴合Nest-Admin接口文档规范
@Controller('task')
@UseGuards(JwtAuthGuard, RolesGuard) // 启用登录校验和角色校验
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiOperation({ summary: '分页查询任务' })
  @Get()
  @RequiresPermissions(['task:list']) // 配置任务查看权限，贴合Nest-Admin权限规范
  findAll(@Query() query: TaskQueryDto, @CurrentUser('id') userId: string) {
    return this.taskService.findAll(query, userId);
  }

  @ApiOperation({ summary: '根据ID查询任务' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @Get(':id')
  @RequiresPermissions(['task:detail'])
  findById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.taskService.findById(id, userId);
  }

  @ApiOperation({ summary: '创建任务' })
  @Post()
  @RequiresPermissions(['task:create'])
  create(@Body() data: CreateTaskDto, @CurrentUser('id') userId: string) {
    return this.taskService.create(data, userId);
  }

  @ApiOperation({ summary: '编辑任务' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @Put(':id')
  @RequiresPermissions(['task:update'])
  update(
    @Param('id') id: string,
    @Body() data: UpdateTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskService.update(id, data, userId);
  }

  @ApiOperation({ summary: '删除任务' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @Delete(':id')
  @RequiresPermissions(['task:delete'])
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.taskService.delete(id, userId);
  }

  // 其他接口：更新任务进度、查询子任务、任务看板数据等，按需添加，均遵循框架接口规范
  @ApiOperation({ summary: '更新任务进度' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @Put(':id/progress')
  @RequiresPermissions(['task:update'])
  updateProgress(
    @Param('id') id: string,
    @Body('progress') progress: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskService.updateProgress(id, progress, userId);
  }
}
`

# 基于Nest-Admin开发项目管理系统 完整设计方案（缺失部分补充）

### 4.2.2 其他新增模块说明

其他5个新增模块（project、project-member、task-comment、ticket、document）的结构与任务模块完全一致，均包含Module、Controller、Service、Repository、DTO、Entity，核心差异仅在于业务逻辑和数据操作，以下简要说明各模块核心功能，均贴合Nest-Admin规范：

- 项目管理模块（project）：项目CRUD、归档、进度统计，关联项目负责人和成员，复用框架文件上传能力；

- 项目成员模块（project-member）：项目成员添加、删除、角色修改，管理用户与项目的关联关系，适配Nest-Admin权限体系；

- 任务评论模块（task-comment）：任务评论CRUD，关联评论人和任务，支持评论附件上传（复用框架文件上传能力），评论内容校验，权限控制（仅项目成员可评论），同时关联任务，实现评论与任务的联动展示；

- 工单管理模块（ticket）：工单CRUD、状态流转（待处理→处理中→已解决→已关闭），支持关联任务（可选），区分工单类型（缺陷、需求、反馈），提交人、处理人关联，解决方案录入，附件上传，权限控制（提交人可编辑自己的工单，处理人可更新工单状态和填写解决方案）；

- 文档管理模块（document）：文档CRUD、版本管理（默认1.0.0，支持版本升级），区分富文本和文件两种类型，富文本内容存储、文件上传与路径管理（复用框架文件上传配置），关联上传人，权限控制（项目成员可查看，上传人可编辑、删除，项目经理可批量管理）。

## 4.3 权限配置（复用Nest-Admin RBAC权限体系）

无需新增权限表，复用Nest-Admin原生的sys_role（角色表）、sys_menu（菜单表）、sys_role_menu（角色菜单关联表），新增业务模块的菜单和权限标识，配置到框架权限体系中，实现细粒度权限控制，贴合Nest-Admin权限规范。

### 4.3.1 新增菜单配置（适配框架菜单管理规范）

在Nest-Admin后台菜单管理中新增项目管理相关菜单，父菜单为“项目管理”，子菜单对应各业务模块，配置菜单路径、图标、组件路径，与前端路由对应，示例如下：

|菜单名称|菜单路径|组件路径|父菜单|权限标识|
|---|---|---|---|---|
|项目管理|/project|views/project/index|系统管理（或独立父菜单）|project:view|
|项目成员管理|/project/member|views/project/member|项目管理|project:member:view|
|任务管理|/task|views/task/index|项目管理|task:view|
|工单管理|/ticket|views/ticket/index|项目管理|ticket:view|
|文档管理|/document|views/document/index|项目管理|document:view|
### 4.3.2 新增权限标识（适配框架权限控制规范）

为每个业务模块配置对应的权限标识，与Controller层的@RequiresPermissions装饰器对应，分配给不同角色（如项目经理、普通成员、访客），实现细粒度权限控制，所有权限标识均遵循“模块:操作”的格式，示例如下：

- 项目模块：project:list（分页查询）、project:create（创建）、project:update（编辑）、project:delete（删除）、project:detail（详情）、project:archive（归档）；

- 项目成员模块：project:member:list、project:member:create、project:member:update、project:member:delete；

- 任务模块：task:list、task:create、task:update、task:delete、task:detail、task:progress（更新进度）；

- 任务评论模块：task:comment:list、task:comment:create、task:comment:delete；

- 工单模块：ticket:list、ticket:create、ticket:update、ticket:delete、ticket:detail、ticket:solution（填写解决方案）；

- 文档模块：document:list、document:create、document:update、document:delete、document:detail、document:version（版本升级）。

### 4.3.3 角色权限分配（贴合Nest-Admin RBAC规范）

复用Nest-Admin角色管理功能，为不同角色分配对应权限，适配项目管理业务场景，示例如下：

- 项目经理（角色）：拥有所有项目管理相关权限，可管理项目、成员、任务、工单、文档的全部操作；

- 普通成员（角色）：拥有项目查看、任务查看/创建/编辑（自己负责/经办）、工单提交/查看、评论创建/查看、文档查看/上传权限，无删除、归档等高级操作权限；

- 访客（角色）：仅拥有项目查看、任务查看、工单查看、文档查看权限，无编辑、创建、删除权限。

## 4.4 异常处理与日志（复用Nest-Admin原生能力）

无需新增异常处理和日志相关代码，完全复用Nest-Admin的异常处理机制和操作日志功能，贴合框架规范：

1. 异常处理：复用框架的全局异常过滤器（GlobalExceptionFilter），统一处理业务异常（如权限不足、数据不存在、参数错误），返回统一响应格式，无需额外开发；

2. 操作日志：复用框架的操作日志装饰器（@OperLog），为每个业务接口添加日志记录，记录操作人、操作时间、操作内容、操作IP等信息，可在Nest-Admin后台查看、导出日志；

3. 数据校验：复用框架的ValidationPipe参数校验管道，DTO层配置的校验规则自动生效，校验失败自动返回标准化错误信息，无需额外处理。

## 4.5 缓存策略（复用Nest-Admin Redis缓存）

复用框架的Redis缓存配置，针对高频访问数据设置缓存，提升系统性能，贴合Nest-Admin缓存规范，核心缓存场景如下：

- 项目列表缓存：缓存热门项目、常用项目列表，缓存时间10分钟，项目更新时自动清除对应缓存；

- 任务看板缓存：缓存当前用户参与的任务看板数据，缓存时间5分钟，任务状态、进度更新时清除缓存；

- 用户权限缓存：复用框架的用户权限缓存，缓存用户拥有的项目管理相关权限，减少数据库查询；

- 字典缓存：复用框架的字典缓存，缓存项目、任务、工单等相关字典项，提升页面渲染速度。

# 五、前端开发设计（增量开发，复用Nest-Admin基础）

前端开发完全复用Nest-Admin的布局、路由、权限、组件库等基础能力，仅新增项目管理相关页面和组件，保持与框架一致的UI风格和交互逻辑，支持Vue3/React切换，以下以Vue3+Element Plus为例，贴合Nest-Admin前端规范。

## 5.1 前端目录结构（新增业务目录标注★）

```plain text
src/
├── api/                      // 接口请求目录（复用框架结构）
│   ├── sys/                  // 框架原生系统接口（复用）
│   ├── project/              // ★ 项目模块接口
│   ├── project-member/       // ★ 项目成员模块接口
│   ├── task/                 // ★ 任务模块接口
│   ├── task-comment/         // ★ 任务评论模块接口
│   ├── ticket/               // ★ 工单模块接口
│   └── document/             // ★ 文档模块接口
├── assets/                   // 静态资源（复用框架，新增业务图标）
├── components/               // 组件目录（复用框架组件，新增业务组件）
│   ├── common/               // 框架原生公共组件（复用）
│   ├── project/              // ★ 项目相关组件（如项目卡片、项目筛选器）
│   ├── task/                 // ★ 任务相关组件（如任务看板、进度条、子任务列表）
│   ├── ticket/               // ★ 工单相关组件（如工单状态标签、缺陷分类组件）
│   └── document/             // ★ 文档相关组件（如富文本编辑器、文件上传组件）
├── router/                   // 路由配置（复用框架动态路由，新增业务路由）
├── store/                    // 状态管理（复用Pinia，新增业务状态）
│   ├── modules/              // 模块状态
│   │   ├── sys/              // 框架原生状态（复用）
│   │   ├── projectStore.ts   // ★ 项目相关状态
│   │   ├── taskStore.ts      // ★ 任务相关状态
│   │   └── documentStore.ts  // ★ 文档相关状态
├── styles/                   // 样式目录（复用框架样式，新增业务样式）
├── views/                    // 页面目录（复用框架布局，新增业务页面）
│   ├── sys/                  // 框架原生系统页面（复用）
│   ├── project/              // ★ 项目管理页面（列表、详情、编辑）
│   ├── project-member/       // ★ 项目成员管理页面
│   ├── task/                 // ★ 任务管理页面（列表、看板、详情、编辑）
│   ├── task-comment/         // ★ 任务评论组件（嵌入任务详情页）
│   ├── ticket/               // ★ 工单管理页面（列表、详情、编辑）
│   └── document/             // ★ 文档管理页面（列表、上传、预览）
├── utils/                    // 工具类（复用框架工具，新增业务工具）
├── App.vue                   // 根组件（复用）
└── main.ts                   // 入口文件（复用，新增业务模块注册）
```

## 5.2 核心前端功能实现（贴合Nest-Admin前端规范）

### 5.2.1 接口请求封装（复用框架Axios配置）

复用Nest-Admin的Axios封装（请求拦截、响应拦截、异常提示、token携带），新增业务接口请求函数，统一放在对应模块的api目录下，示例（task/api.ts）：

```typescript
// 复用框架的请求工具
import request from '@/utils/request';

// 任务分页查询
export function getTaskList(params) {
  return request({
    url: '/task',
    method: 'get',
    params
  });
}

// 根据ID查询任务详情
export function getTaskById(id) {
  return request({
    url: `/task/${id}`,
    method: 'get'
  });
}

// 创建任务
export function createTask(data) {
  return request({
    url: '/task',
    method: 'post',
    data
  });
}

// 编辑任务
export function updateTask(id, data) {
  return request({
    url: `/task/${id}`,
    method: 'put',
    data
  });
}

// 更新任务进度
export function updateTaskProgress(id, progress) {
  return request({
    url: `/task/${id}/progress`,
    method: 'put',
    data: { progress }
  });
}

// 删除任务
export function deleteTask(id) {
  return request({
    url: `/task/${id}`,
    method: 'delete'
  });
}
```

### 5.2.2 状态管理（复用Pinia，新增业务状态）

复用Nest-Admin的Pinia状态管理，新增业务相关状态，用于存储全局共享的业务数据（如当前选中项目、任务筛选条件、看板状态），示例（taskStore.ts）：

```typescript
import { defineStore } from 'pinia';
import { getTaskList } from '@/api/task';

export const useTaskStore = defineStore('task', {
  state: () => ({
    taskList: [], // 任务列表
    taskDetail: null, // 任务详情
    total: 0, // 任务总数
    currentPage: 1, // 当前页码
    pageSize: 10, // 每页条数
    filterParams: { // 筛选参数
      projectId: '',
      status: '',
      priority: '',
      keyword: ''
    },
    kanbanStatus: { // 看板状态
      activeTab: 'all', // 全部/待处理/处理中/已完成
      sortType: 'endDate' // 排序字段
    }
  }),
  actions: {
    // 分页查询任务
    async fetchTaskList(params = {}) {
      const query = {
        page: this.currentPage,
        size: this.pageSize,
        ...this.filterParams,
        ...params
      };
      const res = await getTaskList(query);
      this.taskList = res.records;
      this.total = res.total;
    },
    // 设置筛选参数
    setFilterParams(params) {
      this.filterParams = { ...this.filterParams, ...params };
      this.currentPage = 1; // 重置页码
      this.fetchTaskList(); // 重新查询
    },
    // 设置看板状态
    setKanbanStatus(status) {
      this.kanbanStatus = { ...this.kanbanStatus, ...status };
    },
    // 清空任务详情
    clearTaskDetail() {
      this.taskDetail = null;
    }
  }
});
```

### 5.2.3 核心页面实现（复用框架组件，新增业务逻辑）

所有业务页面均复用Nest-Admin的布局组件（如Sidebar、Header、Breadcrumb）、公共组件（如Table、Form、Modal、Upload），仅新增业务逻辑和页面布局，保持与框架一致的风格，以下以核心页面为例：

1. 任务列表页（views/task/index.vue）：复用框架Table组件，实现任务分页、筛选、搜索、批量删除、状态切换等功能，关联任务负责人、项目信息，适配权限控制（无删除权限则隐藏删除按钮）；

2. 任务看板页（views/task/kanban.vue）：新增看板组件，按任务状态（待处理、处理中、已完成等）分组展示，支持拖拽排序、拖拽切换状态，实时更新任务进度，复用框架拖拽组件；

3. 任务详情页（views/task/detail.vue）：复用框架Card、Tabs组件，展示任务基本信息、子任务列表、评论列表、附件，支持评论提交、附件下载、进度更新，关联评论人、经办人信息；

4. 项目管理页（views/project/index.vue）：复用框架Table、Form组件，实现项目CRUD、归档、进度统计，展示项目负责人、成员数量、任务数量等信息，支持项目附件上传（复用框架Upload组件）；

5. 文档管理页（views/document/index.vue）：复用框架Table、Upload组件，实现文档上传、下载、预览、版本管理，区分富文本和文件类型，支持富文本编辑（复用框架富文本组件）。

### 5.2.4 权限控制（复用Nest-Admin权限指令）

复用Nest-Admin的权限指令（如v-permission），在前端页面中控制按钮、菜单的显示/隐藏，与后端权限标识对应，示例：

```vue
<template>
  <div class="task-header">
    <el-button type="primary" @click="handleCreate" v-permission="['task:create']">
      新增任务
    </el-button>
    <el-button type="danger" @click="handleBatchDelete" v-permission="['task:delete']">
      批量删除
    </el-button&gt;
  &lt;/div&gt;
  &lt;el-table :data="taskList"&gt;
    <!-- 表格内容 -->
    <el-table-column label="操作">
      <template #default="scope">
        <el-button size="small" @click="handleEdit(scope.row)" v-permission="['task:update']">
          编辑
        </el-button>
        <el-button size="small" type="danger" @click="handleDelete(scope.row.id)" v-permission="['task:delete']">
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
```

## 5.3 前端交互规范（贴合Nest-Admin交互风格）

- 弹窗交互：复用框架Modal组件，新增/编辑/删除操作均使用弹窗确认，提示信息统一、规范，与框架原生交互一致；

- 加载状态：复用框架Loading组件，接口请求时显示加载动画，请求完成后自动关闭，避免用户重复操作；

- 异常提示：复用框架Message组件，接口请求失败、参数校验失败时，显示标准化错误提示，操作成功时显示成功提示；

- 表单校验：复用框架Form组件的校验功能，与后端DTO校验规则一致，实时校验表单输入，提示错误信息；

- 分页交互：复用框架分页组件，统一分页样式和交互，支持页码切换、每页条数切换，与后端分页逻辑同步。

# 六、系统部署与测试（复用Nest-Admin部署脚本）

## 6.1 部署方案（复用Nest-Admin部署规范）

完全复用Nest-Admin的部署方案，支持Docker+Docker Compose一键部署、CI/CD持续集成，无需额外修改部署脚本，仅需新增业务相关配置，部署流程如下：

1. 环境准备：安装Docker、Docker Compose、Node.js（可选，用于本地开发）、MySQL 8.0+、Redis，与Nest-Admin环境要求一致；

2. 配置修改：修改docker-compose.yml文件，新增业务模块相关环境变量（如数据库连接、Redis配置），与框架配置统一；

3. 数据库迁移：执行Nest-Admin原生的数据库迁移命令，自动生成新增的业务表，无需手动创建表结构；

4. 前端打包：执行npm run build命令，打包前端业务页面，将打包后的静态资源放入框架指定目录；

5. 一键部署：执行docker-compose up -d命令，启动所有服务（后端、前端、MySQL、Redis），部署完成后即可访问系统；

6. CI/CD配置：复用框架的CI/CD脚本，新增业务代码的构建、测试、部署步骤，实现代码提交后自动部署。

## 6.2 测试方案（贴合Nest-Admin测试规范）

复用Nest-Admin的测试工具和测试规范，针对新增业务模块进行测试，确保系统稳定运行，测试类型如下：

1. 单元测试：针对后端Service、Repository层的核心方法，复用Jest测试工具，编写单元测试用例，确保业务逻辑正确；

2. 接口测试：复用Postman测试工具，针对所有新增业务接口，编写接口测试用例，测试接口的请求参数、响应格式、权限控制、异常处理；

3. 前端测试：针对前端页面和组件，复用Vue Test Utils测试工具，测试页面渲染、组件交互、表单校验、权限控制；

4. 集成测试：测试前后端交互、模块间联动（如任务创建后自动发送通知、工单关联任务后同步显示），确保系统集成正常；

5. 性能测试：针对高频访问接口（如任务列表、看板数据），进行压力测试，确保系统在高并发场景下稳定运行，复用框架性能测试工具。

# 七、注意事项与扩展建议

## 7.1 开发注意事项

- 严格遵循Nest-Admin的开发规范，不修改框架原生代码，所有业务开发均采用增量扩展方式，避免影响框架原有功能；

- 实体类关联关系需严格配置onDelete规则（如CASCADE、RESTRICT、SET NULL），避免数据库数据混乱；

- 权限控制需前后端一致，后端Controller层添加@RequiresPermissions装饰器，前端页面使用v-permission指令，确保权限校验生效；

- 文件上传、缓存、异常处理等功能，优先复用框架原生能力，不重复开发，降低维护成本；

- 代码提交前需进行单元测试和接口测试，确保业务逻辑正确，避免引入bug。

## 7.2 系统扩展建议

- 新增统计报表模块：基于现有业务数据，新增项目进度报表、任务完成率报表、工单处理时效报表，复用框架报表组件；

- 新增消息提醒模块：扩展WebSocket通知功能，支持任务逾期提醒、工单分配提醒、文档更新提醒，提升用户体验；

- 支持多语言：复用Nest-Admin多语言功能，新增业务模块的多语言配置，适配国际化需求；

- 移动端适配：基于前端响应式设计，适配移动端访问，新增移动端适配样式，确保在手机端正常使用；

- 集成第三方工具：可集成GitLab、Jenkins等工具，实现任务与代码提交、构建部署的联动，提升开发效率。

# 八、总结

本方案基于Nest-Admin框架进行增量开发，严格遵循框架规范，复用框架原生的用户管理、权限控制、异常处理、文件上传、缓存等能力，仅新增项目管理相关业务模块（项目、任务、项目成员、任务评论、工单、文档），实现了项目全生命周期管理。方案设计贴合企业项目管理实际需求，代码规范统一、可维护性强、扩展性好，部署简单，能够快速落地使用，同时保留了Nest-Admin框架的所有原生功能，降低了开发和维护成本。