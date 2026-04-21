import { PartialType } from "@nestjs/mapped-types";
import { HandoverRecord } from "./entity";

export class HandoverRecordDto extends PartialType(HandoverRecord) {}
