<template>
  <section class="page">
    <el-row :gutter="18">
      <el-col :xs="24" :lg="9">
        <el-card v-if="profile" shadow="never">
          <UserAvatar :user="profile" :size="64" />
          <p class="muted">{{ profile.bio || '尚未填写简介' }}</p>
          <div>
            <SkillTag v-for="skill in profile.skillTags || []" :key="skill" :skill="skill" />
          </div>
          <div class="rating-row">
            <el-rate :model-value="Number(profile.rating)" disabled />
            <span class="rating-text">{{ Number(profile.rating).toFixed(1) }}</span>
            <span class="muted">{{ profile.reviewCount ?? 0 }} 条评价</span>
          </div>
        </el-card>

        <el-card v-if="reviewStore.userReviews.length > 0" class="section" shadow="never">
          <template #header>口碑评价</template>
          <div v-for="review in reviewStore.userReviews" :key="review.id" class="review-item">
            <div class="review-meta">
              <UserAvatar :user="review.reviewer" :size="32" />
              <el-rate :model-value="Number(review.score)" disabled :size="'small'" />
              <span class="muted review-time">{{ formatTime(review.createdAt) }}</span>
            </div>
            <p v-if="review.comment != null && review.comment.length > 0" class="review-comment">{{ review.comment }}</p>
            <p v-if="review.contract?.contractNo" class="review-contract muted">
              合同：{{ review.contract.contractNo }}
            </p>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="15">
        <el-card shadow="never">
          <template #header>编辑个人资料</template>
          <el-form label-position="top">
            <el-form-item label="用户名">
              <el-input v-model="form.username" />
            </el-form-item>
            <el-form-item label="技能标签（逗号分隔）">
              <el-input v-model="skillInput" />
            </el-form-item>
            <el-form-item label="简介">
              <el-input v-model="form.bio" type="textarea" :rows="4" />
            </el-form-item>
            <el-form-item label="联系方式">
              <el-input v-model="form.contact" />
            </el-form-item>
            <el-button type="primary" @click="save">保存资料</el-button>
          </el-form>
        </el-card>

        <div class="section">
          <h2>历史项目</h2>
          <div class="grid">
            <RequirementCard
              v-for="requirement in requirementStore.myRequirements"
              :key="requirement.id"
              :requirement="requirement"
            />
          </div>
          <div class="grid section">
            <ContractCard
              v-for="contract in contractStore.myContracts"
              :key="contract.id"
              :contract="contract"
            />
          </div>
        </div>
      </el-col>
    </el-row>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import ContractCard from '@/components/common/ContractCard.vue';
import RequirementCard from '@/components/common/RequirementCard.vue';
import SkillTag from '@/components/common/SkillTag.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useContractStore } from '@/stores/contract';
import { useRequirementStore } from '@/stores/requirement';
import { useReviewStore } from '@/stores/review';
import { useUserStore } from '@/stores/user';
import type { User } from '@/types';

const props = defineProps<{ id: string }>();
const userStore = useUserStore();
const requirementStore = useRequirementStore();
const contractStore = useContractStore();
const reviewStore = useReviewStore();
const profile = ref<User | null>(null);
const skillInput = ref('');
const form = reactive({
  username: '',
  bio: '',
  contact: ''
});

async function save() {
  const updated = await userStore.updateMe({
    ...form,
    skillTags: skillInput.value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  });
  profile.value = updated;
  ElMessage.success('资料已保存');
}

function formatTime(val?: string) {
  if (!val) return '';
  return new Date(val).toLocaleString('zh-CN');
}

onMounted(async () => {
  const [user] = await Promise.all([
    userStore.fetchUser(props.id),
    requirementStore.fetchMine(),
    contractStore.fetchMine(),
    reviewStore.fetchByUser(props.id)
  ]);
  profile.value = user;
  form.username = user.username;
  form.bio = user.bio || '';
  form.contact = user.contact || '';
  skillInput.value = (user.skillTags || []).join(', ');
});
</script>

<style scoped>
.rating-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.rating-text {
  font-weight: 700;
  color: #0f766e;
}

.review-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.review-time {
  font-size: 12px;
}

.review-comment {
  margin: 6px 0 0;
  padding-left: 44px;
  color: #374151;
  line-height: 1.6;
}

.review-contract {
  margin: 4px 0 0;
  padding-left: 44px;
  font-size: 12px;
}
</style>
