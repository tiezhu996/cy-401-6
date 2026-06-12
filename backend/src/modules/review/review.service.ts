import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractStatus } from '../../common/enums/contract-status.enum';
import { Contract } from '../contract/entity/contract.entity';
import { User } from '../user/entity/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './entity/review.entity';

@Injectable()
export class ReviewService {
    constructor(
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        @InjectRepository(Contract)
        private readonly contractRepository: Repository<Contract>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) { }

    async create(reviewerId: string, dto: CreateReviewDto) {
        const contract = await this.contractRepository.findOne({
            where: { id: dto.contractId }
        });
        if (!contract) {
            throw new NotFoundException('合同不存在');
        }
        if (contract.status !== ContractStatus.Completed) {
            throw new BadRequestException('只有已完成的合同才能评价');
        }

        const isBuyer = contract.buyerId === reviewerId;
        const isFreelancer = contract.freelancerId === reviewerId;
        if (!isBuyer && !isFreelancer) {
            throw new ForbiddenException('你不是该合同的参与方');
        }

        const expectedRevieweeId = isBuyer ? contract.freelancerId : contract.buyerId;
        if (dto.revieweeId !== expectedRevieweeId) {
            throw new ForbiddenException('你只能评价合同对方');
        }

        const hoursSinceCompletion =
            (Date.now() - contract.updatedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCompletion > 24) {
            throw new BadRequestException('评价窗口已过（完成后24小时内）');
        }

        const existing = await this.reviewRepository.findOne({
            where: { reviewerId, contractId: dto.contractId }
        });
        if (existing) {
            throw new BadRequestException('你已经评价过该合同');
        }

        const review = this.reviewRepository.create({
            reviewerId,
            revieweeId: dto.revieweeId,
            contractId: dto.contractId,
            score: dto.score,
            comment: dto.comment ?? null
        });
        const saved = await this.reviewRepository.save(review);

        await this.recalcRating(dto.revieweeId);

        return saved;
    }

    async findByUser(userId: string) {
        return this.reviewRepository.find({
            where: { revieweeId: userId },
            order: { createdAt: 'DESC' }
        });
    }

    async findByContract(contractId: string) {
        return this.reviewRepository.find({
            where: { contractId }
        });
    }

    private async recalcRating(userId: string) {
        const result = await this.reviewRepository
            .createQueryBuilder('r')
            .select('AVG(r.score)', 'avg')
            .addSelect('COUNT(*)', 'cnt')
            .where('r.revieweeId = :userId', { userId })
            .getRawOne();

        const avg = parseFloat(result.avg) || 5;
        const count = parseInt(result.cnt, 10) || 0;

        await this.userRepository.update(userId, {
            rating: Math.round(avg * 100) / 100,
            reviewCount: count
        });
    }
}
