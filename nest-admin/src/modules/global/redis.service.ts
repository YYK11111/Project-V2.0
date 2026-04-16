import { Injectable } from '@nestjs/common'
import { Redis } from 'ioredis'
import { LoginLogsService } from '../loginLogs/service'
import { QueryListDto } from 'src/common/dto'
import { MenusService } from '../menus/menus.service'
import { BoolNum } from 'src/common/type/base'
import { SystenConfigsService } from '../configs/service'

@Injectable()
export class RedisService {
  redis: Redis
  constructor(
    private loginLogsService: LoginLogsService,
    private menusService: MenusService,
    private systemConfigsService: SystenConfigsService,
  ) {
    this.redis = new Redis({
      port: 6379, // Redis port
      host: '127.0.0.1', // Redis host
      // username: "default", // needs Redis >= 6
      // password: "my-top-secret",
      db: 1, // Defaults to 0
    })
  }
  async set(key: string, value: any, time?: number) {
    if (value && typeof value === 'object') {
      value = JSON.stringify(value)
    }
    return await (time ? this.redis.set(key, value, 'EX', time) : this.redis.set(key, value))
  }
  async get(key: string) {
    let value = await this.redis.get(key)
    return value
  }
  async del(key: string) {
    return await this.redis.del(key)
  }
  async ttl(key: string) {
    return await this.redis.ttl(key)
  }
  async keys(pattern: string) {
    return await this.redis.keys(pattern)
  }
  async expire(key: string, time: number) {
    return await this.redis.expire(key, time)
  }
  async exists(key: string) {
    return await this.redis.exists(key)
  }
  async hset(key: string, field: string, value: string) {
    return await this.redis.hset(key, field, value)
  }
  async hget(key: string, field: string) {
    return await this.redis.hget(key, field)
  }
  async hdel(key: string, field: string) {
    return await this.redis.hdel(key, field)
  }

  // getNotExpiredKeys
  async getNotExpiredValues(pattern = '*'): Promise<{}[]> {
    let cursor = '0'
    const notExpiredKeys = []

    while (true) {
      const [newCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = newCursor

      for (const key of keys) {
        const ttl = await this.ttl(key)
        if (ttl > 0) {
          let value = await this.get(key)
          notExpiredKeys.push(JSON.parse(value))
        }
      }

      if (cursor === '0') {
        break
      }
    }
    return notExpiredKeys
  }

  async getRedisOnlineUser(query: QueryListDto = {}) {
    let data: any[] = await this.getNotExpiredValues('user.online:*')
    data = data.filter((item) => {
      return (
        (!query.createTimeRange?.[0] ||
          (+new Date(item.createTime) >= +new Date(query.createTimeRange[0]) &&
            +new Date(item.createTime) <= +new Date(this.loginLogsService.dateToEndTime(query.createTimeRange[1])))) &&
        (!query.account || item.account.includes(query.account)) &&
        (!query.ip || item.ip.includes(query.ip)) &&
        (!query.address || item.address.includes(query.address))
      )
    })
    data = data.map(({ session, password, ...item }) => item)
    let { pageNum, pageSize } = query
    return [data.slice(--pageNum * pageSize, pageSize), data.length]
  }

  async setRedisOnlineUser(reqOrData, user: any = {}, expireSeconds?: number) {
    const ttl = expireSeconds || ((await this.systemConfigsService.getSessionExpireMinutes()) * 60)
    if (reqOrData.session) {
      return await this.set(`user.online:${reqOrData?.session}`, reqOrData, ttl)
    } else {
      let log = await this.loginLogsService.createLog(reqOrData, user, false)
      return await this.set(`user.online:${user?.session}`, log, ttl)
    }
  }

  async refreshOnlineUser(session: string) {
    const ttl = (await this.systemConfigsService.getSessionExpireMinutes()) * 60
    return await this.expire(`user.online:${session}`, ttl)
  }

  async delRedisOnlineUser(session) {
    return await this.del(`user.online:${session}`)
  }

  async existsOnlineUser(session: string) {
    return await this.exists(`user.online:${session}`)
  }

  // 获取权限列表
  async getPermissions(): Promise<[string]> {
    let menus = await this.menusService.list({ isActive: BoolNum.Yes }, false)
    let data = menus.flatMap((e) => e.permissionKey || [])
    await this.set('permissions', data, 60)
    return data
  }
}
