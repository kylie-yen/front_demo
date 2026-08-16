<template>
  <div v-if="damage" class="flex flex-col gap-5 pb-10">
    <!-- Top Header Bar -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
      <div class="flex items-center gap-4">
        <el-button circle plain size="default" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-bold text-slate-900">{{ damage.id }} · {{ damage.type }} ({{ damage.severity }})</h1>
            <StatusTag :value="damage.risk_level + '风险'" />
            <StatusTag :value="damage.status" />
          </div>
          <p class="text-xs text-slate-500 mt-1">
            发现于 {{ damage.created_at }} · 最近更新于 {{ damage.updated_at }} · 试点道路：{{ damage.road_name }} ({{ damage.mileage_m }}m处)
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <el-button v-if="damage.status !== '已销项'" plain type="info" @click="showCloseModal = true">
          标记销项 / 排除误报
        </el-button>

        <el-button
          v-if="damage.status === '待确认'"
          type="primary"
          plain
          @click="showInspectionModal = true"
        >
          派发人工巡检
        </el-button>

        <el-button
          v-if="damage.status === '已确认' || (damage.status === '待确认' && damage.confidence >= 60)"
          type="primary"
          @click="showWorkOrderModal = true"
        >
          创建维修工单
        </el-button>
      </div>
    </div>

    <!-- Main 2-Column Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- Left Column: Spatial & Explainable Risk Model (2 cols) -->
      <div class="lg:col-span-2 flex flex-col gap-5">
        <!-- 1. Explainable Risk Model & Formula -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
              <h3 class="text-sm font-bold text-slate-800">可解释风险评分模型 (0-100分)</h3>
            </div>
            <span class="text-xs text-slate-500 font-mono">risk_score = 0.30×危害 + 0.20×暴露 + 0.20×场景 + 0.15×趋势 + 0.15×后果</span>
          </div>

          <RiskFormulaBar :risk-score="damage.risk_score" :factors="damage.factors" />

          <!-- Radar Chart & Factors Explanation -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 items-center">
            <div class="h-56">
              <RiskScoreRadar :factors="damage.factors" />
            </div>
            <div class="flex flex-col gap-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <div class="font-semibold text-slate-800 pb-1 border-b border-slate-200/60">评分可解释性依据说明：</div>
              <div>• <strong>危害程度 ({{ damage.factors.harm_score }}分)：</strong>传感器垂向冲击加速度峰值达 24.8m/s²，显著超过 14.5m/s² 阈值。</div>
              <div>• <strong>暴露程度 ({{ damage.factors.exposure_score }}分)：</strong>该非机动车道为主要通勤路段，日均骑行流量估算超 1,200 辆次。</div>
              <div>• <strong>场景脆弱性 ({{ damage.factors.vulnerability_score }}分)：</strong>{{ damage.near_scenario_name || '邻近重要出入口，人车交织敏感' }}。</div>
              <div>• <strong>变化趋势 ({{ damage.factors.trend_score }}分)：</strong>过去7天内多次被不同骑行者连续触发颠簸事件。</div>
              <div>• <strong>后果严重性 ({{ damage.factors.consequence_score }}分)：</strong>坑洼深超 4cm，雨天易积水掩盖，极易引发前轮失稳摔倒。</div>
            </div>
          </div>
        </div>

        <!-- 2. Confidence Card & Sensor Shock Evidence -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <h3 class="text-sm font-bold text-slate-800 mb-3">感知置信度与传感器候选冲击事件证据链</h3>
          <ConfidenceCard :confidence="damage.confidence" :factors="damage.confidence_factors" />

          <!-- Linked Events Table -->
          <div class="mt-4 pt-3 border-t border-slate-100">
            <div class="text-xs font-semibold text-slate-700 mb-2">关联冲击事件清单 ({{ linkedEvents.length }} 条记录)</div>
            <el-table :data="linkedEvents" stripe size="small" style="width: 100%">
              <el-table-column prop="id" label="事件ID" width="100" />
              <el-table-column prop="occurred_at" label="发生时间" width="140" />
              <el-table-column prop="peak_acc" label="垂向加速度峰值" width="120">
                <template #default="{ row }">
                  <span class="font-bold text-red-600">{{ row.peak_acc }} m/s²</span>
                </template>
              </el-table-column>
              <el-table-column prop="rms" label="振动RMS" width="100">
                <template #default="{ row }">
                  <span>{{ row.rms }} m/s²</span>
                </template>
              </el-table-column>
              <el-table-column prop="event_class" label="识别分类" width="120">
                <template #default="{ row }">
                  <StatusTag :value="row.event_class" />
                </template>
              </el-table-column>
              <el-table-column prop="rule_hit_desc" label="规则与特征命中说明" min-width="180" />
            </el-table>
          </div>
        </div>

        <!-- 3. Site Photos -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-800">实地影像证据与照片档案</h3>
            <span class="text-xs text-slate-400">共 {{ damage.photos.length }} 张照片</span>
          </div>
          <div v-if="damage.photos && damage.photos.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="(img, idx) in damage.photos"
              :key="idx"
              class="relative h-44 rounded-xl overflow-hidden border border-slate-200 group"
            >
              <img :src="img" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <div class="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-3 py-1 flex items-center justify-between">
                <span>现场证据照片 #{{ idx + 1 }}</span>
                <span class="text-[10px] text-slate-300">核验有效</span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-xs text-slate-400">暂无现场照片</div>
        </div>
      </div>

      <!-- Right Column: Location Map & Closed Loop Execution Timeline (1 col) -->
      <div class="flex flex-col gap-5">
        <!-- Spatial Location & Mini Map -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
          <h3 class="text-sm font-bold text-slate-800">地理空间与道路桩号定位</h3>
          <div class="text-xs text-slate-600 flex flex-col gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div><strong>所在道路：</strong>{{ damage.road_name }}</div>
            <div><strong>桩号里程：</strong>{{ damage.mileage_m }} 米处 ({{ damage.direction }})</div>
            <div><strong>经纬度坐标：</strong><span class="font-mono">{{ damage.geometry[0].toFixed(4) }}, {{ damage.geometry[1].toFixed(4) }}</span></div>
            <div v-if="damage.near_scenario_name" class="text-amber-700 font-medium">⚠️ 敏感场景：{{ damage.near_scenario_name }}</div>
            <div v-if="damage.near_facility_name" class="text-indigo-700 font-medium">ℹ️ 关联设施：{{ damage.near_facility_name }}</div>
          </div>

          <!-- Embedded Map -->
          <div class="h-56 rounded-xl overflow-hidden border border-slate-200 relative">
            <GisMap :highlight-damage-id="damage.id" :custom-damages="[damage]" />
          </div>
        </div>

        <!-- Inspection Task Card (if exists) -->
        <div v-if="linkedInspection" class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-800">关联巡检核验任务</h4>
            <StatusTag :value="linkedInspection.status" />
          </div>
          <div class="text-xs text-slate-600 flex flex-col gap-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div><strong>任务编号：</strong>{{ linkedInspection.id }}</div>
            <div><strong>巡检人员：</strong>{{ linkedInspection.assignee_name }}</div>
            <div><strong>实测结论：</strong><span class="text-blue-600 font-semibold">{{ linkedInspection.result || '巡检中' }}</span></div>
            <div v-if="linkedInspection.measured_size"><strong>实测尺寸：</strong>{{ linkedInspection.measured_size }}</div>
            <div v-if="linkedInspection.remark" class="text-slate-500 italic mt-1">"{{ linkedInspection.remark }}"</div>
          </div>
        </div>

        <!-- Repair Work Order Card (if exists) -->
        <div v-if="linkedWorkOrder" class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-800">关联维修工单</h4>
            <StatusTag :value="linkedWorkOrder.status" />
          </div>
          <div class="text-xs text-slate-600 flex flex-col gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div><strong>工单编号：</strong>{{ linkedWorkOrder.id }} ({{ linkedWorkOrder.priority }})</div>
            <div><strong>施工班组：</strong>{{ linkedWorkOrder.team_name }}</div>
            <div><strong>维修方案：</strong>{{ linkedWorkOrder.solution_plan }}</div>
            <div v-if="linkedWorkOrder.repair_record" class="pt-1.5 border-t border-slate-200">
              <div class="text-emerald-700 font-semibold">✓ 完工提交时间：{{ linkedWorkOrder.repair_record.completed_at }}</div>
              <div class="text-emerald-700">复测振动 RMS：<strong>{{ linkedWorkOrder.repair_record.retest_vibration_rms }} m/s²</strong> ({{ linkedWorkOrder.repair_record.retest_status }})</div>
            </div>
          </div>
        </div>

        <!-- Closed Record (if status === 已销项) -->
        <div v-if="damage.status === '已销项'" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900">
          <div class="font-bold mb-1 flex items-center gap-1">
            <el-icon class="text-emerald-600"><Check /></el-icon>
            <span>已销项闭环归档说明</span>
          </div>
          <p class="leading-relaxed">{{ damage.close_reason || '维修复核通过或排除误报，该项已完成闭环销项。' }}</p>
        </div>

        <!-- State Machine Full Timeline -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <h3 class="text-sm font-bold text-slate-800 mb-4">全生命周期流转时间线</h3>
          <el-timeline>
            <el-timeline-item timestamp="2026-08-10 08:30" type="primary">
              <div class="text-xs font-semibold text-slate-800">感知识别并聚合生成</div>
              <div class="text-[11px] text-slate-500">通过众包骑行轨迹自动检测冲击并聚类为候选病害点，初始风险 88 分</div>
            </el-timeline-item>
            <el-timeline-item v-if="linkedInspection" timestamp="2026-08-10 15:30" type="success">
              <div class="text-xs font-semibold text-slate-800">人工巡检现场核实</div>
              <div class="text-[11px] text-slate-500">巡检员现场复核确认真实坑洼，测量尺寸长65×宽48×深4.5cm，状态变更为【已确认】</div>
            </el-timeline-item>
            <el-timeline-item v-if="linkedWorkOrder" timestamp="2026-08-14 11:30" type="warning">
              <div class="text-xs font-semibold text-slate-800">派发维修施工工单</div>
              <div class="text-[11px] text-slate-500">指派市政特快修二组排期处置，状态变更为【待维修】</div>
            </el-timeline-item>
            <el-timeline-item v-if="linkedWorkOrder?.repair_record" timestamp="2026-08-15 16:40" type="info">
              <div class="text-xs font-semibold text-slate-800">维修施工完工申报</div>
              <div class="text-[11px] text-slate-500">上传修补后照片及复测振动数据，状态变更为【已维修】并等待管理复核</div>
            </el-timeline-item>
            <el-timeline-item v-if="damage.status === '已销项'" timestamp="2026-08-16 09:00" type="success">
              <div class="text-xs font-semibold text-emerald-700">管理复核通过并销项</div>
              <div class="text-[11px] text-emerald-600">复核质量达标，状态变更为【已销项】，归档完成</div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <el-dialog v-model="showCloseModal" title="标记病害销项 / 排除误报" width="450px">
      <el-form label-position="top">
        <el-form-item label="销项原因类型">
          <el-radio-group v-model="closeReasonType">
            <el-radio value="判定为固定设施起伏 (硬负样本)">判定为固定设施起伏</el-radio>
            <el-radio value="误报 (单次避障动作)">误报 (单次避障动作)</el-radio>
            <el-radio value="现场已平整/无需处置">现场已平整/无需处置</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input v-model="closeRemark" type="textarea" :rows="3" placeholder="请输入销项依据..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCloseModal = false">取消</el-button>
        <el-button type="danger" @click="handleConfirmClose">确认销项</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showInspectionModal" title="派发人工巡检核验任务" width="480px">
      <el-form label-position="top">
        <el-form-item label="指派人员">
          <el-select v-model="inspectionAssignee" class="w-full">
            <el-option label="李建军 (巡检一班 · 负责永德路片区)" value="李建军 (巡检一班)" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInspectionModal = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmInspection">立即派发</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showWorkOrderModal" title="创建微病害维修工单" width="480px">
      <el-form label-position="top">
        <el-form-item label="指派施工班组">
          <el-select v-model="workOrderTeam" class="w-full">
            <el-option label="市政特快修二组 (王宏伟 · 沥青与冷补专项)" value="市政特快修二组 (王宏伟)" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWorkOrderModal = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmWorkOrder">立即派工</el-button>
      </template>
    </el-dialog>
  </div>
  <div v-else class="p-10 text-center text-slate-400">
    未找到指定病害记录，
    <el-button link type="primary" @click="router.push('/damages')">返回病害列表</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import StatusTag from '../components/StatusTag.vue';
