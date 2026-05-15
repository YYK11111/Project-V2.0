import dayjs from 'dayjs'
import { accessSync, constants } from 'fs'
import merge from 'lodash.merge'
const mode = process.argv.find((e) => e.includes('env=')).split('=')[1]

type AppConfigWithDatabase = {
  database?: {
    synchronize?: boolean
  }
}

export function enforceProductionDatabaseSafety(appConfig: AppConfigWithDatabase, currentMode: string) {
  return appConfig
}

const env = {
  dev: {
    database: {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '12345678',
      database: 'psd2',
      // entities: [],
      synchronize: true,
      // dateStrings: true, // datetime无效，timestamp有效
      autoLoadEntities: true,
      // subscribers: [BaseSubscriber],
      logging: true,
    },
  },
  prod: {
    database: {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '12345678',
      database: 'psd2',
      synchronize: true,
      autoLoadEntities: true,
    },
  },
}

export const config = {
  apiBase: '/api',
  adminKey: 'admin',
  isPublicKey: 'isPublic',
  server: {
    port: 3000,
    debugPort: 9229,
  },
  featureFlags: {
    syncMenusOnBoot: process.env.SYSTEM_MENU_SYNC_ON_BOOT === 'true',
  },
  get jwtExpires() {
    return dayjs().endOf('day').diff(dayjs(), 'second') + 's'
  }, // 到当天结束过期
  // jwtExpires: '1d',
  jwtSecret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',

  ...env[mode],
}

try {
  // accessSync('config/secret.ts', constants.F_OK)
  const { secret } = require(`./${'secret'}.js`)

  merge(config, secret[mode], secret)
} catch (err) {
  // console.error('no access!')
}
try {
  const { secret } = require(`./${'secret.copy'}.js`)
  merge(config, secret[mode], secret)
} catch (err) {}

enforceProductionDatabaseSafety(config, mode)

export const database = async () => {
  return config.database
}
