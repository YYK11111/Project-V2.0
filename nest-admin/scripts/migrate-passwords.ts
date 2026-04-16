import { register } from 'tsconfig-paths'
register({
  baseUrl: '.',
  paths: {
    'src/*': ['src/*'],
    'config': ['config/index'],
    'config/*': ['config/*'],
  },
})

import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { config } from 'config'
import { decrypt } from 'src/common/utils/encrypt'
import { hashPassword, isPasswordHashed } from 'src/common/utils/password'
import { User } from 'src/modules/users/entities/user.entity'
import { Dept } from 'src/modules/depts/entities/dept.entity'
import { Role } from 'src/modules/roles/entity'
import { Menu } from 'src/modules/menus/menu.entity'

type MigrateOptions = {
  dryRun: boolean
  batchSize: number
}

type FailedRecord = {
  id: string | number
  reason: string
}

type UserRow = {
  id: string
  password: string | null
  passwordVersion?: number | null
}

async function parseOptions(): Promise<MigrateOptions> {
  const dryRun = process.argv.includes('--dry-run')
  const batchArg = process.argv.find((arg) => arg.startsWith('--batch='))
  const batchSize = Number(batchArg?.split('=')[1] || 100)
  return {
    dryRun,
    batchSize: Number.isFinite(batchSize) && batchSize > 0 ? batchSize : 100,
  }
}

async function bootstrap() {
  const { dryRun, batchSize } = await parseOptions()
  const dataSource = new DataSource({
    ...config.database,
    entities: [User, Dept, Role, Menu],
    synchronize: false,
    logging: false,
  } as any)
  await dataSource.initialize()
  const usersRepository = dataSource.getRepository(User)
  const queryRunner = dataSource.createQueryRunner()
  const passwordVersionColumn = await queryRunner.query("SHOW COLUMNS FROM sys_user LIKE 'password_version'")
  const hasPasswordVersionColumn = Array.isArray(passwordVersionColumn) && passwordVersionColumn.length > 0

  let pageNum = 1
  let total = 0
  let migrated = 0
  let skipped = 0
  let failed = 0
  const failedIds: Array<string | number> = []
  const failedRecords: FailedRecord[] = []

  while (true) {
    const selectFields = ['id', 'password']
    if (hasPasswordVersionColumn) {
      selectFields.push('password_version AS passwordVersion')
    }

    const rows = (await queryRunner.query(
      `SELECT ${selectFields.join(', ')} FROM sys_user WHERE is_delete IS NULL ORDER BY id ASC LIMIT ? OFFSET ?`,
      [batchSize, (pageNum - 1) * batchSize],
    )) as UserRow[]

    if (!rows.length) {
      break
    }

    total += rows.length

    for (const user of rows) {
      try {
        if (!user.password) {
          throw new Error('密码为空，无法迁移')
        }

        if (isPasswordHashed(user.password) && (!hasPasswordVersionColumn || user.passwordVersion === 2)) {
          skipped++
          continue
        }

        const plainPassword = await decrypt(user.password)
        const password = await hashPassword(plainPassword)

        if (!dryRun) {
          await usersRepository.update(user.id, {
            password,
            passwordVersion: 2,
          })
        }
        migrated++
      } catch (error) {
        failed++
        failedIds.push(user.id)
        failedRecords.push({
          id: user.id,
          reason: error instanceof Error ? error.message : '未知错误',
        })
      }
    }

    pageNum++
  }

  console.log(JSON.stringify({ dryRun, total, migrated, skipped, failed, failedIds, failedRecords }, null, 2))
  await queryRunner.release()
  await dataSource.destroy()
}

bootstrap().catch((error) => {
  console.error(error)
  process.exit(1)
})
