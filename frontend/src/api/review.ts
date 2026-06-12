import { http } from './http';
import type { Review } from '@/types';

export interface CreateReviewPayload {
    contractId: string;
    revieweeId: string;
    score: number;
    comment?: string;
}

export const reviewApi = {
    create(payload: CreateReviewPayload) {
        return http.post<unknown, Review>('/reviews', payload);
    },
    listByUser(userId: string) {
        return http.get<unknown, Review[]>(`/reviews/user/${userId}`);
    },
    listByContract(contractId: string) {
        return http.get<unknown, Review[]>(`/reviews/contract/${contractId}`);
    }
};
