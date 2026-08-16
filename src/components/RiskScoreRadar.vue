<template>
  <div class="w-full h-full min-h-[220px]">
    <EChartsWrapper :options="radarOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EChartsWrapper from './EChartsWrapper.vue';
import type { RiskFactors } from '../types';
import type { EChartsOption } from 'echarts';

const props = defineProps<{
  factors: RiskFactors;
}>();

const radarOptions = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#e2e8f0',
    textStyle: { color: '#1e293b' },
  },
  radar: {
    indicator: [
      { name: '危害程度 (30%)', max: 100 },
      { name: '暴露程度 (20%)', max: 100 },
      { name: '场景脆弱性 (20%)', max: 100 },
      { name: '变化趋势 (15%)', max: 100 },
      { name: '后果严重性 (15%)', max: 100 },
    ],
    shape: 'polygon',
    splitNumber: 4,
    axisName: {
      color: '#475569',
      fontSize: 11,
      fontWeight: 500,
    },
    splitLine: {
      lineStyle: { color: '#e2e8f0' },
    },
    splitArea: {
      show: true,
      areaStyle: {
        color: ['#f8fafc', '#ffffff'],
      },
    },
  },
  series: [
    {
      name: '风险维度评分',
      type: 'radar',
      data: [
        {
          value: [
            props.factors.harm_score,
            props.factors.exposure_score,
            props.factors.vulnerability_score,
            props.factors.trend_score,
            props.factors.consequence_score,
          ],
          name: '当前病害风险因子',
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: { color: '#2563eb' },
          lineStyle: { width: 2, color: '#2563eb' },
          areaStyle: { color: 'rgba(37, 99, 235, 0.22)' },
        },
      ],
    },
  ],
}));
</script>
