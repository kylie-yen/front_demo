<template>
  <div class="flex flex-col gap-4">
    <!-- Top Header -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
          <el-icon :size="20"><Setting /></el-icon>
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-800">系统运行参数、算法权重与权限设置</h2>
          <p class="text-xs text-slate-500 mt-0.5">配置可解释风险模型权重、空间聚类与负样本抑制半径、用户角色及审计追踪</p>
        </div>
      </div>

      <el-button type="primary" size="small" @click="saveSystemSettings">
        保存并应用全局配置
      </el-button>
    </div>

    <!-- Main Tabs -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
      <el-tabs v-model="activeTab" class="custom-setting-tabs">
        <!-- Tab 1: Risk Weights & Parameters -->
        <el-tab-pane label="可解释风险评估模型权重" name="risk_weights">
          <div class="flex flex-col gap-4 max-w-3xl">
            <div class="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
              <div>
                <strong>风险权重归一化校验：</strong>当前权重之和为
                <strong class="text-blue-700 font-mono">{{ totalWeight.toFixed(2) }}</strong>
                <span v-if="totalWeight === 1.0" class="text-emerald-600 ml-1">✓ 严格满足 1.00 标准</span>
                <span v-else class="text-red-600 ml-1">⚠️ 权重之和必须等于 1.00</span>
              </div>
              <el-button size="small" @click="resetWeights">恢复默认权重</el-button>
            </div>

            <!-- Formula display -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700">
              <span class="font-bold text-blue-600">risk_score</span> = {{ weights.harm.toFixed(2) }}×危害 + {{ weights.exposure.toFixed(2) }}×暴露 + {{ weights.vulnerability.toFixed(2) }}×场景 + {{ weights.trend.toFixed(2) }}×趋势 + {{ weights.consequence.toFixed(2) }}×后果
            </div>

            <!-- Weight Sliders -->
            <div class="flex flex-col gap-4 text-xs">
              <div>
                <div class="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>1. 危害程度权重 (Harm Weight)</span>
                  <span class="font-mono text-blue-600">{{ weights.harm.toFixed(2) }} ({{ (weights.harm * 100).toFixed(0) }}%)</span>
                </div>
                <el-slider v-model="weights.harm" :min="0.1" :max="0.6" :step="0.05" show-stops />
                <span class="text-[11px] text-slate-400">基于传感器垂直振动峰值、持续时间与严重程度估算</span>
              </div>

              <div>
                <div class="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>2. 暴露程度权重 (Exposure Weight)</span>
                  <span class="font-mono text-blue-600">{{ weights.exposure.toFixed(2) }} ({{ (weights.exposure * 100).toFixed(0) }}%)</span>
                </div>
                <el-slider v-model="weights.exposure" :min="0.1" :max="0.5" :step="0.05" show-stops />
                <span class="text-[11px] text-slate-400">基于路段早晚高峰骑行流量、独立骑行者复现采样频次</span>
              </div>

              <div>
                <div class="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>3. 场景脆弱性权重 (Vulnerability Weight)</span>
                  <span class="font-mono text-blue-600">{{ weights.vulnerability.toFixed(2) }} ({{ (weights.vulnerability * 100).toFixed(0) }}%)</span>
                </div>
                <el-slider v-model="weights.vulnerability" :min="0.1" :max="0.5" :step="0.05" show-stops />
                <span class="text-[11px] text-slate-400">与学校、地铁站出入口、连续长下坡、主干路出入口空间缓冲区叠加</span>
              </div>

              <div>
                <div class="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>4. 变化趋势权重 (Trend Weight)</span>
                  <span class="font-mono text-blue-600">{{ weights.trend.toFixed(2) }} ({{ (weights.trend * 100).toFixed(0) }}%)</span>
                </div>
                <el-slider v-model="weights.trend" :min="0.05" :max="0.4" :step="0.05" show-stops />
                <span class="text-[11px] text-slate-400">过去多日连续复现与路面恶化加速趋势特征</span>
              </div>

              <div>
                <div class="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>5. 后果严重性权重 (Consequence Weight)</span>
                  <span class="font-mono text-blue-600">{{ weights.consequence.toFixed(2) }} ({{ (weights.consequence * 100).toFixed(0) }}%)</span>
                </div>
                <el-slider v-model="weights.consequence" :min="0.05" :max="0.4" :step="0.05" show-stops />
                <span class="text-[11px] text-slate-400">导致摔倒失稳、冲出非机动车道进入机动车流的次生危险</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 2: Sensing & Spatial Thresholds -->
        <el-tab-pane label="感知与空间算法阈值" name="thresholds">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl text-xs">
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
              <span class="font-bold text-slate-800">高风险阈值分</span>
              <span class="text-slate-500 text-[11px]">达到该分值立即标定为红色高风险并进入优先处置队列</span>
              <div class="flex items-center gap-2 mt-1">
                <el-input-number v-model="params.highRiskThreshold" :min="50" :max="90" />
                <span class="font-semibold text-red-600">分 (当前 ≥ 70)</span>
              </div>
            </div>

            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
              <span class="font-bold text-slate-800">低风险阈值分</span>
              <span class="text-slate-500 text-[11px]">低于该分值标定为蓝色低风险，仅纳入常态巡检观测</span>
              <div class="flex items-center gap-2 mt-1">
                <el-input-number v-model="params.lowRiskThreshold" :min="20" :max="50" />
                <span class="font-semibold text-blue-600">分 (当前 &lt; 40)</span>
              </div>
            </div>

            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
              <span class="font-bold text-slate-800">人工巡检复核建议阈值</span>
              <span class="text-slate-500 text-[11px]">置信度低于该值时，系统高亮提示需人工现场核验</span>
              <div class="flex items-center gap-2 mt-1">
                <el-input-number v-model="params.confidenceThreshold" :min="40" :max="80" />
                <span class="font-semibold text-amber-600">% (当前 &lt; 60%)</span>
              </div>
            </div>

            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
              <span class="font-bold text-slate-800">垂向加速度冲击识别阈值</span>
              <span class="text-slate-500 text-[11px]">垂直方向瞬时加速度波形超过此值时触发颠簸事件捕获</span>
              <div class="flex items-center gap-2 mt-1">
                <el-input-number v-model="params.accPeakThreshold" :min="10.0" :max="25.0" :step="0.5" :precision="1" />
                <span class="font-semibold text-slate-700">m/s² (当前 14.5)</span>
              </div>
            </div>

            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
              <span class="font-bold text-slate-800">固定设施硬负样本抑制半径</span>
              <span class="text-slate-500 text-[11px]">与井盖/接缝距离在此半径内时，自动判定为设施起伏</span>
              <div class="flex items-center gap-2 mt-1">
                <el-input-number v-model="params.facilitySuppressBufferM" :min="2" :max="15" />
                <span class="font-semibold text-indigo-600">米 (当前 5 米)</span>
              </div>
            </div>

            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
              <span class="font-bold text-slate-800">颠簸冲击事件空间聚合容差</span>
              <span class="text-slate-500 text-[11px]">同路段相邻冲击距离在此容差内聚类为同一处微病害</span>
              <div class="flex items-center gap-2 mt-1">
                <el-input-number v-model="params.clusterDistanceM" :min="5" :max="30" />
                <span class="font-semibold text-emerald-600">米 (当前 10 米)</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 3: Users & Permissions -->
        <el-tab-pane label="用户与角色权限" name="users">
          <div class="flex flex-col gap-3">
            <el-table :data="usersList" stripe size="small" style="width: 100%">
              <el-table-column prop="account" label="登录账号" width="120" />
              <el-table-column prop="name" label="用户姓名" width="130">
                <template #default="{ row }">
                  <span class="font-bold text-slate-800">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="role" label="系统角色" width="140">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.role === '管理人员' ? 'danger' : row.role === '巡检班组' ? 'success' : 'warning'">
                    {{ row.role }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="department" label="所属单位/班组" min-width="180" />
              <el-table-column prop="phone" label="联系电话" width="130" />
              <el-table-column prop="status" label="账号状态" width="100">
                <template #default="{ row }">
                  <el-tag size="small" type="success">正常启用</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- Tab 4: Audit Logs -->
        <el-tab-pane label="系统审计与操作日志" name="logs">
          <div class="flex flex-col gap-3">
            <el-table :data="store.auditLogs" stripe size="small" style="width: 100%">
              <el-table-column prop="id" label="日志ID" width="110" />
              <el-table-column prop="user_name" label="操作人" width="110" />
              <el-table-column prop="role" label="操作角色" width="120" />
              <el-table-column prop="action" label="执行动作" width="160">
                <template #default="{ row }">
                  <span class="font-semibold text-blue-600">{{ row.action }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="target_type" label="目标对象" width="120" />
              <el-table-column prop="details" label="操作变更详情" min-width="260" />
              <el-table-column prop="timestamp" label="操作时间" width="140" />
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useAppStore } from '../stores/appStore';
import { Setting } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const store = useAppStore();
const activeTab = ref('risk_weights');

const weights = reactive({
  harm: store.systemConfig.risk_weights.harm,
  exposure: store.systemConfig.risk_weights.exposure,
  vulnerability: store.systemConfig.risk_weights.vulnerability,
  trend: store.systemConfig.risk_weights.trend,
  consequence: store.systemConfig.risk_weights.consequence,
});

const params = reactive({
  highRiskThreshold: store.systemConfig.high_risk_threshold,
  lowRiskThreshold: store.systemConfig.low_risk_threshold,
  confidenceThreshold: store.systemConfig.confidence_threshold,
  accPeakThreshold: store.systemConfig.acceleration_peak_threshold,
  facilitySuppressBufferM: store.systemConfig.facility_suppression_buffer_m,
  clusterDistanceM: store.systemConfig.cluster_distance_m,
});

const totalWeight = computed(() => {
  return Number((weights.harm + weights.exposure + weights.vulnerability + weights.trend + weights.consequence).toFixed(2));
});

function resetWeights() {
  weights.harm = 0.30;
  weights.exposure = 0.20;
  weights.vulnerability = 0.20;
  weights.trend = 0.15;
  weights.consequence = 0.15;
}

const usersList = ref([
  { account: 'admin', name: '张明远', role: '管理人员', department: '闵行区道路养护与交通管理中心', phone: '13817290001' },
  { account: 'inspector1', name: '李建军', role: '巡检班组', department: '道路养护巡检一班 (永德路片区)', phone: '13918820002' },
  { account: 'inspector2', name: '赵志强', role: '巡检班组', department: '道路养护巡检二班 (剑川路片区)', phone: '13918820003' },
  { account: 'repair1', name: '王宏伟', role: '维修班组', department: '市政特快修二组 (沥青冷补专项)', phone: '13612340004' },
]);

function saveSystemSettings() {
  if (totalWeight.value !== 1.0) {
    ElMessage.error('风险权重之和必须等于 1.00，请微调滑块后再保存');
    return;
  }
  store.systemConfig.risk_weights = { ...weights };
  store.systemConfig.high_risk_threshold = params.highRiskThreshold;
  store.systemConfig.low_risk_threshold = params.lowRiskThreshold;
  store.systemConfig.confidence_threshold = params.confidenceThreshold;
  store.systemConfig.acceleration_peak_threshold = params.accPeakThreshold;
  store.systemConfig.facility_suppression_buffer_m = params.facilitySuppressBufferM;
  store.systemConfig.cluster_distance_m = params.clusterDistanceM;

  ElMessage.success('全局风险模型权重与算法阈值已成功保存并即时生效');
}
</script>
