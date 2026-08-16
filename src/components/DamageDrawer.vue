<template>
  <el-drawer
    v-model="visible"
    :title="damage ? `病害详情档案 · ${damage.id}` : '病害详情'"
    size="560px"
    destroy-on-close
    direction="rtl"
  >
    <div v-if="damage" class="flex flex-col gap-4 text-slate-800 pb-16">
      <!-- Header Banner with Status & Risk Badge -->
      <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            :class="[
              'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm',
              damage.risk_level === '高' ? 'bg-red-500' : damage.risk_level === '中' ? 'bg-amber-500' : 'bg-blue-500',
            ]"
          >
            {{ damage.risk_score }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-slate-900">{{ damage.type }} · {{ damage.severity }}</h3>
              <StatusTag :value="damage.risk_level + '风险'" />
              <StatusTag :value="damage.status" />
            </div>
            <p class="text-xs text-slate-500 mt-1">编号: {{ damage.id }} | 发现于 {{ damage.created_at }}</p>
          </div>
        </div>
      </div>

      <!-- Location & Road Info -->
      <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
        <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">空间定位信息</h4>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span class="text-slate-400">所在道路：</span>
            <span class="font-medium text-slate-800">{{ damage.road_name }}</span>
          </div>
          <div>
            <span class="text-slate-400">车道方向：</span>
            <span class="font-medium text-slate-800">{{ damage.direction }}</span>
          </div>
          <div>
            <span class="text-slate-400">桩号里程：</span>
            <span class="font-medium text-slate-800">{{ damage.mileage_m }} 米处</span>
          </div>
          <div>
            <span class="text-slate-400">WGS84 坐标：</span>
            <span class="font-mono text-slate-700">{{ damage.geometry[0].toFixed(4) }}, {{ damage.geometry[1].toFixed(4) }}</span>
          </div>
        </div>

        <div v-if="damage.near_scenario_name" class="mt-2.5 pt-2 border-t border-slate-100 text-xs flex items-center gap-1.5 text-amber-700">
          <el-icon><WarningFilled /></el-icon>
          <span><strong>敏感场景叠加：</strong>{{ damage.near_scenario_name }}</span>
        </div>
        <div v-if="damage.near_facility_name" class="mt-1 text-xs flex items-center gap-1.5 text-indigo-700">
          <el-icon><InfoFilled /></el-icon>
          <span><strong>关联固定设施：</strong>{{ damage.near_facility_name }}</span>
        </div>
      </div>

      <!-- Explainable Risk Formula & 5-Dimension Radar -->
      <RiskFormulaBar :risk-score="damage.risk_score" :factors="damage.factors" />

      <!-- Confidence Card -->
      <ConfidenceCard :confidence="damage.confidence" :factors="damage.confidence_factors" />

      <!-- Photos Gallery -->
      <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
        <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">现场核验与感知影像</h4>
        <div v-if="damage.photos && damage.photos.length" class="grid grid-cols-2 gap-2">
          <div
            v-for="(photo, i) in damage.photos"
            :key="i"
            class="relative rounded-lg overflow-hidden border border-slate-200 h-28 group"
          >
            <img :src="photo" class="w-full h-full object-cover group-hover:scale-105 transition" />
            <div class="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-2 py-0.5">
              实地证据 #{{ i + 1 }}
            </div>
          </div>
        </div>
        <div v-else class="text-center py-4 text-xs text-slate-400">暂无现场照片</div>
      </div>

      <!-- Closed Reason if already closed -->
      <div v-if="damage.status === '已销项'" class="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900">
        <div class="font-semibold mb-1 flex items-center gap-1.5">
          <el-icon class="text-emerald-600"><Check /></el-icon>
          <span>已闭环销项记录</span>
        </div>
        <p>{{ damage.close_reason || '维修复核通过或核实为硬负样本设施，已正常归档。' }}</p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="fixed bottom-0 right-0 w-[560px] bg-white border-t border-slate-200 p-3.5 flex items-center justify-between gap-2 shadow-lg z-50">
        <el-button @click="goToFullDetail" plain>
          查看完整详情页
        </el-button>

        <div class="flex items-center gap-2">
          <!-- Close action -->
          <el-button
            v-if="damage.status !== '已销项'"
            type="info"
            plain
            size="default"
            @click="showCloseModal = true"
          >
            标记销项/误报
          </el-button>

          <!-- Create Inspection if 待确认 -->
          <el-button
            v-if="damage.status === '待确认'"
            type="primary"
            plain
            size="default"
            @click="showInspectionModal = true"
          >
            派发巡检任务
          </el-button>

          <!-- Create Work Order if 已确认 or 高风险待处理 -->
          <el-button
            v-if="damage.status === '已确认' || (damage.status === '待确认' && damage.confidence >= 60)"
            type="primary"
            size="default"
            @click="showWorkOrderModal = true"
          >
            创建维修工单
          </el-button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- 1. Close Modal -->
    <el-dialog v-model="showCloseModal" title="标记病害销项 / 排除误报" width="450px" append-to-body>
      <el-form label-position="top">
        <el-form-item label="销项类型">
          <el-radio-group v-model="closeReasonType">
            <el-radio value="判定为固定设施起伏 (硬负样本)">判定为固定设施起伏</el-radio>
            <el-radio value="误报 (单次颠簸/避障动作)">误报 (单次避障动作)</el-radio>
            <el-radio value="现场已平整/无需处置">现场已平整/无需处置</el-radio>
            <el-radio value="其他原因">其他原因</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="详细说明与销项备注">
          <el-input v-model="closeRemark" type="textarea" :rows="3" placeholder="请输入详细销项原因，将记录于审计日志中..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCloseModal = false">取消</el-button>
        <el-button type="danger" @click="handleConfirmClose">确认销项</el-button>
      </template>
    </el-dialog>

    <!-- 2. Inspection Task Modal -->
    <el-dialog v-model="showInspectionModal" title="创建并派发人工巡检任务" width="480px" append-to-body>
      <el-form label-position="top" class="text-xs">
        <el-form-item label="关联病害">
          <el-input :model-value="damage ? `${damage.id} (${damage.type} · ${damage.road_name})` : ''" disabled />
        </el-form-item>
        <el-form-item label="任务优先级">
          <el-select v-model="inspectionForm.priority" class="w-full">
            <el-option label="紧急 (高风险/学校地铁周边优先)" value="紧急" />
            <el-option label="高" value="高" />
            <el-option label="普通" value="普通" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派巡检人员">
          <el-select v-model="inspectionForm.assignee" class="w-full">
            <el-option label="李建军 (巡检一班 · 负责永德路片区)" value="李建军 (巡检一班)" />
            <el-option label="赵志强 (巡检二班 · 负责剑川路片区)" value="赵志强 (巡检二班)" />
          </el-select>
        </el-form-item>
        <el-form-item label="要求完成时间 (截止时间)">
          <el-date-picker v-model="inspectionForm.deadline" type="datetime" placeholder="选择截止时间" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInspectionModal = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmInspection">立即派发任务</el-button>
      </template>
    </el-dialog>

    <!-- 3. Work Order Modal -->
    <el-dialog v-model="showWorkOrderModal" title="创建微病害维修工单" width="500px" append-to-body>
      <el-form label-position="top">
        <el-form-item label="关联病害点">
          <el-input :model-value="damage ? `${damage.id} (${damage.type} · 风险${damage.risk_score}分)` : ''" disabled />
        </el-form-item>
        <el-form-item label="工单优先级">
          <el-select v-model="workOrderForm.priority" class="w-full">
            <el-option label="P1-紧急 (当日响应处置)" value="P1-紧急" />
            <el-option label="P2-优先 (3日内处置)" value="P2-优先" />
            <el-option label="P3-常规 (周度养护计划)" value="P3-常规" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派养护施工班组">
          <el-select v-model="workOrderForm.team" class="w-full">
            <el-option label="市政特快修二组 (王宏伟 · 沥青与冷补专项)" value="市政特快修二组 (王宏伟)" />
            <el-option label="道路养护快修一组 (陈明)" value="道路养护快修一组 (陈明)" />
          </el-select>
        </el-form-item>
        <el-form-item label="建议维修技术方案">
          <el-input v-model="workOrderForm.solution" type="textarea" :rows="2" placeholder="如：清槽除尘、喷洒粘层油、高粘改性冷补料夯实找平..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWorkOrderModal = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmWorkOrder">生成工单并派发</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import type { DamageItem } from '../types';
import StatusTag from './StatusTag.vue';
import RiskFormulaBar from './RiskFormulaBar.vue';
import ConfidenceCard from './ConfidenceCard.vue';
import { WarningFilled, InfoFilled, Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';

const props = defineProps<{
  modelValue: boolean;
  damage: DamageItem | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'updated'): void;
}>();

const router = useRouter();
const store = useAppStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// Modals state
const showCloseModal = ref(false);
const closeReasonType = ref('判定为固定设施起伏 (硬负样本)');
const closeRemark = ref('');

const showInspectionModal = ref(false);
const inspectionForm = reactive({
  priority: '紧急' as '紧急' | '高' | '普通',
  assignee: '李建军 (巡检一班)',
  deadline: dayjs().add(2, 'day').toDate(),
});

const showWorkOrderModal = ref(false);
const workOrderForm = reactive({
  priority: 'P1-紧急' as any,
  team: '市政特快修二组 (王宏伟)',
  solution: '清槽除尘，高粘沥青冷补料分层填补并夯实平整',
});

function goToFullDetail() {
  if (props.damage) {
    visible.value = false;
    router.push(`/damages/${props.damage.id}`);
  }
}

function handleConfirmClose() {
  if (!props.damage) return;
  const fullReason = `${closeReasonType.value} - ${closeRemark.value || '经管理人员研判后销项'}`;
  store.closeDamage(props.damage.id, fullReason);
  ElMessage.success(`病害 ${props.damage.id} 已成功标记为【已销项】`);
  showCloseModal.value = false;
  emit('updated');
}

function handleConfirmInspection() {
  if (!props.damage) return;
  store.createInspectionTask({
    damage_id: props.damage.id,
    priority: inspectionForm.priority,
    assignee_name: inspectionForm.assignee,
    deadline: dayjs(inspectionForm.deadline).format('YYYY-MM-DD HH:mm'),
  });
  ElMessage.success(`已为病害 ${props.damage.id} 生成巡检任务并派发`);
  showInspectionModal.value = false;
  emit('updated');
}

function handleConfirmWorkOrder() {
  if (!props.damage) return;
  store.createWorkOrder({
    damage_id: props.damage.id,
    priority: workOrderForm.priority,
    team_name: workOrderForm.team,
    solution_plan: workOrderForm.solution,
  });
  ElMessage.success(`已为高风险病害 ${props.damage.id} 成功创建维修工单`);
  showWorkOrderModal.value = false;
  emit('updated');
}
</script>
