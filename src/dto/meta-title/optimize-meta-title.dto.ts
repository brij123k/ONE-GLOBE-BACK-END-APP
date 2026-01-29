import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class OptimizeMetaTitleDto {
    @IsString()
    productId: string;

    @IsString()
    productTitle: string;

    @IsOptional()
    @IsBoolean()
    apply?: boolean;
}
