<template>
  <div class="relative w-full h-full min-h-[350px] overflow-hidden rounded-xl bg-slate-100">
    <!-- Map Container -->
    <div ref="mapContainer" class="w-full h-full z-0" />

    <!-- Map Floating Controls -->
    <div class="absolute top-3 right-3 z-50 flex flex-col gap-2">
      <!-- Layer Filter Popover -->
      <div class="bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-md rounded-xl p-2.5 flex flex-col gap-1.5 text-xs">
        <div class="font-semibold text-slate-700 pb-1 border-b border-slate-100 flex items-center justify-between">
          <span>图层控制</span>
          <span class="text-[10px] text-slate-400">试点区 1.8km²</span>
        </div>
        <label class="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
          <input type="checkbox" v-model="layers.roads" class="rounded text-blue-600" />
          <span class="w-2.5 h-0.5 bg-blue-500 rounded"></span>
          <span>非机动车道路网 ({{ store.roads.length }})</span>
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
          <input type="checkbox" v-model="layers.damages" class="rounded text-blue-600" />
          <span class="w-2 h-2 rounded-full bg-red-500"></span>
          <span>感知微病害 ({{ filteredDamages.length }})</span>
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
          <input type="checkbox" v-model="layers.facilities" class="rounded text-blue-600" />
          <span class="w-2 h-2 rounded bg-indigo-500"></span>
          <span>固定设施硬负样本 ({{ store.facilities.length }})</span>
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
          <input type="checkbox" v-model="layers.scenarios" class="rounded text-blue-600" />
          <span class="w-2 h-2 rounded-full bg-amber-500 border border-amber-600"></span>
          <span>风险场景缓冲区 ({{ store.riskScenarios.length }})</span>
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
          <input type="checkbox" v-model="layers.tracks" class="rounded text-blue-600" />
          <span class="w-2.5 h-0.5 bg-emerald-500 rounded"></span>
          <span>众包骑行轨迹 ({{ store.rideTracks.length }})</span>
        </label>
      </div>

      <!-- Quick Action Buttons -->
      <div class="bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-md rounded-xl p-1.5 flex flex-col gap-1">
        <el-tooltip content="重置地图视角 (永德路试点区)" placement="left">
          <button
            @click="resetView"
            class="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition flex items-center justify-center cursor-pointer"
          >
            <el-icon><Aim /></el-icon>
          </button>
        </el-tooltip>
        <el-tooltip content="放大" placement="left">
          <button
            @click="zoomIn"
            class="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition flex items-center justify-center cursor-pointer"
          >
            <el-icon><Plus /></el-icon>
          </button>
        </el-tooltip>
        <el-tooltip content="缩小" placement="left">
          <button
            @click="zoomOut"
            class="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition flex items-center justify-center cursor-pointer"
          >
            <el-icon><Minus /></el-icon>
          </button>
        </el-tooltip>
      </div>
    </div>

    <!-- Map Legend -->
    <div class="absolute bottom-3 left-3 z-50 bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-md rounded-xl px-3 py-2 text-[11px] text-slate-600 flex items-center gap-4">
      <span class="font-semibold text-slate-700">图例：</span>
      <div class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs"></span>
        <span>高风险 (≥70分)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span>
        <span>中风险 (40-69分)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs"></span>
        <span>低风险 (&lt;40分)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
        <span>待确认</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        <span>已销项</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import L from 'leaflet';
import { useAppStore } from '../stores/appStore';
import type { DamageItem, RoadItem, FacilityItem, RiskScenarioItem } from '../types';
import { Aim, Plus, Minus } from '@element-plus/icons-vue';

const props = defineProps<{
  highlightDamageId?: string;
  filterType?: string;
  filterRisk?: string;
  filterStatus?: string;
  customDamages?: DamageItem[];
}>();

const emit = defineEmits<{
  (e: 'selectDamage', damage: DamageItem): void;
  (e: 'selectRoad', road: RoadItem): void;
  (e: 'selectFacility', facility: FacilityItem): void;
  (e: 'selectScenario', scenario: RiskScenarioItem): void;
  (e: 'mapClick', latlng: { lat: number; lng: number }): void;
}>();

