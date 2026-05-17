import dayjs from 'dayjs'
import { accessSync, constants } from 'fs'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import merge from 'lodash.merge'
const modeEntry = process.argv.find((e) => e.includes('env='))

if (!modeEntry) {
  throw new Error('启动参数缺少 env=...，请使用 env=dev 或 env=prod')
}

const mode = modeEntry.split('=')[1]

type AppConfigWithDatabase = {
  database?: {
    synchronize?: boolean
  }
}

type CustomAiModelConfig = {
  id: string
  name: string
}

type HunyuanConfig = {
  appid?: string
  secretId?: string
  secretKey?: string
}

type CustomAiConfig = {
  baseUrl?: string
  apiKey?: string
  models?: CustomAiModelConfig[]
  defaultModel?: string
  defaultChatModel?: string
  defaultEmbeddingModel?: string
}

type MysqlDatabaseConfig = TypeOrmModuleOptions & {
  type: 'mysql'
  host: string
  port: number
  username: string
  password: string
  database: string
  synchronize: boolean
  autoLoadEntities: boolean
  logging?: boolean
}

type AppConfig = {
  apiBase: string
  adminKey: string
  isPublicKey: string
  server: {
    port: number
    debugPort: number
  }
  database: MysqlDatabaseConfig
  featureFlags: {
    syncMenusOnBoot: boolean
  }
  jwtExpires: string
  jwtSecret: string
  hunyuan?: HunyuanConfig
  customAi?: CustomAiConfig
  [key: string]: unknown
}

export function enforceProductionDatabaseSafety(appConfig: AppConfigWithDatabase, currentMode: string) {
  if (currentMode === 'prod' && appConfig.database) {
    appConfig.database.synchronize = false
  }

  return appConfig
}

function parseEnvNumber(value: string | undefined, defaultValue: number) {
  if (value === undefined || value === '') {
    return defaultValue
  }

  const parsedValue = Number(value)

  return Number.isNaN(parsedValue) ? defaultValue : parsedValue
}

function parseEnvBoolean(value: string | undefined, defaultValue: boolean) {
  if (value === undefined || value === '') {
    return defaultValue
  }

  return value === 'true'
}

function hasEnvValue(value: string | undefined) {
  return value !== undefined && value !== ''
}

function buildBaseConfig(currentMode: string) {
  return {
    server: {
      port: 3000,
      debugPort: 9229,
    },
    database: {
      type: 'mysql' as const,
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '12345678',
      database: 'psd2',
      synchronize: currentMode === 'dev',
      autoLoadEntities: true,
      ...(currentMode === 'dev'
        ? {
            logging: true,
          }
        : {}),
    },
  }
}

export const config: AppConfig = {
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
  ...buildBaseConfig(mode),
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

if (hasEnvValue(process.env.APP_PORT)) {
  config.server.port = parseEnvNumber(process.env.APP_PORT, config.server.port)
}

if (hasEnvValue(process.env.APP_DEBUG_PORT)) {
  config.server.debugPort = parseEnvNumber(process.env.APP_DEBUG_PORT, config.server.debugPort)
}

if (hasEnvValue(process.env.MYSQL_HOST)) {
  config.database.host = process.env.MYSQL_HOST
}

if (hasEnvValue(process.env.MYSQL_PORT)) {
  config.database.port = parseEnvNumber(process.env.MYSQL_PORT, config.database.port)
}

if (hasEnvValue(process.env.MYSQL_USER)) {
  config.database.username = process.env.MYSQL_USER
}

if (hasEnvValue(process.env.MYSQL_PASSWORD)) {
  config.database.password = process.env.MYSQL_PASSWORD
}

if (hasEnvValue(process.env.MYSQL_DATABASE)) {
  config.database.database = process.env.MYSQL_DATABASE
}

if (hasEnvValue(process.env.MYSQL_SYNCHRONIZE)) {
  config.database.synchronize = parseEnvBoolean(process.env.MYSQL_SYNCHRONIZE, config.database.synchronize)
}

if (hasEnvValue(process.env.JWT_SECRET)) {
  config.jwtSecret = process.env.JWT_SECRET
}

enforceProductionDatabaseSafety(config, mode)

export const database = async (): Promise<TypeOrmModuleOptions> => {
  return config.database
}
