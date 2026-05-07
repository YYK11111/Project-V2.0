import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Menu } from "src/modules/menus/menu.entity";
import { Repository } from "typeorm";
import { scheduledJobsMenuSeed, type MenuSeedItem } from "./menu.seed";

@Injectable()
export class MenuSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MenuSyncService.name);

  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async onApplicationBootstrap() {
    const parentMenu = await this.menuRepository.findOne({
      where: {
        permissionKey: scheduledJobsMenuSeed.parentPermissionKey,
      },
    });

    if (!parentMenu) {
      this.logger.error(
        `菜单同步失败：未找到父菜单 ${scheduledJobsMenuSeed.parentPermissionKey}`,
      );
      return;
    }

    const pageMenu = await this.syncMenu(
      parentMenu.id,
      scheduledJobsMenuSeed.page,
    );

    for (const button of scheduledJobsMenuSeed.buttons) {
      await this.syncMenu(pageMenu.id, button);
    }
  }

  private async syncMenu(parentId: string, seed: MenuSeedItem) {
    const currentMenu = await this.menuRepository.findOne({
      where: {
        permissionKey: seed.permissionKey,
      },
    });

    const nextMenu = new Menu(currentMenu || {});
    nextMenu.parentId = parentId;
    nextMenu.name = seed.name;
    nextMenu.path = seed.path;
    nextMenu.component = seed.component;
    nextMenu.type = seed.type;
    nextMenu.permissionKey = seed.permissionKey;
    nextMenu.order = seed.order;
    nextMenu.icon = seed.icon;
    nextMenu.isHidden = seed.isHidden;
    nextMenu.isActive = seed.isActive;

    return this.menuRepository.save(nextMenu);
  }
}