const store = useAppStore();
const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let resizeObserver: ResizeObserver | null = null;

// Layer groups
const roadLayerGroup = L.layerGroup();
const damageLayerGroup = L.layerGroup();
const facilityLayerGroup = L.layerGroup();
const scenarioLayerGroup = L.layerGroup();
const trackLayerGroup = L.layerGroup();

const layers = ref({
  roads: true,
  damages: true,
  facilities: true,
  scenarios: true,
  tracks: true,
});

const filteredDamages = computed(() => {
  let list = props.customDamages || store.damages;
  if (props.filterType && props.filterType !== '全部') {
    list = list.filter((d) => d.type === props.filterType);
  }
  if (props.filterRisk && props.filterRisk !== '全部') {
    list = list.filter((d) => d.risk_level === props.filterRisk);
  }
  if (props.filterStatus && props.filterStatus !== '全部') {
    list = list.filter((d) => d.status === props.filterStatus);
  }
  return list;
});

const PILOT_CENTER: [number, number] = [31.0245, 121.4370];

function initMap() {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, {
    center: PILOT_CENTER,
    zoom: 15,
    zoomControl: false,
  });

  // Base map layer: CartoDB Positron / OSM tiles for clean restrained look
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);

  // Add layer groups
  roadLayerGroup.addTo(map);
  scenarioLayerGroup.addTo(map);
  facilityLayerGroup.addTo(map);
  trackLayerGroup.addTo(map);
  damageLayerGroup.addTo(map);

  map.on('click', (e: L.LeafletMouseEvent) => {
    emit('mapClick', { lat: e.latlng.lat, lng: e.latlng.lng });
  });

  renderAllLayers();
}

function resetView() {
  map?.setView(PILOT_CENTER, 15, { animate: true });
}

function zoomIn() {
  map?.zoomIn();
}

function zoomOut() {
  map?.zoomOut();
}

function renderRoads() {
  roadLayerGroup.clearLayers();
  if (!layers.value.roads) return;

  store.roads.forEach((road) => {
    const latlngs = road.geometry.map(([lng, lat]) => [lat, lng] as [number, number]);
    const polyline = L.polyline(latlngs, {
      color: '#2563eb',
      weight: 4,
      opacity: 0.85,
      dashArray: road.oneway ? '6, 6' : undefined,
    });

    polyline.bindTooltip(
      `<strong>${road.name}</strong><br/>长度: ${road.length_m}m | 宽度: ${road.width_m}m | 材质: ${road.surface}`,
      { sticky: true, className: 'leaflet-custom-tooltip' }
    );

    polyline.on('click', () => {
      emit('selectRoad', road);
    });

    roadLayerGroup.addLayer(polyline);
  });
}

