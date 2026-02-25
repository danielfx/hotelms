import { IsString } from 'class-validator';
export class SwitchPropertyDto { @IsString() propertyId: string; }
