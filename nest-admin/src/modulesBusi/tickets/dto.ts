import { PartialType } from '@nestjs/mapped-types'
import { Ticket } from './entity'

export class TicketDto extends PartialType(Ticket) {}
