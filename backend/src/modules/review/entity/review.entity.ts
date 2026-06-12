import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { Contract } from '../../contract/entity/contract.entity';
import { User } from '../../user/entity/user.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    reviewerId: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'reviewerId' })
    reviewer: User;

    @Column()
    revieweeId: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'revieweeId' })
    reviewee: User;

    @Column()
    contractId: string;

    @ManyToOne(() => Contract, { eager: true })
    @JoinColumn({ name: 'contractId' })
    contract: Contract;

    @Column({ type: 'decimal', precision: 3, scale: 2 })
    score: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @CreateDateColumn()
    createdAt: Date;
}
