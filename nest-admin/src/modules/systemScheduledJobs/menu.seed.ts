import { BoolNum } from "src/common/type/base";
import { MenuType } from "src/modules/menus/menu.entity";

export type MenuSeedItem = {
  name: string;
  path: string;
  component: string;
  type: MenuType;
  permissionKey: string;
  order: number;
  icon: string;
  isHidden: BoolNum;
  isActive: BoolNum;
};

export type ScheduledJobsMenuSeed = {
  parentPermissionKey: string;
  page: MenuSeedItem;
  buttons: MenuSeedItem[];
};

export const scheduledJobsMenuSeed: ScheduledJobsMenuSeed = {
  parentPermissionKey: "system",
  page: {
    name: "定时任务管理",
    path: "/systemManage/scheduledJobs/index",
    component: "systemMonitor/scheduledJobs/index",
    type: MenuType.menu,
    permissionKey: "system/scheduledJobs/list",
    order: 90,
    icon: "Timer",
    isHidden: BoolNum.No,
    isActive: BoolNum.Yes,
  },
  buttons: [
    {
      name: "查看日志",
      path: "",
      component: "",
      type: MenuType.button,
      permissionKey: "system/scheduledJobs/logs",
      order: 1,
      icon: "",
      isHidden: BoolNum.No,
      isActive: BoolNum.Yes,
    },
    {
      name: "立即执行",
      path: "",
      component: "",
      type: MenuType.button,
      permissionKey: "system/scheduledJobs/run",
      order: 2,
      icon: "",
      isHidden: BoolNum.No,
      isActive: BoolNum.Yes,
    },
    {
      name: "启用",
      path: "",
      component: "",
      type: MenuType.button,
      permissionKey: "system/scheduledJobs/enable",
      order: 3,
      icon: "",
      isHidden: BoolNum.No,
      isActive: BoolNum.Yes,
    },
    {
      name: "停用",
      path: "",
      component: "",
      type: MenuType.button,
      permissionKey: "system/scheduledJobs/disable",
      order: 4,
      icon: "",
      isHidden: BoolNum.No,
      isActive: BoolNum.Yes,
    },
  ],
};
