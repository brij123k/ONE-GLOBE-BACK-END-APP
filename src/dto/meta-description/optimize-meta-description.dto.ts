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
    title?: boolean;

    @IsOptional()
    @IsBoolean()
    apply?: boolean;
}
