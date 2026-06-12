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
    comment?: string;
}
