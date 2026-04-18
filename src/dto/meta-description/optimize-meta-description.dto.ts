import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class OptimizeMetaDescriptionDto {
    @IsString()
    productId: string;

    @IsString()
    productDescription: string;

    @IsOptional()
    @IsBoolean()
    image?: boolean;

    @IsOptional()
    @IsBoolean()
    description?: boolean;

    @IsOptional()
    @IsBoolean()
    apply?: boolean;
}
