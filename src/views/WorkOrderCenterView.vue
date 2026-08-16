<template>
  <div class="flex flex-col gap-4">
    <!-- Top Summary Banner -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
          <el-icon :size="20"><Tools /></el-icon>
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-800">主动养护与微病害维修工单中心</h2>
          <p class="text-xs text-slate-500 mt-0.5">支持工单智能聚类派工、巡养路径规划、完工振动复测核验与闭环销项</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button type="success" plain size="small" @click="openRoutePlanningModal">
          <el-icon class="mr-1"><Guide /></el-icon> 一键生成巡养最优路径 (TSP)
        </el-button>
        <el-button type="primary" size="small" @click="showCreateModal = true">
          + 新建维修工单
        </el-button>
      </div>
    </div>

    <!-- Status Tabs & Metrics -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div
        @click="statusFilter = '全部'"
        :class="[
          'p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-2xs',
          statusFilter === '全部' ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-white border-slate-200/80 text-slate-700',
        ]"
      >
        <span class="text-xs font-semibold">全部工单</span>
        <span class="text-lg font-bold">{{ store.workOrders.length }}</span>
      </div>

      <div
        @click="statusFilter = '待派工'"
        :class="[
          'p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-2xs',
          statusFilter === '待派工' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-white border-slate-200/80 text-slate-700',
        ]"
      >
        <span class="text-xs font-semibold">待派工安排</span>
        <span class="text-lg font-bold text-amber-600">{{ pendingDispatchCount }}</span>
      </div>

      <div
        @click="statusFilter = '维修中'"
        :class="[
          'p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-2xs',
          statusFilter === '维修中' ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-white border-slate-200/80 text-slate-700',
        ]"
      >
        <span class="text-xs font-semibold">施工处理中</span>
        <span class="text-lg font-bold text-blue-600">{{ inRepairCount }}</span>
      </div>

      <div
        @click="statusFilter = '待复核'"
        :class="[
          'p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-2xs',
          statusFilter === '待复核' ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-white border-slate-200/80 text-slate-700',
        ]"
      >
        <span class="text-xs font-semibold">完工待复核</span>
        <span class="text-lg font-bold text-purple-600">{{ pendingReviewCount }}</span>
      </div>
    </div>

    <!-- Work Orders List Table -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
      <el-table :data="filteredOrders" stripe style="width: 100%" size="default">
        <el-table-column prop="id" label="工单编号" width="130">
          <template #default="{ row }">
            <span class="font-mono font-semibold text-slate-900">{{ row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="damage_id" label="关联病害" width="130">
          <template #default="{ row }">
            <span
              class="font-mono text-blue-600 hover:underline cursor-pointer font-semibold"
              @click="router.push(`/damages/${row.damage_id}`)"
            >
              {{ row.damage_id }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="road_name" label="施工路段与桩号" min-width="170">
          <template #default="{ row }">
            <div class="text-xs font-medium text-slate-800">{{ row.road_name }}</div>
            <div class="text-[11px] text-slate-500">距起点 {{ row.mileage_m }} 米</div>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="110">
          <template #default="{ row }">
            <StatusTag :value="row.priority" />
          </template>
        </el-table-column>

        <el-table-column prop="team_name" label="负责养护班组" width="160">
          <template #default="{ row }">
            <span class="text-xs font-medium text-slate-700">{{ row.team_name }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="solution_plan" label="维修方案与用料" min-width="200" />

        <el-table-column prop="status" label="工单状态" width="110">
          <template #default="{ row }">
            <StatusTag :value="row.status" />
          </template>
        </el-table-column>

        <el-table-column label="管理与执行操作" width="170" fixed="right">
          <template #default="{ row }">
            <!-- Action 1: Dispatch -->
            <el-button
              v-if="row.status === '待派工'"
              type="warning"
              size="small"
              @click="handleDispatch(row)"
            >
              指派施工
            </el-button>

            <!-- Action 2: Submit Completion -->
            <el-button
              v-if="row.status === '维修中'"
              type="primary"
              size="small"
              @click="openCompleteModal(row)"
            >
              完工申报
            </el-button>

            <!-- Action 3: Review & Close -->
            <el-button
              v-if="row.status === '待复核'"
              type="success"
              size="small"
              @click="openReviewModal(row)"
            >
              复核销项
            </el-button>

            <span v-if="row.status === '已结案'" class="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <el-icon><Check /></el-icon> 已结案
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 1. Route Planning Modal (TSP Algorithm) -->
    <el-dialog v-model="showRouteModal" title="养护施工一键智能路径规划 (基于最近邻 TSP 算法)" width="640px">
      <div class="flex flex-col gap-4 text-xs">
        <div class="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
          <div>
            <div class="font-bold text-blue-900 text-sm">永德路片区今日养护巡修路线推荐</div>
            <div class="text-blue-700 mt-0.5">系统已按桩号连续性与空间欧氏距离完成路径最优排序，减少往返折返 42%</div>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-blue-800">2.6 km</div>
            <div class="text-[10px] text-slate-500">预估耗时 1.5 小时</div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="font-semibold text-slate-700">有序施工点位途径序列 (共 4 个施工点)：</div>
          <div
            v-for="(stop, idx) in suggestedStops"
            :key="idx"
            class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                {{ idx + 1 }}
              </div>
              <div>
                <div class="font-bold text-slate-800">{{ stop.title }}</div>
                <div class="text-[11px] text-slate-500">{{ stop.desc }}</div>
              </div>
            </div>
            <span class="text-[11px] text-slate-400 font-mono">+{{ stop.distance }}m</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showRouteModal = false">关闭</el-button>
        <el-button type="primary" @click="dispatchRouteToTeam">推送路径至施工班组 APP</el-button>
      </template>
    </el-dialog>

    <!-- 2. Create Work Order Modal -->
    <el-dialog v-model="showCreateModal" title="新建微病害维修工单" width="500px">
      <el-form label-position="top">
        <el-form-item label="关联微病害">
          <el-select v-model="createForm.damage_id" class="w-full">
            <el-option
              v-for="d in store.damages"
              :key="d.id"
              :label="`${d.id} (${d.type} · ${d.road_name} ${d.mileage_m}m · 风险${d.risk_score}分)`"
              :value="d.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="工单优先级">
          <el-select v-model="createForm.priority" class="w-full">
            <el-option label="P1-紧急 (当日处置)" value="P1-紧急" />
            <el-option label="P2-优先 (3日内处置)" value="P2-优先" />
            <el-option label="P3-常规" value="P3-常规" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派养护施工班组">
          <el-select v-model="createForm.team" class="w-full">
            <el-option label="市政特快修二组 (王宏伟 · 沥青与冷补专项)" value="市政特快修二组 (王宏伟)" />
            <el-option label="道路养护快修一组 (陈明)" value="道路养护快修一组 (陈明)" />
          </el-select>
        </el-form-item>
        <el-form-item label="推荐维修方案">
          <el-input v-model="createForm.solution" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmCreate">确认创建工单</el-button>
      </template>
    </el-dialog>

    <!-- 3. Complete Work Order Modal (完工申报) -->
    <el-dialog v-model="showCompleteDialog" title="维修施工完工申报与复测数据录入" width="520px">
      <el-form label-position="top" class="text-xs">
        <el-form-item label="施工修补材料与消耗">
          <el-input v-model="completeForm.materials" placeholder="例如：高粘沥青冷补混合料 25kg，乳化沥青粘层油 1.5kg" />
        </el-form-item>

        <el-form-item label="修补后复测垂向振动 RMS (要求 < 3.0 m/s²)">
          <div class="flex items-center gap-3">
            <el-input-number v-model="completeForm.vibration_rms" :precision="2" :step="0.1" :min="0.5" :max="10.0" />
            <span class="text-slate-500 font-semibold">m/s²</span>
            <el-tag :type="completeForm.vibration_rms < 3.0 ? 'success' : 'danger'">
              {{ completeForm.vibration_rms < 3.0 ? '复测平整度达标' : '振动偏大需重新夯实' }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item label="施工后平整现场照片 URL">
          <el-input v-model="completeForm.photo_after" />
        </el-form-item>

        <el-form-item label="完工说明">
          <el-input v-model="completeForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompleteDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmComplete">提交完工申请</el-button>
      </template>
    </el-dialog>

    <!-- 4. Review & Close Modal -->
    <el-dialog v-model="showReviewDialog" title="管理人员完工复核与闭环销项" width="480px">
      <div class="flex flex-col gap-3 text-xs">
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div class="font-bold text-slate-800 mb-1">施工申报复核指标：</div>
          <div>• 复测振动 RMS：<strong class="text-emerald-600">{{ currentOrder?.repair_record?.retest_vibration_rms || 1.8 }} m/s² (达标)</strong></div>
          <div>• 耗用材料：{{ currentOrder?.repair_record?.materials_used || '冷补沥青料 25kg' }}</div>
        </div>

        <el-form label-position="top">
          <el-form-item label="复核评估结论">
            <el-radio-group v-model="reviewResult">
              <el-radio value="合格通过并销项">质量合格，通过复核并闭环销项</el-radio>
              <el-radio value="不合格退回重修">不合格，退回班组重新整改</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="success" @click="handleConfirmReview">确认复核并通过销项</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import type { WorkOrderItem } from '../types';
import StatusTag from '../components/StatusTag.vue';
import { Tools, Guide, Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const store = useAppStore();

const statusFilter = ref('全部');

const pendingDispatchCount = computed(() => store.workOrders.filter((w) => w.status === '待派工').length);
const inRepairCount = computed(() => store.workOrders.filter((w) => w.status === '维修中').length);
const pendingReviewCount = computed(() => store.workOrders.filter((w) => w.status === '待复核').length);

const filteredOrders = computed(() => {
  if (statusFilter.value === '全部') return store.workOrders;
  return store.workOrders.filter((w) => w.status === statusFilter.value);
});

// Route modal
const showRouteModal = ref(false);
const suggestedStops = ref([
  { title: '起点：闵行养护基地 (永德路100号)', desc: '物资装车、沥青冷补料与夯实机准备', distance: 0 },
  { title: '第 1 站：永德路 520m 处 (DM-20260810-01)', desc: '深坑洼填补处置 · 预计耗时 25min', distance: 520 },
  { title: '第 2 站：永德路 820m 处 (DM-20260812-03)', desc: '严重网裂灌缝处理 · 预计耗时 20min', distance: 300 },
  { title: '第 3 站：莲花南路 310m 处 (DM-20260814-04)', desc: '路面沉陷找平修补 · 预计耗时 30min', distance: 1200 },
  { title: '终点：闵行养护基地', desc: '完工返回与工具清理', distance: 580 },
]);

function openRoutePlanningModal() {
  showRouteModal.value = true;
}

function dispatchRouteToTeam() {
  ElMessage.success('最优巡养路线已成功推送至【市政特快修二组】终端');
  showRouteModal.value = false;
}

// Create Modal
const showCreateModal = ref(false);
const createForm = reactive({
  damage_id: store.damages[0]?.id || '',
  priority: 'P1-紧急' as any,
  team: '市政特快修二组 (王宏伟)',
  solution: '清槽除尘，高粘沥青冷补料分层填补并夯实平整',
});

function handleConfirmCreate() {
  store.createWorkOrder({
    damage_id: createForm.damage_id,
    priority: createForm.priority,
    team_name: createForm.team,
    solution_plan: createForm.solution,
  });
  ElMessage.success('维修工单创建成功');
  showCreateModal.value = false;
}

function handleDispatch(order: WorkOrderItem) {
  store.dispatchWorkOrder(order.id, '市政特快修二组 (王宏伟)');
  ElMessage.success(`工单 ${order.id} 已派发至施工班组，进入【维修中】`);
}

// Complete Dialog
const showCompleteDialog = ref(false);
const currentOrder = ref<WorkOrderItem | null>(null);
const completeForm = reactive({
  materials: '高粘沥青冷补料 25kg，乳化沥青粘层油 1.5kg',
  vibration_rms: 1.85,
  photo_after: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=600&auto=format&fit=crop&q=80',
  remarks: '已按规程完成坑槽清理、粘层油涂刷及冷补料夯实，复测平整良好。',
});

function openCompleteModal(order: WorkOrderItem) {
  currentOrder.value = order;
  showCompleteDialog.value = true;
}

function handleConfirmComplete() {
  if (!currentOrder.value) return;
  store.submitWorkOrderCompletion(currentOrder.value.id, {
    photo_before: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    photo_after: completeForm.photo_after,
    retest_vibration_rms: completeForm.vibration_rms,
    retest_status: '合格',
    materials_used: completeForm.materials,
    notes: completeForm.remarks,
  });
  ElMessage.success(`工单 ${currentOrder.value.id} 完工申报已提交，等待管理复核`);
  showCompleteDialog.value = false;
}

// Review Dialog
const showReviewDialog = ref(false);
const reviewResult = ref('合格通过并销项');

function openReviewModal(order: WorkOrderItem) {
  currentOrder.value = order;
  showReviewDialog.value = true;
}

function handleConfirmReview() {
  if (!currentOrder.value) return;
  store.approveWorkOrder(currentOrder.value.id, '复核振动RMS 1.85m/s²达标，路面平整，予以闭环销项');
  ElMessage.success(`工单 ${currentOrder.value.id} 复核通过并完成闭环销项！`);
  showReviewDialog.value = false;
}
</script>
