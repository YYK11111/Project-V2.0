import { PartialType } from "@nestjs/mapped-types";
import { AcceptanceRecord } from "./entity";

export class AcceptanceRecordDto extends PartialType(AcceptanceRecord) {}
