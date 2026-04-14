import { PartialType } from '@nestjs/mapped-types'
import { SalesOpportunity } from './entity'

export class SalesOpportunityDto extends PartialType(SalesOpportunity) {}
