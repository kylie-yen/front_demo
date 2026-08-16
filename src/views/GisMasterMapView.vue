<template>
  <div class="h-[calc(100vh-105px)] flex gap-4 overflow-hidden relative">
    <!-- Left Filter & Quick Search Sidebar -->
    <div class="w-80 bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-2xs overflow-y-auto">
      <div class="flex flex-col gap-4">
        <!-- Search Bar -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 mb-2">空间定位与检索</h3>
          <el-input
            v-model="searchQuery"
            placeholder="搜病害编号 / 道路名 / 设施"
            prefix-icon="Search"
            clearable
            size="default"
          />
        </div>

        <!-- Filter Dimension Selectors -->
        <div class="flex flex-col gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label class="font-medium text-slate-600 mb-1 block">病害类型筛选</label>
            <el-select v-model="selectedType" class="w-full" size="small">
              <el-option label="全部类型" value="全部" />
              <el-option label="坑洼" value="坑洼" />
              <el-option label="沉陷" value="沉陷" />
              <el-option label="凸起" value="凸起" />
              <el-option label="修补破损" value="修补破损" />
              <el-option label="严重裂缝" value="严重裂缝" />
              <el-option label="连续颠簸路段" value="连续颠簸路段" />
            </el-select>
          </div>

          <div>
            <label class="font-medium text-slate-600 mb-1 block">风险等级筛选</label>
            <el-radio-group v-model="selectedRisk" size="small" class="w-full">
              <el-radio-button value="全部">全部</el-radio-button>
              <el-radio-button value="高">高风险</el-radio-button>
              <el-radio-button value="中">中风险</el-radio-button>
              <el-radio-button value="低">低风险</el-radio-button>
            </el-radio-group>
          </div>

          <div>
            <label class="font-medium text-slate-600 mb-1 block">生命周期状态</label>
            <el-select v-model="selectedStatus" class="w-full" size="small">
              <el-option label="全部状态" value="全部" />
              <el-option label="待确认" value="待确认" />
              <el-option label="已确认" value="已确认" />
              <el-option label="待维修" value="待维修" />
              <el-option label="已维修" value="已维修" />
              <el-option label="已销项" value="已销项" />
            </el-select>
          </div>
        </div>

        <!-- Point List Search Results -->
        <div class="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span>匹配空间点位 ({{ searchedDamages.length }})</span>
            <span class="text-[10px] text-blue-600 cursor-pointer" @click="resetFilters">重置</span>
          </div>

          <div class="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            <div
              v-for="d in searchedDamages"
              :key="d.id"
              @click="locateAndSelectDamage(d)"
              :class="[
                'p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1 text-xs',
                highlightId === d.id
                  ? 'border-blue-500 bg-blue-50/70 shadow-2xs'
                  : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100',
              ]"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 font-bold text-slate-800">
                  <span
                    :class="[
                      'w-2 h-2 rounded-full',
                      d.risk_level === '高' ? 'bg-red-500' : d.risk_level === '中' ? 'bg-amber-500' : 'bg-blue-500',
                    ]"
                  />
                  <span>{{ d.id }}</span>
                  <span class="font-normal text-slate-500 text-[11px]">({{ d.type }})</span>
                </div>
                <StatusTag :value="d.risk_level + '风险'" />
              </div>
              <div class="text-[11px] text-slate-500 truncate">{{ d.road_name }} {{ d.mileage_m }}m</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Simulation Tools -->
      <div class="pt-3 border-t border-slate-100 flex flex-col gap-2">
        <span class="text-[11px] font-semibold text-slate-600">地图标定与标注工具：</span>
        <div class="grid grid-cols-2 gap-1.5">
          <el-button size="small" type="primary" plain @click="openAddDamageModal">
            + 标定病害
          </el-button>
          <el-button size="small" type="success" plain @click="openAddFacilityModal">
            + 标定设施
          </el-button>
        </div>
      </div>
    </div>

    <!-- Right: GIS Map Container -->
    <div class="flex-1 h-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs relative">
      <GisMap
        ref="gisMapRef"
        :filter-type="selectedType"
        :filter-risk="selectedRisk"
        :filter-status="selectedStatus"
        :highlight-damage-id="highlightId"
        @select-damage="handleSelectDamage"
        @select-road="handleSelectRoad"
        @select-facility="handleSelectFacility"
        @select-scenario="handleSelectScenario"
        @map-click="handleMapClick"
      />
    </div>

    <!-- Damage Drawer -->
    <DamageDrawer v-model="drawerVisible" :damage="selectedDamage" @updated="handleDamageUpdated" />

    <!-- Add Damage Modal -->
    <el-dialog v-model="showAddDamageDialog" title="人工上报 / 现场实测标定病害点" width="480px">
      <el-form :model="addDamageForm" label-position="top" class="text-xs">
        <el-form-item label="所在道路">
          <el-select v-model="addDamageForm.road_id" class="w-full">
            <el-option v-for="r in store.roads" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <div class="grid grid-cols-2 gap-2">
          <el-form-item label="病害类型">
            <el-select v-model="addDamageForm.type" class="w-full">
              <el-option label="坑洼" value="坑洼" />
              <el-option label="沉陷" value="沉陷" />
              <el-option label="凸起" value="凸起" />
              <el-option label="修补破损" value="修补破损" />
              <el-option label="严重裂缝" value="严重裂缝" />
            </el-select>
          </el-form-item>
          <el-form-item label="严重程度">
            <el-select v-model="addDamageForm.severity" class="w-full">
              <el-option label="重度" value="重度" />
              <el-option label="中度" value="中度" />
              <el-option label="轻度" value="轻度" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="距道路起点里程 (米)">
          <el-input-number v-model="addDamageForm.mileage_m" :min="10" :max="1500" class="!w-full" />
        </el-form-item>
        <el-form-item label="危害程度打分 (0-100)">
          <el-slider v-model="addDamageForm.harm_score" :max="100" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDamageDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveDamage">保存在地图上</el-button>
      </template>
    </el-dialog>

    <!-- Add Facility Modal -->
    <el-dialog v-model="showAddFacilityDialog" title="标定固定设施 (硬负样本)" width="480px">
      <el-form :model="addFacilityForm" label-position="top" class="text-xs">
        <el-form-item label="设施类型">
          <el-select v-model="addFacilityForm.type" class="w-full">
            <el-option label="井盖" value="井盖" />
            <el-option label="雨水篦子" value="雨水篦子" />
            <el-option label="减速带" value="减速带" />
            <el-option label="道路接缝" value="道路接缝" />
            <el-option label="路缘坡道" value="路缘坡道" />
          </el-select>
        </el-form-item>
        <el-form-item label="所在道路">
          <el-select v-model="addFacilityForm.road_id" class="w-full">
            <el-option v-for="r in store.roads" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="设施状态">
          <el-select v-model="addFacilityForm.condition" class="w-full">
            <el-option label="良好" value="良好" />
            <el-option label="轻微下沉" value="轻微下沉" />
            <el-option label="凸起松动" value="凸起松动" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddFacilityDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveFacility">保存设施</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useAppStore } from '../stores/appStore';
