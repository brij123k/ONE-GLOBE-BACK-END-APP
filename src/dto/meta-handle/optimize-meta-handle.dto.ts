import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class OptimizeMetaHandleDto {
    @IsString()
    productId: string;

    @IsString()
    productHandle: string;

    @IsOptional()
    @IsBoolean()
    apply?: boolean;
}
