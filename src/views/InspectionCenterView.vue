<template>
  <div class="flex flex-col gap-4">
    <!-- Top Summary Banner -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
          <el-icon :size="20"><Checked /></el-icon>
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-800">人工核验与精准巡检任务中心</h2>
          <p class="text-xs text-slate-500 mt-0.5">针对置信度不足 (&lt;60%) 或高风险候选微病害，下发人工巡检实地复核与尺寸量测</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button type="primary" size="small" @click="showCreateModal = true">
          + 新建巡检任务
        </el-button>
      </div>
    </div>

    <!-- Status Tabs & Metrics -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div
        @click="statusFilter = '全部'"
        :class="[
          'p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-2xs',
          statusFilter === '全部' ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-white border-slate-200/80 text-slate-700',
        ]"
      >
        <span class="text-xs font-semibold">全部巡检任务</span>
        <span class="text-lg font-bold">{{ store.inspectionTasks.length }}</span>
      </div>

      <div
        @click="statusFilter = '待巡检'"
        :class="[
          'p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-2xs',
          statusFilter === '待巡检' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-white border-slate-200/80 text-slate-700',
        ]"
      >
        <span class="text-xs font-semibold">待现场核验</span>
        <span class="text-lg font-bold text-amber-600">{{ pendingCount }}</span>
      </div>

      <div
        @click="statusFilter = '巡检中'"
        :class="[
          'p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-2xs',
          statusFilter === '巡检中' ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-white border-slate-200/80 text-slate-700',
        ]"
      >
        <span class="text-xs font-semibold">正在巡检中</span>
        <span class="text-lg font-bold text-blue-600">{{ inProgressCount }}</span>
      </div>

      <div
        @click="statusFilter = '已完成'"
        :class="[
          'p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-2xs',
          statusFilter === '已完成' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200/80 text-slate-700',
        ]"
      >
        <span class="text-xs font-semibold">已完成核验</span>
        <span class="text-lg font-bold text-emerald-600">{{ completedCount }}</span>
      </div>
    </div>

    <!-- Task List Table -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
      <el-table :data="filteredTasks" stripe style="width: 100%" size="default">
        <el-table-column prop="id" label="任务编号" width="130">
          <template #default="{ row }">
            <span class="font-mono font-semibold text-slate-900">{{ row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="damage_id" label="关联病害" width="140">
          <template #default="{ row }">
            <span
              class="font-mono text-blue-600 hover:underline cursor-pointer font-semibold"
              @click="router.push(`/damages/${row.damage_id}`)"
            >
              {{ row.damage_id }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="road_name" label="巡检地点与桩号" min-width="180">
          <template #default="{ row }">
            <div class="text-xs font-medium text-slate-800">{{ row.road_name }}</div>
            <div class="text-[11px] text-slate-500">距起点约 {{ row.mileage_m }} 米</div>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <StatusTag :value="row.priority" />
          </template>
        </el-table-column>

        <el-table-column prop="assignee_name" label="指派人员" width="130">
          <template #default="{ row }">
            <span class="text-xs font-medium text-slate-700">{{ row.assignee_name }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="任务状态" width="110">
          <template #default="{ row }">
            <StatusTag :value="row.status" />
          </template>
        </el-table-column>

        <el-table-column prop="result" label="实测核验结论" min-width="180">
          <template #default="{ row }">
            <div v-if="row.result" class="text-xs">
              <span class="font-bold text-blue-600">{{ row.result }}</span>
              <div v-if="row.measured_size" class="text-[11px] text-slate-500 mt-0.5">实测: {{ row.measured_size }}</div>
            </div>
            <span v-else class="text-xs text-slate-400">待现场核验录入</span>
          </template>
        </el-table-column>

        <el-table-column prop="deadline" label="截止时间" width="140" />

        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== '已完成'"
              type="primary"
              size="small"
              @click="openCompleteModal(row)"
            >
              录入核验结果
            </el-button>
            <span v-else class="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <el-icon><Check /></el-icon> 已归档
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 1. Create Task Modal -->
    <el-dialog v-model="showCreateModal" title="新建人工核验巡检任务" width="480px">
      <el-form label-position="top">
        <el-form-item label="关联候选微病害">
          <el-select v-model="createForm.damage_id" class="w-full">
            <el-option
              v-for="d in store.damages"
              :key="d.id"
              :label="`${d.id} (${d.type} · ${d.road_name} ${d.mileage_m}m · 风险${d.risk_score}分)`"
              :value="d.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务优先级">
          <el-select v-model="createForm.priority" class="w-full">
            <el-option label="紧急" value="紧急" />
            <el-option label="高" value="高" />
            <el-option label="普通" value="普通" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派巡检员">
          <el-select v-model="createForm.assignee" class="w-full">
            <el-option label="李建军 (巡检一班 · 永德路)" value="李建军 (巡检一班)" />
            <el-option label="赵志强 (巡检二班 · 剑川路)" value="赵志强 (巡检二班)" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmCreate">确认派发</el-button>
      </template>
    </el-dialog>

    <!-- 2. Submit Verification Result Modal -->
    <el-dialog v-model="showVerifyModal" title="录入现场实测核验结果" width="520px">
      <el-form label-position="top" class="text-xs">
        <el-form-item label="现场实测核验结论">
          <el-radio-group v-model="verifyForm.result">
            <el-radio value="确认真实病害">确认真实微病害 (将流转为【已确认】)</el-radio>
            <el-radio value="判定为固定设施">判定为固定设施起伏 (硬负样本销项)</el-radio>
            <el-radio value="排除误报">排除误报 (单次避障/传感器偶发抖动销项)</el-radio>
            <el-radio value="程度较轻无需维修">程度较轻无需维修 (降级存档)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="实测几何尺寸 (长×宽×深/高)">
          <el-input v-model="verifyForm.measured_size" placeholder="例如：长 65cm × 宽 48cm × 深 4.5cm" />
        </el-form-item>

        <el-form-item label="现场照片上传 (证据链补齐)">
          <div class="flex items-center gap-2">
            <el-input v-model="verifyForm.photo_url" placeholder="现场照片 URL" class="flex-1" />
            <el-button size="small" @click="useDefaultPhoto">填入现场照片</el-button>
          </div>
        </el-form-item>

        <el-form-item label="核验说明与处置建议">
          <el-input v-model="verifyForm.remark" type="textarea" :rows="2" placeholder="填写现场路面状况详细描述..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVerifyModal = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmVerify">提交核验结论</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import type { InspectionTaskItem } from '../types';
import StatusTag from '../components/StatusTag.vue';
import { Checked, Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const store = useAppStore();

const statusFilter = ref('全部');

const pendingCount = computed(() => store.inspectionTasks.filter((t) => t.status === '待巡检').length);
const inProgressCount = computed(() => store.inspectionTasks.filter((t) => t.status === '巡检中').length);
const completedCount = computed(() => store.inspectionTasks.filter((t) => t.status === '已完成').length);

const filteredTasks = computed(() => {
  if (statusFilter.value === '全部') return store.inspectionTasks;
  return store.inspectionTasks.filter((t) => t.status === statusFilter.value);
});

// Create Modal
const showCreateModal = ref(false);
const createForm = reactive({
  damage_id: store.damages[0]?.id || '',
  priority: '紧急' as any,
  assignee: '李建军 (巡检一班)',
});

function handleConfirmCreate() {
  store.createInspectionTask({
    damage_id: createForm.damage_id,
    priority: createForm.priority,
    assignee_name: createForm.assignee,
  });
  ElMessage.success('已成功创建巡检核验任务并通知巡检人员');
  showCreateModal.value = false;
}

// Verify Modal
const showVerifyModal = ref(false);
const currentTask = ref<InspectionTaskItem | null>(null);
const verifyForm = reactive({
  result: '确认真实病害' as any,
  measured_size: '长 65cm × 宽 48cm × 深 4.5cm',
  photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
  remark: '现场实测坑洼较深，边缘破损锋利，严重影响骑行安全，建议立即安排冷补沥青填补。',
});

function openCompleteModal(task: InspectionTaskItem) {
  currentTask.value = task;
  showVerifyModal.value = true;
}

function useDefaultPhoto() {
  verifyForm.photo_url = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
}

function handleConfirmVerify() {
  if (!currentTask.value) return;
  store.submitInspectionResult(currentTask.value.id, {
    result: verifyForm.result,
    measured_size: verifyForm.measured_size,
    photos: [verifyForm.photo_url],
    remark: verifyForm.remark,
  });
  ElMessage.success(`巡检任务 ${currentTask.value.id} 核验结果已录入，病害状态已同步自动流转`);
  showVerifyModal.value = false;
}
</script>
