<template>
  <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-blue-600"></span>
        <h4 class="text-sm font-semibold text-slate-800">可解释风险评分模型拆解 (0-100分)</h4>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500">综合风险得分:</span>
        <span
          :class="[
            'text-lg font-bold px-2.5 py-0.5 rounded-lg',
            riskScore >= 70
              ? 'bg-red-100 text-red-700'
              : riskScore >= 40
              ? 'bg-amber-100 text-amber-700'
              : 'bg-blue-100 text-blue-700',
          ]"
        >
          {{ riskScore }} 分
        </span>
      </div>
    </div>

    <!-- Formula presentation -->
    <div class="bg-white border border-slate-200/80 rounded-lg p-2.5 mb-3.5 text-xs text-slate-600 font-mono flex items-center gap-1.5 flex-wrap">
      <span class="font-semibold text-blue-700">risk_score</span>
      <span>=</span>
      <span class="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded">0.30×危害({{ factors.harm_score }})</span>
      <span>+</span>
      <span class="bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded">0.20×暴露({{ factors.exposure_score }})</span>
      <span>+</span>
      <span class="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">0.20×场景({{ factors.vulnerability_score }})</span>
      <span>+</span>
      <span class="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">0.15×趋势({{ factors.trend_score }})</span>
      <span>+</span>
      <span class="bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded">0.15×后果({{ factors.consequence_score }})</span>
    </div>

    <!-- 5-dimension Progress Bars -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
      <!-- 危害程度 -->
      <div class="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
        <div class="flex justify-between text-xs text-slate-600 mb-1">
          <span class="font-medium">危害程度 (30%)</span>
          <span class="font-semibold text-blue-600">{{ factors.harm_score }}分</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            class="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            :style="{ width: `${factors.harm_score}%` }"
          />
        </div>
        <div class="text-[11px] text-slate-400 mt-1 truncate">冲击峰值/持续时间</div>
      </div>

      <!-- 暴露程度 -->
      <div class="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
        <div class="flex justify-between text-xs text-slate-600 mb-1">
          <span class="font-medium">暴露程度 (20%)</span>
          <span class="font-semibold text-indigo-600">{{ factors.exposure_score }}分</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            class="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
            :style="{ width: `${factors.exposure_score}%` }"
          />
        </div>
        <div class="text-[11px] text-slate-400 mt-1 truncate">骑行流量/独立频次</div>
      </div>

      <!-- 场景脆弱性 -->
      <div class="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
        <div class="flex justify-between text-xs text-slate-600 mb-1">
          <span class="font-medium">场景脆弱性 (20%)</span>
          <span class="font-semibold text-emerald-600">{{ factors.vulnerability_score }}分</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            class="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
            :style="{ width: `${factors.vulnerability_score}%` }"
          />
        </div>
        <div class="text-[11px] text-slate-400 mt-1 truncate">学校/地铁/下坡叠加</div>
      </div>

      <!-- 变化趋势 -->
      <div class="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
        <div class="flex justify-between text-xs text-slate-600 mb-1">
          <span class="font-medium">变化趋势 (15%)</span>
          <span class="font-semibold text-amber-600">{{ factors.trend_score }}分</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            class="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
            :style="{ width: `${factors.trend_score}%` }"
          />
        </div>
        <div class="text-[11px] text-slate-400 mt-1 truncate">多日恶化/持续活跃</div>
      </div>

      <!-- 后果严重性 -->
      <div class="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
        <div class="flex justify-between text-xs text-slate-600 mb-1">
          <span class="font-medium">后果严重性 (15%)</span>
          <span class="font-semibold text-rose-600">{{ factors.consequence_score }}分</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            class="bg-rose-500 h-1.5 rounded-full transition-all duration-300"
            :style="{ width: `${factors.consequence_score}%` }"
          />
        </div>
        <div class="text-[11px] text-slate-400 mt-1 truncate">失稳/冲入机动车道</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RiskFactors } from '../types';

defineProps<{
  riskScore: number;
  factors: RiskFactors;
}>();
</script>
