<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
      colorClasses,
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full', dotClass]" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type?: 'risk' | 'status' | 'priority' | 'event' | 'inspection' | 'workorder';
  value: string;
}>();

const label = computed(() => props.value);

const colorClasses = computed(() => {
  const v = props.value;
  // Risk levels
  if (v === '高' || v === '高风险' || v === 'P1-紧急' || v === '紧急') {
    return 'bg-red-50 text-[#D93025] border-red-200/80';
  }
  if (v === '中' || v === '中风险' || v === 'P2-优先') {
    return 'bg-orange-50 text-[#F27D26] border-orange-200/80';
  }
  if (v === '低' || v === '低风险' || v === 'P3-常规' || v === '普通') {
    return 'bg-blue-50 text-[#246BCE] border-blue-200/80';
  }

  // Damage Status
  if (v === '待确认') {
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }
  if (v === '已确认') {
    return 'bg-blue-50 text-[#246BCE] border-blue-200';
  }
  if (v === '待维修') {
    return 'bg-orange-50 text-[#F27D26] border-orange-200';
  }
  if (v === '已维修' || v === '待复核') {
    return 'bg-purple-50 text-[#6366F1] border-purple-200';
  }
  if (v === '已销项' || v === '已完成' || v === '良好' || v === '通过') {
    return 'bg-emerald-50 text-[#18A57A] border-emerald-200';
  }

  // Event Classes
  if (v === '疑似病害冲击') {
    return 'bg-red-50 text-[#D93025] border-red-200';
  }
  if (v === '固定设施冲击') {
    return 'bg-indigo-50 text-[#6366F1] border-indigo-200';
  }
  if (v === '骑行动作') {
    return 'bg-slate-100 text-slate-600 border-slate-200';
  }
  if (v === '正常') {
    return 'bg-emerald-50 text-[#18A57A] border-emerald-200';
  }

  return 'bg-slate-100 text-slate-700 border-slate-200';
});

const dotClass = computed(() => {
  const v = props.value;
  if (v === '高' || v === '高风险' || v === 'P1-紧急' || v === '紧急' || v === '疑似病害冲击') {
    return 'bg-[#D93025]';
  }
  if (v === '中' || v === '中风险' || v === 'P2-优先') {
    return 'bg-[#F27D26]';
  }
  if (v === '低' || v === '低风险' || v === 'P3-常规' || v === '普通') {
    return 'bg-[#246BCE]';
  }
  if (v === '待确认') return 'bg-slate-400';
  if (v === '已确认') return 'bg-[#246BCE]';
  if (v === '待维修') return 'bg-[#F27D26]';
  if (v === '已维修' || v === '待复核') return 'bg-[#6366F1]';
  if (v === '已销项' || v === '已完成' || v === '良好' || v === '通过') return 'bg-[#18A57A]';
  if (v === '固定设施冲击') return 'bg-[#6366F1]';
  return 'bg-slate-400';
});
</script>