import type { DamageItem, RoadItem, FacilityItem, RiskScenarioItem, DamageType, FacilityType } from '../types';
import GisMap from '../components/GisMap.vue';
import DamageDrawer from '../components/DamageDrawer.vue';
import StatusTag from '../components/StatusTag.vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const store = useAppStore();
const gisMapRef = ref<any>(null);

const searchQuery = ref('');
const selectedType = ref('全部');
const selectedRisk = ref('全部');
const selectedStatus = ref('全部');

const highlightId = ref('');
const selectedDamage = ref<DamageItem | null>(null);
const drawerVisible = ref(false);

const searchedDamages = computed(() => {
  return store.damages.filter((d) => {
    const q = searchQuery.value.trim().toLowerCase();
    const matchQ = !q || d.id.toLowerCase().includes(q) || d.road_name.includes(q) || d.type.includes(q);
    const matchType = selectedType.value === '全部' || d.type === selectedType.value;
    const matchRisk = selectedRisk.value === '全部' || d.risk_level === selectedRisk.value;
    const matchStatus = selectedStatus.value === '全部' || d.status === selectedStatus.value;
    return matchQ && matchType && matchRisk && matchStatus;
  });
});

function resetFilters() {
  searchQuery.value = '';
  selectedType.value = '全部';
  selectedRisk.value = '全部';
  selectedStatus.value = '全部';
  highlightId.value = '';
}

