import { PartialType } from '@nestjs/mapped-types'
import { CustomerInteraction } from './entity'

export class CustomerInteractionDto extends PartialType(CustomerInteraction) {}
