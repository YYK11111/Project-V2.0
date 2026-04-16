import { SystenConfigsService } from './service'

describe('SystenConfigsService', () => {
  it('优先返回系统配置中的有效时间', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({ sessionExpireMinutes: '45' }),
    }
    const service = new SystenConfigsService(repository as any)

    await expect(service.getSessionExpireMinutes()).resolves.toBe(45)
  })

  it('未配置时回退到 30 分钟', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({ sessionExpireMinutes: '' }),
    }
    const service = new SystenConfigsService(repository as any)

    await expect(service.getSessionExpireMinutes()).resolves.toBe(30)
  })
})
