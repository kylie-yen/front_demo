<template>
  <div class="flex flex-col gap-4">
    <!-- Top Track Selector & Controls -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
          <el-icon :size="20"><Promotion /></el-icon>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-base font-bold text-slate-800">骑行轨迹回放与动力学事件溯源</h2>
            <el-tag size="small" type="success">地图匹配准确率 98.6%</el-tag>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">查看众包骑行连续时空轨迹、三轴加速度振动波形与提取的颠簸冲击特征</p>
        </div>
      </div>

      <!-- Select Track -->
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-500 font-medium shrink-0">选择回放轨迹：</span>
        <el-select v-model="selectedTrackId" class="w-64" size="default">
          <el-option
            v-for="t in store.rideTracks"
            :key="t.id"
            :label="`${t.track_no} (${t.rider} · ${t.distance_km}km)`"
            :value="t.id"
          />
        </el-select>
      </div>
    </div>

    <!-- Main Grid: Map & Vibration Dynamics -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <!-- Left Map & Playback controls (7 cols) -->
      <div class="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm text-slate-800">轨迹地图空间回放</span>
            <span class="text-xs text-slate-400">里程 {{ currentTrack?.distance_km }}km | 采样点 {{ currentTrack?.point_count }} 个</span>
          </div>

          <!-- Playback controls -->
          <div class="flex items-center gap-2">
            <el-button
              :type="isPlaying ? 'warning' : 'primary'"
              size="small"
              @click="togglePlay"
            >
              <el-icon class="mr-1"><VideoPlay v-if="!isPlaying" /><VideoPause v-else /></el-icon>
              {{ isPlaying ? '暂停回放' : '开始轨迹回放' }}
            </el-button>
            <el-button size="small" @click="resetPlayback">重置</el-button>
          </div>
        </div>

        <!-- GIS Map -->
        <div class="h-[360px] rounded-xl overflow-hidden border border-slate-200 relative">
          <GisMap ref="gisMapRef" />
        </div>

        <!-- Playback progress bar -->
        <div class="flex items-center gap-3 px-2 text-xs text-slate-600">
          <span class="font-mono">{{ formatTime(playIndex) }}</span>
          <el-slider v-model="playIndex" :max="trackCoordsCount - 1" class="flex-1" />
          <span class="font-mono">{{ formatTime(trackCoordsCount - 1) }}</span>
        </div>
      </div>

      <!-- Right Acceleration Waveform & Telemetry (5 cols) -->
      <div class="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-bold text-slate-800">实时动力学波形与冲击峰值</h3>
            <span class="text-[11px] text-red-500 font-medium">冲击阈值: 14.5 m/s²</span>
          </div>

          <!-- Vibration Chart -->
          <div class="h-56">
            <EChartsWrapper :options="waveChartOptions" />
          </div>

          <!-- Current Telemetry Box -->
          <div class="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
              <span class="text-slate-400">当前垂向加速度</span>
              <span class="text-base font-bold text-red-600 mt-1">{{ currentAcc.toFixed(2) }} m/s²</span>
            </div>
            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
              <span class="text-slate-400">即时骑行时速</span>
              <span class="text-base font-bold text-slate-800 mt-1">{{ currentSpeed.toFixed(1) }} km/h</span>
            </div>
            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
              <span class="text-slate-400">振动均方根 RMS</span>
              <span class="text-base font-bold text-blue-600 mt-1">{{ currentRms.toFixed(2) }} m/s²</span>
            </div>
          </div>
        </div>

        <div class="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 mt-3">
          <strong>动力学特征分析：</strong>在永德路 520m 处检测到高幅值冲击波（峰值 24.8m/s²），波形持续 120ms，符合典型“路面深坑洼”碰撞震荡特征。
        </div>
      </div>
    </div>

    <!-- Bottom Extracted Shock Events Table -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <h3 class="text-sm font-bold text-slate-800">该轨迹提取的冲击事件清单 ({{ trackEvents.length }} 处)</h3>
        </div>
      </div>

      <el-table :data="trackEvents" stripe size="small" style="width: 100%">
        <el-table-column prop="id" label="事件编号" width="120" />
        <el-table-column prop="occurred_at" label="发生时间" width="140" />
        <el-table-column prop="road_name" label="匹配道路与里程" min-width="180">
          <template #default="{ row }">
            <span class="font-medium text-slate-800">{{ row.road_name }}</span>
            <span class="text-slate-500 text-xs ml-1">({{ row.mileage_m }}m处)</span>
          </template>
        </el-table-column>
        <el-table-column prop="peak_acc" label="垂向加速度峰值" width="140" sortable>
          <template #default="{ row }">
            <span class="font-bold text-red-600">{{ row.peak_acc }} m/s²</span>
          </template>
        </el-table-column>
        <el-table-column prop="rms" label="振动 RMS" width="120">
          <template #default="{ row }">
            <span class="font-semibold text-slate-700">{{ row.rms }} m/s²</span>
          </template>
        </el-table-column>
        <el-table-column prop="event_class" label="识别事件类型" width="130">
          <template #default="{ row }">
            <StatusTag :value="row.event_class" />
          </template>
        </el-table-column>
        <el-table-column prop="rule_hit_desc" label="规则匹配说明" min-width="200" />
        <el-table-column label="关联病害" width="140">
          <template #default="{ row }">
            <span
              v-if="row.damage_id"
              class="font-mono text-blue-600 hover:underline cursor-pointer font-semibold"
              @click="router.push(`/damages/${row.damage_id}`)"
            >
              {{ row.damage_id }} &rarr;
            </span>
            <span v-else class="text-slate-400 text-xs">未聚合</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import GisMap from '../components/GisMap.vue';
