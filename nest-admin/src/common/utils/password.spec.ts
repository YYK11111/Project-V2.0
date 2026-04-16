import { hashPassword, isPasswordHashed, verifyPassword } from './password'

describe('password utils', () => {
  it('哈希后的密码可以被正确校验', async () => {
    const plainPassword = 'Password@123'

    const hashedPassword = await hashPassword(plainPassword)

    expect(isPasswordHashed(hashedPassword)).toBe(true)
    await expect(verifyPassword(plainPassword, hashedPassword)).resolves.toBe(true)
    await expect(verifyPassword('wrong-password', hashedPassword)).resolves.toBe(false)
  })
})
