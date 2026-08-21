<template>
  <div class="flex flex-col gap-4">
    <!-- Top Header -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
          <el-icon :size="20"><TrendCharts /></el-icon>
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-800">主动养护成效评估与分析报表中心</h2>
          <p class="text-xs text-slate-500 mt-0.5">多源众包感知质量评估、维修前后振动衰减成效比对与闭环销项分析</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button type="primary" size="small" @click="exportReportSummary">
          <el-icon class="mr-1"><Document /></el-icon> 导出主动养护成效简报 (.pdf)
        </el-button>
      </div>
    </div>

    <!-- 4 Core Performance KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <span class="text-xs text-slate-500 font-medium">感知核验准确率</span>
        <div class="mt-2">
          <div class="text-2xl font-bold text-emerald-600">94.8 %</div>
          <div class="text-[11px] text-emerald-600 mt-1">巡检核实 18 处中 17 处属实</div>
        </div>
      </div>

      <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <span class="text-xs text-slate-500 font-medium">误报抑制过滤率</span>
        <div class="mt-2">
          <div class="text-2xl font-bold text-indigo-600">89.2 %</div>
          <div class="text-[11px] text-indigo-600 mt-1">井盖/接缝硬负样本自动过滤 24 次</div>
        </div>
      </div>

      <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <span class="text-xs text-slate-500 font-medium">平均闭环处置周期</span>
        <div class="mt-2">
          <div class="text-2xl font-bold text-blue-600">2.4 <span class="text-xs font-normal text-slate-500">天</span></div>
          <div class="text-[11px] text-blue-600 mt-1">高风险当日下达，3日内修补复测</div>
        </div>
      </div>

      <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <span class="text-xs text-slate-500 font-medium">骑行舒适度指数提升</span>
        <div class="mt-2">
          <div class="text-2xl font-bold text-purple-600">+ 38.5 %</div>
          <div class="text-[11px] text-purple-600 mt-1">主干路段平均振动 RMS 下降 41%</div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- 1. Vibration Acceleration Before vs After Repair -->
      <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="text-sm font-bold text-slate-800">微病害维修前后路面垂向振动 RMS 对比 (m/s²)</h3>
            <span class="text-xs text-slate-400">修补后振动显著衰减至安全平稳区间 (&lt;3.0)</span>
          </div>
        </div>
        <div class="h-64">
          <EChartsWrapper :options="vibrationComparisonOptions" />
        </div>
      </div>

      <!-- 2. False Positive Suppression Analysis -->
      <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="text-sm font-bold text-slate-800">误报抑制与硬负样本过滤分类分布</h3>
            <span class="text-xs text-slate-400">成功避免无效派工出勤</span>
          </div>
        </div>
        <div class="h-64">
          <EChartsWrapper :options="suppressionPieOptions" />
        </div>
      </div>
    </div>

    <!-- Closed Case Study Card -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <h3 class="text-sm font-bold text-slate-800">全流程主动养护闭环典型示范案例档案</h3>
        </div>
      </div>

      <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div class="flex flex-col gap-1">
          <span class="text-slate-400">病害编号与类型</span>
          <span class="font-bold text-slate-900 text-sm">DM-20260810-01 (深坑洼)</span>
          <span class="text-slate-500">永德路 520m (邻近第二中学)</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-slate-400">众包感知风险评估</span>
          <span class="font-bold text-red-600 text-sm">初始风险 88 分 (高风险)</span>
          <span class="text-slate-500">峰值冲击 24.8m/s² | 置信度 85%</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-slate-400">精准巡检实测</span>
          <span class="font-bold text-blue-600 text-sm">实测 65×48×4.5cm</span>
          <span class="text-slate-500">巡检员李建军 2 小时完成现场核验</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-slate-400">维修与复测销项</span>
          <span class="font-bold text-emerald-600 text-sm">复测 RMS 1.85 m/s² (达标)</span>
          <span class="text-slate-500">冷补沥青填补，完工管理复核销项</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EChartsWrapper from '../components/EChartsWrapper.vue';
import { TrendCharts, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { EChartsOption } from 'echarts';

function exportReportSummary() {
  ElMessage.success('已生成主动养护效能分析简报 PDF');
}

const vibrationComparisonOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['维修前振动 RMS', '维修后振动 RMS'], top: '0%', textStyle: { fontSize: 11, color: '#64748b' } },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['永德路520m', '永德路820m', '剑川路180m', '莲花南路310m', '尚义路90m'],
    axisLabel: { fontSize: 10, color: '#64748b' },
  },
  yAxis: {
    type: 'value',
    name: 'RMS (m/s²)',
    axisLabel: { fontSize: 10, color: '#64748b' },
    splitLine: { lineStyle: { color: '#f1f5f9' } },
  },
  series: [
    {
      name: '维修前振动 RMS',
      type: 'bar',
      barWidth: '25%',
      data: [7.8, 6.2, 5.9, 6.8, 5.4],
      itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
    },
    {
      name: '维修后振动 RMS',
      type: 'bar',
      barWidth: '25%',
      data: [1.8, 1.6, 1.9, 1.7, 1.5],
      itemStyle: { color: '#0f766e', borderRadius: [4, 4, 0, 0] },
    },
  ],
}));

const suppressionPieOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} 次 ({d}%)' },
  legend: { bottom: '0%', textStyle: { fontSize: 10, color: '#64748b' } },
  series: [
    {
      name: '误报类型',
      type: 'pie',
      radius: ['40%', '65%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      data: [
        { value: 14, name: '固定平整井盖起伏', itemStyle: { color: '#6366f1' } },
        { value: 8, name: '路面施工接缝起伏', itemStyle: { color: '#3b82f6' } },
        { value: 6, name: '骑行者单次急停避障', itemStyle: { color: '#f59e0b' } },
        { value: 4, name: '减速带震动', itemStyle: { color: '#8b5cf6' } },
      ],
    },
  ],
}));
</script>
