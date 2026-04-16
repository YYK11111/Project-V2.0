import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(scryptCallback)
const keyLength = 64
const passwordPrefix = 'scrypt'

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer
  return `${passwordPrefix}$${salt}$${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [algorithm, salt, storedHash] = hashedPassword?.split('$') ?? []
  if (algorithm !== passwordPrefix || !salt || !storedHash) {
    return false
  }

  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer
  const storedBuffer = Buffer.from(storedHash, 'hex')
  if (storedBuffer.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(storedBuffer, derivedKey)
}

export function isPasswordHashed(password: string): boolean {
  return typeof password === 'string' && password.startsWith(`${passwordPrefix}$`)
}
