import { PartialType } from "@nestjs/mapped-types";
import { GoLiveRecord } from "./entity";

export class GoLiveRecordDto extends PartialType(GoLiveRecord) {}
