import { PartialType } from '@nestjs/mapped-types'
import { Contract } from './entity'

export class ContractDto extends PartialType(Contract) {}
