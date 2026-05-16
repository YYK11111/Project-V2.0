import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerViewerGrantFields1747400000000
  implements MigrationInterface
{
  name = "AddCustomerViewerGrantFields1747400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`crm_customer_viewer\`
      ADD COLUMN \`status\` char(1) NOT NULL DEFAULT '1' COMMENT '状态: 0禁用 1启用' AFTER \`can_edit\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`crm_customer_viewer\`
      ADD COLUMN \`grant_type\` varchar(20) NOT NULL DEFAULT 'permanent' COMMENT '授权类型: permanent永久 temporary临时' AFTER \`status\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`crm_customer_viewer\`
      ADD COLUMN \`start_time\` datetime NULL COMMENT '授权开始时间' AFTER \`grant_type\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`crm_customer_viewer\`
      ADD COLUMN \`end_time\` datetime NULL COMMENT '授权结束时间' AFTER \`start_time\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`crm_customer_viewer\`
      ADD COLUMN \`grant_reason\` varchar(500) NULL COMMENT '授权原因' AFTER \`end_time\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`crm_customer_viewer\`
      ADD COLUMN \`grant_user_id\` bigint NULL COMMENT '授权人ID' AFTER \`grant_reason\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`crm_customer_viewer\`
      ADD COLUMN \`revoke_user_id\` bigint NULL COMMENT '撤销人ID' AFTER \`grant_user_id\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`crm_customer_viewer\`
      ADD COLUMN \`revoke_time\` datetime NULL COMMENT '撤销时间' AFTER \`revoke_user_id\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`crm_customer_viewer\`
      ADD COLUMN \`revoke_reason\` varchar(500) NULL COMMENT '撤销原因' AFTER \`revoke_time\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`crm_customer_viewer\` DROP COLUMN \`revoke_reason\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`crm_customer_viewer\` DROP COLUMN \`revoke_time\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`crm_customer_viewer\` DROP COLUMN \`revoke_user_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`crm_customer_viewer\` DROP COLUMN \`grant_user_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`crm_customer_viewer\` DROP COLUMN \`grant_reason\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`crm_customer_viewer\` DROP COLUMN \`end_time\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`crm_customer_viewer\` DROP COLUMN \`start_time\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`crm_customer_viewer\` DROP COLUMN \`grant_type\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`crm_customer_viewer\` DROP COLUMN \`status\``,
    );
  }
}
