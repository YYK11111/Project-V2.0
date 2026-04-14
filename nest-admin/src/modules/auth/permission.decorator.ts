import { SetMetadata } from '@nestjs/common'

export const PERMISSION_KEY = 'permissionKey'

export const Permission = (permission: string) => SetMetadata(PERMISSION_KEY, permission)
