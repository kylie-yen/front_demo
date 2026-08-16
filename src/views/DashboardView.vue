<template>
  <div class="flex flex-col gap-6">
    <!-- Top Row: 4-6 Key Metric Cards matching Clean Utility Theme -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <!-- 1. Road Mileage -->
      <div class="bg-white p-4.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
        <div class="text-xs text-slate-400 mb-1">管养道路总里程</div>
        <div class="flex items-baseline space-x-1.5 mt-0.5">
          <div class="text-2xl font-bold text-slate-900">{{ store.metrics.totalMileageKm }}</div>
          <div class="text-xs font-medium text-slate-400">km</div>
        </div>
        <div class="mt-2.5 flex items-center space-x-1 text-[10px] text-[#18A57A] font-medium">
          <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"></path>
          </svg>
          <span>覆盖 8 条试点车道</span>
        </div>
      </div>

      <!-- 2. Imported Tracks -->
      <div class="bg-white p-4.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
        <div class="text-xs text-slate-400 mb-1">导入众包轨迹</div>
        <div class="flex items-baseline space-x-1.5 mt-0.5">
          <div class="text-2xl font-bold text-slate-900">{{ store.metrics.trackCount }}</div>
          <div class="text-xs font-medium text-slate-400">条</div>
        </div>
        <div class="mt-2.5 flex items-center space-x-1 text-[10px] text-[#246BCE] font-medium">
          <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>均值置信度 89.2%</span>
        </div>
      </div>

      <!-- 3. Pending Confirmation Damages -->
      <div
        @click="goToDamageListWithFilter('待确认')"
        class="bg-white p-4.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-300 transition"
      >
        <div class="text-xs text-slate-400 mb-1">待核验微病害</div>
        <div class="flex items-baseline space-x-1.5 mt-0.5">
          <div class="text-2xl font-bold text-slate-800">{{ store.metrics.pendingConfirmCount }}</div>
          <div class="text-xs font-medium text-slate-400">处</div>
        </div>
        <div class="mt-2.5 flex items-center space-x-1 text-[10px] text-slate-500 font-medium">
          <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
          </svg>
          <span>建议人工现场量测</span>
        </div>
      </div>

      <!-- 4. High Risk Damages -->
      <div
        @click="goToDamageListWithFilter('', '高')"
        class="bg-white p-4.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between cursor-pointer hover:border-red-300 transition"
      >
        <div class="text-xs text-slate-400 mb-1">高风险在管病害</div>
        <div class="flex items-baseline space-x-1.5 mt-0.5">
          <div class="text-2xl font-bold text-[#D93025]">{{ store.metrics.highRiskDamages }}</div>
          <div class="text-xs font-medium text-slate-400">处</div>
        </div>
        <div class="mt-2.5 flex items-center space-x-1 text-[10px] text-[#D93025] font-medium">
          <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z"></path>
          </svg>
          <span>≥70分 需优先派工</span>
        </div>
      </div>

      <!-- 5. Active Work Orders -->
      <div
        @click="goToWorkOrders('待派工')"
        class="bg-white p-4.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between cursor-pointer hover:border-orange-300 transition"
      >
        <div class="text-xs text-slate-400 mb-1">进行中维修工单</div>
        <div class="flex items-baseline space-x-1.5 mt-0.5">
          <div class="text-2xl font-bold text-[#F27D26]">{{ store.metrics.pendingRepairWorkOrders }}</div>
          <div class="text-xs font-medium text-slate-400">张</div>
        </div>
        <div class="mt-2.5 flex items-center space-x-1 text-[10px] text-[#F27D26] font-medium">
          <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          <span>待派工与施工中</span>
        </div>
      </div>

      <!-- 6. Closed Items -->
      <div
        @click="goToDamageListWithFilter('已销项')"
        class="bg-white p-4.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition"
      >
        <div class="text-xs text-slate-400 mb-1">已闭环销项数量</div>
        <div class="flex items-baseline space-x-1.5 mt-0.5">
          <div class="text-2xl font-bold text-[#18A57A]">{{ store.metrics.closedDamages }}</div>
          <div class="text-xs font-medium text-slate-400">件</div>
        </div>
        <div class="mt-2.5 flex items-center space-x-1 text-[10px] text-[#18A57A] font-medium">
          <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path>
          </svg>
          <span>主动闭环率 94.8%</span>
        </div>
      </div>
    </div>

    <!-- Quick Action Portals (待办入口) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 待巡检核验 -->
      <div class="bg-white border border-[#E2E8F0] rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-[#246BCE]/10 text-[#246BCE] flex items-center justify-center font-bold">
            <el-icon :size="18"><Checked /></el-icon>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800">待现场量测核验</div>
            <div class="text-[11px] text-slate-500 mt-0.5">当前 <span class="font-bold text-[#246BCE]">{{ store.metrics.pendingInspections }}</span> 项巡检待核实</div>
          </div>
        </div>
        <button
          @click="goToInspections('待巡检')"
          class="px-3 py-1.5 bg-[#246BCE] text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition cursor-pointer"
        >
          去核验 &rarr;
        </button>
      </div>

      <!-- 待派工维修 -->
      <div class="bg-white border border-[#E2E8F0] rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-[#F27D26]/10 text-[#F27D26] flex items-center justify-center font-bold">
            <el-icon :size="18"><Tools /></el-icon>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800">待派工维修工单</div>
            <div class="text-[11px] text-slate-500 mt-0.5">当前 <span class="font-bold text-[#F27D26]">{{ store.metrics.pendingRepairWorkOrders }}</span> 张工单待安排施工</div>
          </div>
        </div>
        <button
          @click="goToWorkOrders('待派工')"
          class="px-3 py-1.5 bg-[#F27D26] text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition cursor-pointer"
        >
          去派工 &rarr;
        </button>
      </div>

      <!-- 待复核销项 -->
      <div class="bg-white border border-[#E2E8F0] rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-[#18A57A]/10 text-[#18A57A] flex items-center justify-center font-bold">
            <el-icon :size="18"><DocumentChecked /></el-icon>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800">待复核验收销项</div>
            <div class="text-[11px] text-slate-500 mt-0.5">共有 <span class="font-bold text-[#18A57A]">{{ store.metrics.pendingReviews }}</span> 张完工记录待复核</div>
          </div>
        </div>
        <button
          @click="goToWorkOrders('待复核')"
          class="px-3 py-1.5 bg-[#18A57A] text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition cursor-pointer"
        >
          去复核 &rarr;
        </button>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- 1. Status & Risk Level Distribution -->
      <div class="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="text-xs font-bold text-slate-800">微病害状态全景分布</h3>
            <span class="text-[10px] text-slate-400">总计 {{ store.damages.length }} 处在管点位</span>
          </div>
        </div>
        <div class="h-60">
          <EChartsWrapper :options="statusPieOptions" />
        </div>
      </div>

      <!-- 2. Damage Types Distribution -->
      <div class="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="text-xs font-bold text-slate-800">微病害类型构成</h3>
            <span class="text-[10px] text-slate-400">坑洼与沉陷为主要类型</span>
          </div>
        </div>
        <div class="h-60">
          <EChartsWrapper :options="typeBarOptions" />
        </div>
      </div>

      <!-- 3. Trend Chart (近30天) -->
      <div class="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="text-xs font-bold text-slate-800">近30天 感知发现 vs 维修销项</h3>
            <span class="text-[10px] text-slate-400">闭环收敛态势良好</span>
          </div>
        </div>
        <div class="h-60">
          <EChartsWrapper :options="trendLineOptions" />
        </div>
      </div>
    </div>

    <!-- Bottom Section: High Risk TOP 10 Table -->
    <div class="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 rounded-full bg-[#D93025]"></div>
          <h3 class="text-xs font-bold text-slate-800">高风险待处置微病害 TOP 10 清单</h3>
          <span class="text-[10px] text-slate-400 font-mono">按可解释风险综合评分排序</span>
        </div>
        <button
          @click="router.push('/damages')"
          class="text-xs font-medium text-[#246BCE] hover:underline cursor-pointer flex items-center space-x-1"
        >
          <span>查看全部病害列表</span>
          <span>&rarr;</span>
        </button>
      </div>

      <el-table :data="store.metrics.topHighRisk" stripe style="width: 100%" size="default">
        <el-table-column prop="id" label="病害编号" width="140">
          <template #default="{ row }">
            <span class="font-mono font-semibold text-[#246BCE] hover:underline cursor-pointer" @click="openDrawer(row)">
              {{ row.id }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="病害类型" width="120">
          <template #default="{ row }">
            <span class="font-medium text-slate-800">{{ row.type }} ({{ row.severity }})</span>
          </template>
        </el-table-column>

        <el-table-column prop="road_name" label="所在位置" min-width="180">
          <template #default="{ row }">
            <div class="text-xs text-slate-700">
              <span class="font-medium">{{ row.road_name }}</span>
              <span class="text-slate-400 ml-1">({{ row.mileage_m }}m处)</span>
            </div>
            <div v-if="row.near_scenario_name" class="text-[10px] text-amber-600 truncate mt-0.5">
              ⚠️ {{ row.near_scenario_name }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="risk_score" label="风险评分" width="130" sortable>
          <template #default="{ row }">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-bold text-[#D93025]">{{ row.risk_score }} 分</span>
              <StatusTag :value="row.risk_level + '风险'" />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="confidence" label="置信度" width="110">
          <template #default="{ row }">
            <div class="flex items-center space-x-1.5">
              <span class="text-xs font-semibold text-slate-700">{{ row.confidence }}%</span>
              <el-tag v-if="row.confidence < 60" type="warning" size="small">待核验</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="当前状态" width="110">
          <template #default="{ row }">
            <StatusTag :value="row.status" />
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="发现时间" width="140" />

        <el-table-column label="快捷操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center space-x-1.5">
              <el-button link type="primary" size="small" @click="openDrawer(row)">
                详情
              </el-button>
              <el-button
                v-if="row.status === '待确认'"
                link
                type="warning"
                size="small"
                @click="quickInspect(row)"
              >
                派巡检
              </el-button>
              <el-button
                v-if="row.status === '已确认' || (row.status === '待确认' && row.confidence >= 60)"
                link
                type="danger"
                size="small"
                @click="quickWorkOrder(row)"
              >
                建工单
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Damage Detail Drawer -->
    <DamageDrawer v-model="drawerVisible" :damage="selectedDamage" @updated="drawerVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import type { DamageItem } from '../types';
import StatusTag from '../components/StatusTag.vue';
import EChartsWrapper from '../components/EChartsWrapper.vue';
import DamageDrawer from '../components/DamageDrawer.vue';
import {
  Checked,
  Tools,
  DocumentChecked,
} from '@element-plus/icons-vue';
import type { EChartsOption } from 'echarts';

const router = useRouter();
const store = useAppStore();

const drawerVisible = ref(false);
const selectedDamage = ref<DamageItem | null>(null);

function openDrawer(damage: DamageItem) {
  selectedDamage.value = damage;
  drawerVisible.value = true;
}

function quickInspect(damage: DamageItem) {
  selectedDamage.value = damage;
  drawerVisible.value = true;
}

function quickWorkOrder(damage: DamageItem) {
  selectedDamage.value = damage;
  drawerVisible.value = true;
}

function goToDamageListWithFilter(status?: string, risk?: string) {
  router.push({
    path: '/damages',
    query: { status, risk },
  });
}

function goToInspections(status?: string) {
  router.push({
    path: '/inspections',
    query: { status },
  });
}

function goToWorkOrders(status?: string) {
  router.push({
    path: '/work-orders',
    query: { status },
  });
}

// 1. Status Pie Chart Options
const statusPieOptions = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} 处 ({d}%)',
  },
  legend: {
    bottom: '0%',
    left: 'center',
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { fontSize: 11, color: '#64748b' },
  },
  series: [
    {
      name: '病害状态',
      type: 'pie',
      radius: ['45%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: { show: false },
      data: [
        { value: store.metrics.statusDist['待确认'], name: '待确认', itemStyle: { color: '#94a3b8' } },
        { value: store.metrics.statusDist['已确认'], name: '已确认', itemStyle: { color: '#246BCE' } },
        { value: store.metrics.statusDist['待维修'], name: '待维修', itemStyle: { color: '#F27D26' } },
        { value: store.metrics.statusDist['已维修'], name: '已维修', itemStyle: { color: '#8B5CF6' } },
        { value: store.metrics.statusDist['已销项'], name: '已销项', itemStyle: { color: '#18A57A' } },
      ],
    },
  ],
}));