function renderScenarios() {
  scenarioLayerGroup.clearLayers();
  if (!layers.value.scenarios) return;

  store.riskScenarios.forEach((sc) => {
    const [lng, lat] = sc.geometry;
    // Buffer circle
    const circle = L.circle([lat, lng], {
      radius: sc.buffer_m,
      color: '#f59e0b',
      fillColor: '#fef3c7',
      fillOpacity: 0.35,
      weight: 1.5,
      dashArray: '4, 4',
    });

    // Icon marker
    const icon = L.divIcon({
      className: 'custom-scenario-marker',
      html: `<div class="bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm border border-white">!</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([lat, lng], { icon });

    marker.bindTooltip(
      `<strong>[风险场景] ${sc.name}</strong><br/>类型: ${sc.type}<br/>缓冲区: ${sc.buffer_m}m | 风险权重: +${sc.risk_weight}<br/><em>${sc.remark}</em>`,
      { sticky: true }
    );

    circle.on('click', () => emit('selectScenario', sc));
    marker.on('click', () => emit('selectScenario', sc));

    scenarioLayerGroup.addLayer(circle);
    scenarioLayerGroup.addLayer(marker);
  });
}

function renderFacilities() {
  facilityLayerGroup.clearLayers();
  if (!layers.value.facilities) return;

  store.facilities.forEach((fac) => {
    const [lng, lat] = fac.geometry;
    const icon = L.divIcon({
      className: 'custom-facility-marker',
      html: `<div class="bg-indigo-600 text-white rounded-md w-5 h-5 flex items-center justify-center text-[9px] font-bold shadow-sm border border-white">设</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([lat, lng], { icon });
    marker.bindTooltip(
      `<strong>[固定设施] ${fac.type} (${fac.id})</strong><br/>所在道路: ${fac.road_name}<br/>状态: ${fac.condition} | 来源: ${fac.source}`,
      { sticky: true }
    );

    marker.on('click', () => emit('selectFacility', fac));
    facilityLayerGroup.addLayer(marker);
  });
}

function renderTracks() {
  trackLayerGroup.clearLayers();
  if (!layers.value.tracks) return;

  store.rideTracks.forEach((track) => {
    const latlngs = track.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    const polyline = L.polyline(latlngs, {
      color: '#10b981',
      weight: 2.5,
      opacity: 0.6,
      dashArray: '3, 5',
    });

    polyline.bindTooltip(
      `<strong>骑行轨迹: ${track.track_no}</strong><br/>骑行者: ${track.rider}<br/>里程: ${track.distance_km}km | 提取事件: ${track.event_count}个`,
      { sticky: true }
    );

    trackLayerGroup.addLayer(polyline);
  });
}

function renderDamages() {
  damageLayerGroup.clearLayers();
  if (!layers.value.damages) return;

  filteredDamages.value.forEach((damage) => {
    const [lng, lat] = damage.geometry;
    let bgColor = '#ef4444'; // High risk
    if (damage.risk_level === '中') bgColor = '#f59e0b';
    if (damage.risk_level === '低') bgColor = '#3b82f6';
    if (damage.status === '待确认') bgColor = '#64748b';
    if (damage.status === '已销项') bgColor = '#10b981';

    const isHighlighted = props.highlightDamageId === damage.id;
    const size = isHighlighted ? 28 : 22;
    const ringClass = isHighlighted ? 'ring-4 ring-blue-400 animate-pulse' : '';

    const icon = L.divIcon({
      className: 'custom-damage-marker',
      html: `
        <div style="background-color: ${bgColor};" class="text-white rounded-full w-[${size}px] h-[${size}px] flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-white cursor-pointer ${ringClass} transition-transform hover:scale-110">
          ${damage.risk_score}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    const marker = L.marker([lat, lng], { icon });

    marker.bindTooltip(
      `<strong>[${damage.type}] ${damage.id}</strong><br/>
       位置: ${damage.road_name} ${damage.mileage_m}m<br/>
       风险评分: <span style="color:${bgColor};font-weight:bold">${damage.risk_score}分 (${damage.risk_level}风险)</span><br/>
       置信度: ${damage.confidence}% | 状态: <strong>${damage.status}</strong>`,
      { sticky: true }
    );

    marker.on('click', () => {
      emit('selectDamage', damage);
    });

    damageLayerGroup.addLayer(marker);
  });
}

function renderAllLayers() {
  renderRoads();
  renderScenarios();
  renderFacilities();
  renderTracks();
  renderDamages();
}

function flyToLocation(lat: number, lng: number, zoom = 17) {
  map?.flyTo([lat, lng], zoom, { duration: 1.2 });
}

defineExpose({
  flyToLocation,
  resetView,
});

watch(layers, () => renderAllLayers(), { deep: true });
watch(() => [props.filterType, props.filterRisk, props.filterStatus, store.damages.length, props.highlightDamageId], () => {
  renderDamages();
});
watch(() => [store.facilities.length, store.riskScenarios.length, store.roads.length], () => {
  renderAllLayers();
});

onMounted(() => {
  initMap();
  if (mapContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      map?.invalidateSize();
    });
    resizeObserver.observe(mapContainer.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style>
.leaflet-custom-tooltip {
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 10px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  color: #1e293b;
}
</style>