import RiskFormulaBar from '../components/RiskFormulaBar.vue';
import RiskScoreRadar from '../components/RiskScoreRadar.vue';
import ConfidenceCard from '../components/ConfidenceCard.vue';
import GisMap from '../components/GisMap.vue';
import { ArrowLeft, Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const store = useAppStore();

const damageId = computed(() => String(route.params.id || ''));
const damage = computed(() => store.damages.find((d) => d.id === damageId.value) || store.damages[0]);

const linkedInspection = computed(() =>
  store.inspectionTasks.find((t) => t.damage_id === damage.value?.id)
);

const linkedWorkOrder = computed(() =>
  store.workOrders.find((w) => w.damage_id === damage.value?.id)
);

const linkedEvents = computed(() =>
  store.impactEvents.filter((e) => e.road_id === damage.value?.road_id)
);

// Modals
const showCloseModal = ref(false);
const closeReasonType = ref('判定为固定设施起伏 (硬负样本)');
const closeRemark = ref('');

const showInspectionModal = ref(false);
const inspectionAssignee = ref('李建军 (巡检一班)');

const showWorkOrderModal = ref(false);
const workOrderTeam = ref('市政特快修二组 (王宏伟)');

function handleConfirmClose() {
  if (!damage.value) return;
  const reason = `${closeReasonType.value} - ${closeRemark.value || '管理人员现场核验销项'}`;
  store.closeDamage(damage.value.id, reason);
  ElMessage.success(`病害 ${damage.value.id} 状态已更新为【已销项】`);
  showCloseModal.value = false;
}

function handleConfirmInspection() {
  if (!damage.value) return;
  store.createInspectionTask({
    damage_id: damage.value.id,
    assignee_name: inspectionAssignee.value,
  });
  ElMessage.success(`已为病害 ${damage.value.id} 成功创建巡检任务`);
  showInspectionModal.value = false;
}

function handleConfirmWorkOrder() {
  if (!damage.value) return;
  store.createWorkOrder({
    damage_id: damage.value.id,
    team_name: workOrderTeam.value,
  });
  ElMessage.success(`已为病害 ${damage.value.id} 成功生成维修工单`);
  showWorkOrderModal.value = false;
}
</script>
