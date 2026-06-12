import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewService } from './review.service';

@Controller('reviews')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Req() req: Request & { user: { sub: string } }, @Body() dto: CreateReviewDto) {
        return this.reviewService.create(req.user.sub, dto);
    }

    @Get('user/:userId')
    findByUser(@Param('userId') userId: string) {
        return this.reviewService.findByUser(userId);
    }

    @Get('contract/:contractId')
    findByContract(@Param('contractId') contractId: string) {
        return this.reviewService.findByContract(contractId);
    }
}
