<template>
  <div class="dashboard-page">
    <section class="page-hero">
      <div><span class="eyebrow">ROAD MAINTENANCE OVERVIEW</span><h1>早上好，{{ store.currentUser?.name }}</h1><p>永德路试点区运行平稳，当前有 <strong>{{ store.metrics.highRiskDamages }}</strong> 处高风险病害需要优先关注。</p></div>
      <div class="hero-actions"><button class="secondary-action" @click="router.push('/reports')">查看分析报告</button><button class="primary-action" @click="router.push('/damages')"><span>＋</span> 新建处置任务</button></div>
    </section>

    <section class="metric-grid" aria-label="核心指标">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card" :class="metric.tone" @click="metric.path && router.push(metric.path)">
        <div class="metric-icon"><el-icon :size="20"><component :is="metric.icon" /></el-icon></div>
        <div class="metric-content"><span>{{ metric.label }}</span><div><strong>{{ metric.value }}</strong><small>{{ metric.unit }}</small></div><p><b>{{ metric.change }}</b>{{ metric.note }}</p></div>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="workroom-card trend-card">
        <header class="card-header"><div><span class="eyebrow">30 DAYS TREND</span><h2>感知发现与维修闭环</h2></div><div class="chart-legend"><span class="discover">感知发现</span><span class="closed">维修销项</span></div></header>
        <div class="trend-chart"><EChartsWrapper :options="trendOptions" /></div>
      </article>

      <article class="workroom-card workflow-card">
        <header class="card-header"><div><span class="eyebrow">LIVE WORKFLOW</span><h2>今日处置进度</h2></div><button class="text-action" @click="router.push('/work-orders')">查看全部 →</button></header>
        <div class="workflow-list">
          <button v-for="item in workflow" :key="item.label" @click="router.push(item.path)">
            <span class="workflow-dot" :class="item.tone"></span><span><strong>{{ item.label }}</strong><small>{{ item.caption }}</small></span><b>{{ item.value }}</b><i>→</i>
          </button>
        </div>
        <div class="closure-summary"><div><span>本月主动闭环率</span><strong>94.8%</strong></div><div class="progress-track"><span style="width:94.8%"></span></div><p>较上月提升 6.2%，处置平均耗时缩短 4.6 小时</p></div>
      </article>

      <article class="workroom-card risk-card">
        <header class="card-header"><div><span class="eyebrow">RISK PRIORITY</span><h2>高风险待处置清单</h2></div><button class="text-action" @click="router.push('/damages')">全部病害 →</button></header>
        <div class="risk-list">
          <button v-for="(damage, index) in store.metrics.topHighRisk.slice(0, 5)" :key="damage.id" @click="openDamage(damage)">
            <span class="risk-rank">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="risk-main"><strong>{{ damage.road_name }} · {{ damage.type }}</strong><small>{{ damage.id }} · {{ damage.mileage_m }}m 处</small></span>
            <span class="risk-score"><b>{{ damage.risk_score }}</b><small>风险分</small></span>
            <span class="risk-bar"><i :style="{ width: `${damage.risk_score}%` }"></i></span>
            <StatusTag :value="damage.status" />
          </button>
        </div>
      </article>

      <aside class="workroom-card activity-card">
        <header class="card-header"><div><span class="eyebrow">ACTIVITY STREAM</span><h2>协作动态</h2></div></header>
        <div class="activity-list">
          <article v-for="(notice, index) in store.notifications.slice(0, 4)" :key="notice.id">
            <span class="activity-avatar" :class="`avatar-${index + 1}`">{{ ['巡','系','修','管'][index] }}</span>
            <div><strong>{{ notice.title }}</strong><p>{{ notice.message }}</p><time>{{ notice.time }}</time></div>
          </article>
        </div>
        <button class="activity-more" @click="router.push('/inspections')">进入协作中心</button>
      </aside>
    </section>

    <DamageDrawer v-model="drawerVisible" :damage="selectedDamage" @updated="drawerVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { DataAnalysis, Finished, MapLocation, Warning } from '@element-plus/icons-vue';
import type { EChartsOption } from 'echarts';
import type { DamageItem } from '../types';
import { useAppStore } from '../stores/appStore';
import EChartsWrapper from '../components/EChartsWrapper.vue';
import StatusTag from '../components/StatusTag.vue';
import DamageDrawer from '../components/DamageDrawer.vue';

const router = useRouter();
const store = useAppStore();
const drawerVisible = ref(false);
const selectedDamage = ref<DamageItem | null>(null);

const metrics = computed(() => [
  { label: '管养道路总里程', value: store.metrics.totalMileageKm, unit: 'km', change: '8 条', note: '试点车道实时覆盖', icon: MapLocation, tone: 'blue', path: '/spatial-assets' },
  { label: '待核验微病害', value: store.metrics.pendingConfirmCount, unit: '处', change: `${store.metrics.pendingInspections} 项`, note: '巡检任务待执行', icon: DataAnalysis, tone: 'violet', path: '/inspections' },
  { label: '高风险在管病害', value: store.metrics.highRiskDamages, unit: '处', change: '≥70 分', note: '建议优先派工', icon: Warning, tone: 'orange', path: '/damages?risk=高' },
  { label: '已闭环处置', value: store.metrics.closedDamages, unit: '件', change: '94.8%', note: '本月主动闭环率', icon: Finished, tone: 'green', path: '/work-orders' },
]);

const workflow = computed(() => [
  { label: '待现场巡检', caption: '需核验病害类型与尺寸', value: store.metrics.pendingInspections, tone: 'blue', path: '/inspections' },
  { label: '维修工单进行中', caption: '待派工、已派工与施工中', value: store.metrics.pendingRepairWorkOrders, tone: 'orange', path: '/work-orders' },
  { label: '等待完工复核', caption: '确认维修质量后销项', value: store.metrics.pendingReviews, tone: 'green', path: '/work-orders?status=待复核' },
]);

const trendOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis', backgroundColor: '#10213b', borderWidth: 0, textStyle: { color: '#fff' } },
  grid: { left: 16, right: 18, bottom: 8, top: 28, containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: ['8/01','8/04','8/07','8/10','8/13','8/16'], axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: '#94a4b9', fontSize: 11 } },
  yAxis: { type: 'value', axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: '#94a4b9', fontSize: 11 }, splitLine: { lineStyle: { color: '#edf3f9' } } },
  series: [
    { name: '感知发现', type: 'line', smooth: 0.35, symbol: 'circle', symbolSize: 7, data: [3,5,8,12,16,18], lineStyle: { width: 3, color: '#3d8dff' }, itemStyle: { color: '#3d8dff', borderColor: '#fff', borderWidth: 2 }, areaStyle: { color: 'rgba(61,141,255,.11)' } },
    { name: '维修销项', type: 'line', smooth: 0.35, symbol: 'circle', symbolSize: 7, data: [1,2,4,7,10,14], lineStyle: { width: 3, color: '#33c694' }, itemStyle: { color: '#33c694', borderColor: '#fff', borderWidth: 2 } },
  ],
}));

function openDamage(damage: DamageItem) { selectedDamage.value = damage; drawerVisible.value = true; }
</script>
