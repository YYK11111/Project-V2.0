import { PartialType } from '@nestjs/mapped-types'
import { Customer } from './entity'

export class CustomerDto extends PartialType(Customer) {}
