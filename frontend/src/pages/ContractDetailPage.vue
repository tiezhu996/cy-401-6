<template>
  <section class="page">
    <el-page-header @back="$router.push('/dashboard')">
      <template #content>
        <span>{{ contract?.contractNo || '合同详情' }}</span>
      </template>
    </el-page-header>

    <el-card v-if="contract" class="section" shadow="never">
      <template #header>
        <div class="contract-header">
          <div>
            <h1>{{ contract.contractNo }}</h1>
            <p class="muted">{{ contract.requirement?.title }}</p>
          </div>
          <StatusBadge :status="contract.status" />
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="总金额">{{ formatCurrency(contract.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="付款方式">{{ paymentLabel }}</el-descriptions-item>
        <el-descriptions-item label="甲方"><UserAvatar :user="contract.buyer" /></el-descriptions-item>
        <el-descriptions-item label="乙方"><UserAvatar :user="contract.freelancer" /></el-descriptions-item>
      </el-descriptions>

      <div class="section">
        <ProgressSteps :stages="contract.stages" />
      </div>

      <div class="section">
        <el-button type="primary" @click="contractStore.signContract(contract.id)">签署确认</el-button>
        <el-button type="success" @click="contractStore.completeContract(contract.id)">完成确认</el-button>
      </div>
    </el-card>

    <el-card v-if="canReview" class="section" shadow="never">
      <template #header>互评打分</template>
      <el-alert type="info" :closable="false" class="review-hint">
        合同已完成，请在24小时内对对方进行评价
      </el-alert>
      <el-form label-position="top" class="section">
        <el-form-item label="评分">
          <el-rate v-model="reviewForm.score" :colors="rateColors" show-text :texts="rateTexts" />
        </el-form-item>
        <el-form-item label="留言">
          <el-input v-model="reviewForm.comment" type="textarea" :rows="3" placeholder="请输入评价内容" />
        </el-form-item>
        <el-button type="primary" :disabled="reviewForm.score === 0" @click="submitReview">
          提交评价
        </el-button>
      </el-form>
    </el-card>

    <el-card v-if="reviewStore.contractReviews.length > 0" class="section" shadow="never">
      <template #header>评价记录</template>
      <div v-for="review in reviewStore.contractReviews" :key="review.id" class="review-item">
        <div class="review-meta">
          <UserAvatar :user="review.reviewer" :size="36" />
          <el-rate :model-value="Number(review.score)" disabled :size="'small'" />
          <span class="muted review-time">{{ formatTime(review.createdAt) }}</span>
        </div>
        <p v-if="review.comment" class="review-comment">{{ review.comment }}</p>
      </div>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import ProgressSteps from '@/components/common/ProgressSteps.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useContractStore } from '@/stores/contract';
import { useReviewStore } from '@/stores/review';
import { useUserStore } from '@/stores/user';
import { ContractStatus, PaymentMode } from '@/types/enums';
import { formatCurrency } from '@/utils/format';

const props = defineProps<{ id: string }>();
const contractStore = useContractStore();
const reviewStore = useReviewStore();
const userStore = useUserStore();
const contract = computed(() => contractStore.currentContract);
const paymentLabel = computed(() =>
  contract.value?.paymentMode === PaymentMode.OneTime ? '一次性付款' : '分阶段付款'
);

const canReview = computed(() => {
  if (!contract.value || contract.value.status !== ContractStatus.Completed) return false;
  if (!userStore.user) return false;
  const isBuyer = contract.value.buyerId === userStore.user.id;
  const isFreelancer = contract.value.freelancerId === userStore.user.id;
  if (!isBuyer && !isFreelancer) return false;
  const updated = contract.value.updatedAt ? new Date(contract.value.updatedAt) : null;
  if (!updated) return false;
  const hours = (Date.now() - updated.getTime()) / (1000 * 60 * 60);
  if (hours > 24) return false;
  const alreadyReviewed = reviewStore.contractReviews.some(
    r => r.reviewerId === userStore.user!.id
  );
  return !alreadyReviewed;
});

const reviewForm = reactive({ score: 0, comment: '' });

const rateColors = ['#99A9BF', '#F7BA2A', '#FF9900'];
const rateTexts = ['很差', '一般', '还行', '较好', '很好'];

async function submitReview() {
  if (!contract.value || !userStore.user) return;
  const isBuyer = contract.value.buyerId === userStore.user.id;
  const revieweeId = isBuyer ? contract.value.freelancerId : contract.value.buyerId;
  try {
    await reviewStore.submitReview({
      contractId: contract.value.id,
      revieweeId,
      score: reviewForm.score,
      comment: reviewForm.comment || undefined
    });
    ElMessage.success('评价提交成功');
    reviewForm.score = 0;
    reviewForm.comment = '';
  } catch (e: any) {
    ElMessage.error(e.message || '评价失败');
  }
}

function formatTime(val?: string) {
  if (!val) return '';
  return new Date(val).toLocaleString('zh-CN');
}

onMounted(async () => {
  await contractStore.fetchDetail(props.id);
  await reviewStore.fetchByContract(props.id);
});
</script>

<style scoped>
.contract-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.contract-header h1 {
  margin: 0;
  font-size: 24px;
}

.review-hint {
  margin-bottom: 16px;
}

.review-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-time {
  font-size: 12px;
}

.review-comment {
  margin: 8px 0 0;
  padding-left: 48px;
  color: #374151;
  line-height: 1.6;
}
</style>