// 2. Damage Type Bar Chart Options
const typeBarOptions = computed<EChartsOption>(() => {
  const types = Object.keys(store.metrics.typeMap);
  const values = types.map((t) => store.metrics.typeMap[t]);
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: types,
      axisLabel: { fontSize: 10, color: '#64748b', interval: 0, rotate: 20 },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, color: '#64748b' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        data: values,
        type: 'bar',
        barWidth: '36%',
        itemStyle: {
          color: '#246BCE',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };
});

// 3. Trend Line Chart Options
const trendLineOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: {
    top: '0%',
    right: '0%',
    itemWidth: 12,
    textStyle: { fontSize: 10, color: '#64748b' },
  },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['8/01', '8/04', '8/07', '8/10', '8/13', '8/16'],
    axisLabel: { fontSize: 10, color: '#64748b' },
    axisLine: { lineStyle: { color: '#cbd5e1' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { fontSize: 10, color: '#64748b' },
    splitLine: { lineStyle: { color: '#f1f5f9' } },
  },
  series: [
    {
      name: '感知发现',
      type: 'line',
      smooth: true,
      data: [3, 5, 8, 12, 16, 18],
      itemStyle: { color: '#D93025' },
      areaStyle: { color: 'rgba(217, 48, 37, 0.06)' },
    },
    {
      name: '核验销项',
      type: 'line',
      smooth: true,
      data: [1, 2, 4, 7, 10, 14],
      itemStyle: { color: '#18A57A' },
      areaStyle: { color: 'rgba(24, 165, 122, 0.06)' },
    },
  ],
}));
</script>
