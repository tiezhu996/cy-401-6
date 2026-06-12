import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReviewDto {
    @IsUUID()
    contractId: string;

    @IsUUID()
    revieweeId: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    score: number;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed.length > 0 ? trimmed : undefined;
        }
        return value;
    })
    comment?: string;
}
