import { defineStore } from 'pinia';
import { ref } from 'vue';
import { reviewApi, type CreateReviewPayload } from '@/api/review';
import type { Review } from '@/types';

export const useReviewStore = defineStore('review', () => {
    const userReviews = ref<Review[]>([]);
    const contractReviews = ref<Review[]>([]);

    async function fetchByUser(userId: string) {
        userReviews.value = await reviewApi.listByUser(userId);
    }

    async function fetchByContract(contractId: string) {
        contractReviews.value = await reviewApi.listByContract(contractId);
    }

    async function submitReview(payload: CreateReviewPayload) {
        const review = await reviewApi.create(payload);
        contractReviews.value.push(review);
        return review;
    }

    return {
        userReviews,
        contractReviews,
        fetchByUser,
        fetchByContract,
        submitReview
    };
});
