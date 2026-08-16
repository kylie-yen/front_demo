<template>
  <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <el-icon class="text-blue-600"><Compass /></el-icon>
        <h4 class="text-sm font-semibold text-slate-800">感知置信度与证据链 (0-100分)</h4>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500">评估置信度:</span>
        <span
          :class="[
            'text-sm font-bold px-2.5 py-0.5 rounded-md',
            confidence >= 60 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200',
          ]"
        >
          {{ confidence }} %
        </span>
      </div>
    </div>

    <!-- Recommendation Alert -->
    <div
      v-if="confidence < 60"
      class="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800"
    >
      <el-icon class="text-amber-600 text-sm"><WarningFilled /></el-icon>
      <span><strong>业务建议：</strong>当前置信度较低（&lt;60%），存在单次颠簸或设备偶然抖动可能，<strong>建议加入人工巡检队列</strong>进行现场复核。</span>
    </div>
    <div
      v-else
      class="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800"
    >
      <el-icon class="text-emerald-600 text-sm"><SuccessFilled /></el-icon>
      <span><strong>业务建议：</strong>当前置信度充足（≥60%），跨设备/多日数据高度一致，高风险问题可直接一键生成维修工单。</span>
    </div>

    <!-- Breakdown Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
      <div class="p-2 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
        <span class="text-slate-500">独立骑行采样</span>
        <span class="font-semibold text-slate-800 mt-1">{{ factors.sample_count }} 次</span>
      </div>

      <div class="p-2 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
        <span class="text-slate-500">异常冲击检出率</span>
        <span class="font-semibold text-blue-600 mt-1">{{ factors.anomaly_ratio }}%</span>
      </div>

      <div class="p-2 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
        <span class="text-slate-500">跨设备多源一致</span>
        <span :class="['font-semibold mt-1', factors.multi_device ? 'text-emerald-600' : 'text-slate-400']">
          {{ factors.multi_device ? '✓ 多设备吻合' : '单设备采集' }}
        </span>
      </div>

      <div class="p-2 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
        <span class="text-slate-500">跨日期多天复现</span>
        <span :class="['font-semibold mt-1', factors.multi_date ? 'text-emerald-600' : 'text-slate-400']">
          {{ factors.multi_date ? '✓ 多天持续' : '单日单次' }}
        </span>
      </div>

      <div class="p-2 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
        <span class="text-slate-500">现场照片佐证</span>
        <span :class="['font-semibold mt-1', factors.has_photo ? 'text-emerald-600' : 'text-slate-400']">
          {{ factors.has_photo ? '✓ 已附现场照片' : '暂无照片' }}
        </span>
      </div>

      <div class="p-2 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
        <span class="text-slate-500">人工巡检实测</span>
        <span :class="['font-semibold mt-1', factors.inspection_verified ? 'text-emerald-600' : 'text-slate-400']">
          {{ factors.inspection_verified ? '✓ 巡检员已实测' : '待人工核验' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConfidenceFactors } from '../types';
import { WarningFilled, SuccessFilled, Compass } from '@element-plus/icons-vue';

defineProps<{
  confidence: number;
  factors: ConfidenceFactors;
}>();
</script>