import StatusTag from '../components/StatusTag.vue';
import EChartsWrapper from '../components/EChartsWrapper.vue';
import { Promotion, VideoPlay, VideoPause } from '@element-plus/icons-vue';
import type { EChartsOption } from 'echarts';

const router = useRouter();
const store = useAppStore();

const selectedTrackId = ref(store.rideTracks[0]?.id || 'TRK-20260816-01');
const currentTrack = computed(() => store.rideTracks.find((t) => t.id === selectedTrackId.value));
const trackEvents = computed(() => store.impactEvents.filter((e) => e.track_id === selectedTrackId.value));

const gisMapRef = ref<any>(null);
const isPlaying = ref(false);
const playIndex = ref(0);
let playTimer: any = null;

const trackCoordsCount = computed(() => currentTrack.value?.coordinates.length || 20);

const currentAcc = computed(() => {
  if (playIndex.value === 5 || playIndex.value === 12) return 24.82;
  return 9.8 + (Math.sin(playIndex.value) * 1.5);
});

const currentSpeed = computed(() => 18.5 - (playIndex.value % 4) * 0.4);
const currentRms = computed(() => 3.2 + (playIndex.value % 5) * 0.3);

function togglePlay() {
  if (isPlaying.value) {
    pause();
  } else {
    play();
  }
}

function play() {
  isPlaying.value = true;
  playTimer = setInterval(() => {
    if (playIndex.value < trackCoordsCount.value - 1) {
      playIndex.value++;
    } else {
      pause();
    }
  }, 400);
}

function pause() {
  isPlaying.value = false;
  if (playTimer) clearInterval(playTimer);
}

function resetPlayback() {
  pause();
  playIndex.value = 0;
}

function formatTime(idx: number) {
  const sec = Math.floor(idx * 2);
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const waveChartOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['0.0s', '0.5s', '1.0s', '1.5s', '2.0s', '2.5s', '3.0s', '3.5s', '4.0s', '4.5s', '5.0s'],
    axisLabel: { fontSize: 10, color: '#64748b' },
  },
  yAxis: {
    type: 'value',
    name: '加速度 (m/s²)',
    nameTextStyle: { fontSize: 10, color: '#64748b' },
    axisLabel: { fontSize: 10, color: '#64748b' },
    splitLine: { lineStyle: { color: '#f1f5f9' } },
  },
  series: [
    {
      name: '垂向加速度 az',
      type: 'line',
      smooth: true,
      data: [9.8, 10.2, 11.0, 24.8, 16.5, 12.0, 9.8, 10.1, 9.9, 10.3, 9.8],
      itemStyle: { color: '#ef4444' },
      markLine: {
        data: [{ yAxis: 14.5, name: '冲击阈值' }],
        lineStyle: { color: '#f59e0b', type: 'dashed' },
      },
    },
  ],
}));

onUnmounted(() => {
  if (playTimer) clearInterval(playTimer);
});
</script>