function handleSelectDamage(damage: DamageItem) {
  selectedDamage.value = damage;
  highlightId.value = damage.id;
  drawerVisible.value = true;
}

function locateAndSelectDamage(damage: DamageItem) {
  selectedDamage.value = damage;
  highlightId.value = damage.id;
  drawerVisible.value = true;
  gisMapRef.value?.flyToLocation(damage.geometry[1], damage.geometry[0], 17);
}

function handleSelectRoad(road: RoadItem) {
  ElMessage.info(`选中道路：${road.name} (全长 ${road.length_m}m，${road.surface})`);
}

function handleSelectFacility(fac: FacilityItem) {
  ElMessage.info(`固定设施：${fac.type} (${fac.condition}，来源: ${fac.source})`);
}

function handleSelectScenario(sc: RiskScenarioItem) {
  ElMessage.warning(`敏感风险场景：${sc.name} (缓冲区 ${sc.buffer_m}m，叠加权重 +${sc.risk_weight})`);
}

function handleMapClick(latlng: { lat: number; lng: number }) {
  lastClickedLatLng.value = latlng;
}

const lastClickedLatLng = ref<{ lat: number; lng: number }>({ lat: 31.0253, lng: 121.4367 });

function handleDamageUpdated() {
  // refresh
}

// Add Damage Modal
const showAddDamageDialog = ref(false);
const addDamageForm = reactive({
  road_id: 'RD-001',
  type: '坑洼' as DamageType,
  severity: '中度' as '轻度' | '中度' | '重度',
  mileage_m: 520,
  harm_score: 75,
});

function openAddDamageModal() {
  showAddDamageDialog.value = true;
}

function handleSaveDamage() {
  const newD = store.createManualDamage({
    road_id: addDamageForm.road_id,
    type: addDamageForm.type,
    severity: addDamageForm.severity,
    mileage_m: addDamageForm.mileage_m,
    geometry: [lastClickedLatLng.value.lng, lastClickedLatLng.value.lat],
    photos: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'],
    factors: {
      harm_score: addDamageForm.harm_score,
      exposure_score: 70,
      vulnerability_score: 65,
      trend_score: 50,
      consequence_score: 60,
    },
  });
  ElMessage.success(`标定新增病害点 ${newD.id} 成功`);
  showAddDamageDialog.value = false;
  locateAndSelectDamage(newD);
}

// Add Facility Modal
const showAddFacilityDialog = ref(false);
const addFacilityForm = reactive({
  type: '井盖' as FacilityType,
  road_id: 'RD-001',
  condition: '良好' as any,
});

function openAddFacilityModal() {
  showAddFacilityDialog.value = true;
}

function handleSaveFacility() {
  const road = store.roads.find((r) => r.id === addFacilityForm.road_id) || store.roads[0];
  const newFac = store.addFacility({
    type: addFacilityForm.type,
    road_id: road.id,
    road_name: road.name,
    offset_m: 280,
    distance_m: 0.8,
    condition: addFacilityForm.condition,
    source: '人工普查',
    photo_url: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&auto=format&fit=crop&q=80',
    geometry: [lastClickedLatLng.value.lng, lastClickedLatLng.value.lat],
  });
  ElMessage.success(`标定固定设施 ${newFac.id} 成功，将自动作为硬负样本抑制误报`);
  showAddFacilityDialog.value = false;
}
</script>
