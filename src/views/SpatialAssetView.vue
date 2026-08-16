<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
          <el-icon :size="20"><Files /></el-icon>
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-800">非机动车道空间图层与底座资产管理</h2>
          <p class="text-xs text-slate-500 mt-0.5">维护道路中心线网、固定设施硬负样本底库与敏感脆弱场景缓冲区</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button plain size="small" @click="exportSpatialGeoJSON">
          导出全域 GeoJSON 图层
        </el-button>
      </div>
    </div>

    <!-- Main Tabs -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
      <el-tabs v-model="activeTab" class="custom-spatial-tabs">
        <!-- Tab 1: Roads -->
        <el-tab-pane label="非机动车道路网 (8条)" name="roads">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-700">道路拓扑与中心线信息库</span>
              <el-button type="primary" size="small" @click="showAddRoadModal = true">+ 新增道路路段</el-button>
            </div>

            <el-table :data="store.roads" stripe size="small" style="width: 100%">
              <el-table-column prop="id" label="道路ID" width="110" />
              <el-table-column prop="name" label="道路名称" width="160">
                <template #default="{ row }">
                  <span class="font-bold text-slate-900">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="length_m" label="长度 (米)" width="110" />
              <el-table-column prop="width_m" label="宽度 (米)" width="100" />
              <el-table-column prop="surface" label="路面材质" width="120" />
              <el-table-column prop="oneway" label="通行方向" width="120">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.oneway ? 'warning' : 'info'">{{ row.oneway ? '单向通行' : '双向通行' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="viewRoadOnMap(row)">定位</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- Tab 2: Fixed Facilities (Hard Negative Samples) -->
        <el-tab-pane label="固定设施硬负样本底库" name="facilities">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-slate-700">固定设施底库 (井盖/雨水篦子/减速带)</span>
                <span class="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">作用：用于误报抑制与空间硬负样本滤除</span>
              </div>
              <el-button type="primary" size="small" @click="showAddFacModal = true">+ 新增固定设施</el-button>
            </div>

            <el-table :data="store.facilities" stripe size="small" style="width: 100%">
              <el-table-column prop="id" label="设施编号" width="120" />
              <el-table-column prop="type" label="设施类型" width="120">
                <template #default="{ row }">
                  <StatusTag :value="row.type" />
                </template>
              </el-table-column>
              <el-table-column prop="road_name" label="所在道路" width="150" />
              <el-table-column prop="offset_m" label="距起点桩号 (m)" width="130" />
              <el-table-column prop="condition" label="设施现状" width="120">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.condition === '良好' ? 'success' : 'warning'">{{ row.condition }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="source" label="底库来源" width="130" />
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button link type="danger" size="small" @click="deleteFacility(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- Tab 3: Risk Scenarios Buffers -->
        <el-tab-pane label="敏感风险场景与缓冲区" name="scenarios">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-slate-700">重点敏感场景库 (学校/地铁/下坡)</span>
                <span class="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">作用：空间重叠时为微病害动态加权脆弱性得分</span>
              </div>
              <el-button type="primary" size="small" @click="showAddScModal = true">+ 新增敏感场景</el-button>
            </div>

            <el-table :data="store.riskScenarios" stripe size="small" style="width: 100%">
              <el-table-column prop="id" label="场景ID" width="110" />
              <el-table-column prop="name" label="场景名称" min-width="160">
                <template #default="{ row }">
                  <span class="font-bold text-slate-900">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="场景类型" width="130">
                <template #default="{ row }">
                  <el-tag size="small" type="warning">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="buffer_m" label="影响缓冲区半径" width="140">
                <template #default="{ row }">
                  <span class="font-semibold text-blue-600">{{ row.buffer_m }} 米</span>
                </template>
              </el-table-column>
              <el-table-column prop="risk_weight" label="风险加权分值" width="130">
                <template #default="{ row }">
                  <span class="font-bold text-amber-600">+ {{ row.risk_weight }} 分</span>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="脆弱性特征说明" min-width="200" />
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Modals -->
    <!-- Add Facility Modal -->
    <el-dialog v-model="showAddFacModal" title="新增固定设施底库点位" width="480px">
      <el-form label-position="top" class="text-xs">
        <el-form-item label="设施类型">
          <el-select v-model="addFacForm.type" class="w-full">
            <el-option label="井盖" value="井盖" />
            <el-option label="雨水篦子" value="雨水篦子" />
            <el-option label="减速带" value="减速带" />
            <el-option label="道路接缝" value="道路接缝" />
            <el-option label="路缘坡道" value="路缘坡道" />
          </el-select>
        </el-form-item>
        <el-form-item label="所在道路">
          <el-select v-model="addFacForm.road_id" class="w-full">
            <el-option v-for="r in store.roads" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="距起点桩号里程 (m)">
          <el-input-number v-model="addFacForm.offset_m" :min="10" :max="1500" class="!w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddFacModal = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAddFac">保存入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import type { RoadItem, FacilityType } from '../types';
import StatusTag from '../components/StatusTag.vue';
import { Files } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const store = useAppStore();

const activeTab = ref('roads');

const showAddRoadModal = ref(false);
const showAddFacModal = ref(false);
const showAddScModal = ref(false);

const addFacForm = reactive({
  type: '井盖' as FacilityType,
  road_id: 'RD-001',
  offset_m: 350,
});

function viewRoadOnMap(road: RoadItem) {
  router.push('/gis-map');
}

function handleConfirmAddFac() {
  const road = store.roads.find((r) => r.id === addFacForm.road_id) || store.roads[0];
  store.addFacility({
    type: addFacForm.type,
    road_id: road.id,
    road_name: road.name,
    offset_m: addFacForm.offset_m,
    distance_m: 0.5,
    condition: '良好',
    source: '人工普查录入',
    photo_url: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&auto=format&fit=crop&q=80',
    geometry: [121.4350, 31.0245],
  });
  ElMessage.success('新增固定设施成功，已纳入硬负样本库');
  showAddFacModal.value = false;
}

function deleteFacility(id: string) {
  const idx = store.facilities.findIndex((f) => f.id === id);
  if (idx !== -1) {
    store.facilities.splice(idx, 1);
    ElMessage.success(`已删除设施 ${id}`);
  }
}

function exportSpatialGeoJSON() {
  const geojson = {
    type: 'FeatureCollection',
    features: [
      ...store.roads.map((r) => ({
        type: 'Feature',
        properties: { id: r.id, name: r.name, length: r.length_m, surface: r.surface },
        geometry: { type: 'LineString', coordinates: r.geometry },
      })),
      ...store.facilities.map((f) => ({
        type: 'Feature',
        properties: { id: f.id, type: f.type, condition: f.condition, road: f.road_name },
        geometry: { type: 'Point', coordinates: f.geometry },
      })),
      ...store.riskScenarios.map((s) => ({
        type: 'Feature',
        properties: { id: s.id, name: s.name, type: s.type, buffer_m: s.buffer_m, weight: s.risk_weight },
        geometry: { type: 'Point', coordinates: s.geometry },
      })),
    ],
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `永德路试点区_空间资产图层_${new Date().toISOString().slice(0, 10)}.geojson`;
  a.click();
  ElMessage.success('已导出全域空间资产 GeoJSON');
}
</script>
