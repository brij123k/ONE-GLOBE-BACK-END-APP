import { IsString, IsNotEmpty } from 'class-validator';

export class StartupSeoAuditDto {
  @IsString()
  @IsNotEmpty()
  shopName: string;
}
