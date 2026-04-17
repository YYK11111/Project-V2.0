import { PartialType } from '@nestjs/mapped-types'
import { ArticleBorrow } from './entity'

export class ArticleBorrowDto extends PartialType(ArticleBorrow) {}

export class ApplyBorrowDto {
  articleId: string
  applyReason: string
  requestedDays: number
}

export class ApproveBorrowDto {
  approvedDays: number
  remark: string
}

export class RejectBorrowDto {
  reason: string
}
