<template>
  <div class="flex flex-col gap-4">
    <!-- Top Filter Bar Card -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
          <h2 class="text-base font-bold text-slate-800">非机动车道微病害台账</h2>
          <span class="text-xs text-slate-400">共检索到 {{ filteredDamages.length }} 条记录</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <el-button
            type="primary"
            plain
            size="small"
            :disabled="selectedRows.length === 0"
            @click="handleBatchInspection"
          >
            批量派发巡检 ({{ selectedRows.length }})
          </el-button>
          <el-button
            type="warning"
            plain
            size="small"
            :disabled="selectedRows.length === 0"
            @click="handleBatchWorkOrder"
          >
            批量生成工单 ({{ selectedRows.length }})
          </el-button>
          <el-button size="small" @click="exportCSV">
            导出 CSV
          </el-button>
        </div>
      </div>

      <!-- Filters Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs pt-2 border-t border-slate-100">
        <!-- 1. Search Query -->
        <div>
          <label class="text-slate-500 font-medium mb-1 block">关键词搜索</label>
          <el-input v-model="filters.query" placeholder="搜编号/道路/说明" clearable size="small" prefix-icon="Search" />
        </div>

        <!-- 2. Road Filter -->
        <div>
          <label class="text-slate-500 font-medium mb-1 block">所属道路</label>
          <el-select v-model="filters.road" placeholder="选择道路" clearable size="small" class="w-full">
            <el-option label="全部道路" value="" />
            <el-option v-for="r in store.roads" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </div>

        <!-- 3. Damage Type -->
        <div>
          <label class="text-slate-500 font-medium mb-1 block">病害类型</label>
          <el-select v-model="filters.type" placeholder="选择类型" clearable size="small" class="w-full">
            <el-option label="全部类型" value="" />
            <el-option label="坑洼" value="坑洼" />
            <el-option label="沉陷" value="沉陷" />
            <el-option label="凸起" value="凸起" />
            <el-option label="修补破损" value="修补破损" />
            <el-option label="严重裂缝" value="严重裂缝" />
            <el-option label="连续颠簸路段" value="连续颠簸路段" />
          </el-select>
        </div>

        <!-- 4. Risk Level -->
        <div>
          <label class="text-slate-500 font-medium mb-1 block">风险等级</label>
          <el-select v-model="filters.riskLevel" placeholder="选择风险" clearable size="small" class="w-full">
            <el-option label="全部风险" value="" />
            <el-option label="高风险 (≥70)" value="高" />
            <el-option label="中风险 (40-69)" value="中" />
            <el-option label="低风险 (<40)" value="低" />
          </el-select>
        </div>

        <!-- 5. Status -->
        <div>
          <label class="text-slate-500 font-medium mb-1 block">生命周期状态</label>
          <el-select v-model="filters.status" placeholder="选择状态" clearable size="small" class="w-full">
            <el-option label="全部状态" value="" />
            <el-option label="待确认" value="待确认" />
            <el-option label="已确认" value="已确认" />
            <el-option label="待维修" value="待维修" />
            <el-option label="已维修" value="已维修" />
            <el-option label="已销项" value="已销项" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- Data Table Card -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
      <el-table
        :data="paginatedDamages"
        stripe
        style="width: 100%"
        size="default"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />

        <el-table-column prop="id" label="病害编号" width="130">
          <template #default="{ row }">
            <span
              class="font-mono font-semibold text-blue-600 hover:underline cursor-pointer"
              @click="openDrawer(row)"
            >
              {{ row.id }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="类型与严重度" width="130">
          <template #default="{ row }">
            <div class="font-medium text-slate-800">{{ row.type }}</div>
            <div class="text-[11px] text-slate-400">{{ row.severity }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="road_name" label="所在位置与桩号" min-width="180">
          <template #default="{ row }">
            <div class="text-xs text-slate-800 font-medium">{{ row.road_name }}</div>
            <div class="text-[11px] text-slate-500">{{ row.direction }} · 里程 {{ row.mileage_m }}m 处</div>
            <div v-if="row.near_scenario_name" class="text-[10px] text-amber-600 truncate mt-0.5">
              ⚠️ {{ row.near_scenario_name }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="risk_score" label="风险评分与模型" width="140" sortable>
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'text-sm font-bold',
                  row.risk_level === '高' ? 'text-red-600' : row.risk_level === '中' ? 'text-amber-600' : 'text-blue-600',
                ]"
              >
                {{ row.risk_score }} 分
              </span>
              <StatusTag :value="row.risk_level + '风险'" />
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">危害{{ row.factors.harm_score }} | 场景{{ row.factors.vulnerability_score }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="confidence" label="感知置信度" width="120" sortable>
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <span class="text-xs font-semibold">{{ row.confidence }}%</span>
              <span v-if="row.confidence < 60" class="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded">需核验</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">关联 {{ row.linked_events_count }} 次冲击</div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="当前状态" width="110">
          <template #default="{ row }">
            <StatusTag :value="row.status" />
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="发现时间" width="135" />

        <el-table-column label="管理操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-1.5">
              <el-button link type="primary" size="small" @click="openDrawer(row)">
                抽屉
              </el-button>
              <el-button link type="primary" size="small" @click="router.push(`/damages/${row.id}`)">
                详情页
              </el-button>
              <el-button
                v-if="row.status === '待确认'"
                link
                type="warning"
                size="small"
                @click="openDrawer(row)"
              >
                派巡检
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div>共 {{ filteredDamages.length }} 条记录，当前第 {{ currentPage }}/{{ totalPages }} 页</div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredDamages.length"
          :page-sizes="[10, 20, 50]"
          layout="prev, pager, next, sizes"
          size="small"
        />
      </div>
    </div>

    <!-- Damage Drawer -->
    <DamageDrawer v-model="drawerVisible" :damage="selectedDamage" @updated="drawerVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import type { DamageItem } from '../types';
import StatusTag from '../components/StatusTag.vue';
import DamageDrawer from '../components/DamageDrawer.vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const store = useAppStore();

const filters = reactive({
  query: '',
  road: '',
  type: '',
  riskLevel: '',
  status: '',
});

const selectedRows = ref<DamageItem[]>([]);
const drawerVisible = ref(false);
const selectedDamage = ref<DamageItem | null>(null);

const currentPage = ref(1);
const pageSize = ref(10);

onMounted(() => {
  if (route.query.status) {
    filters.status = String(route.query.status);
  }
  if (route.query.risk) {
    filters.riskLevel = String(route.query.risk);
  }
});

const filteredDamages = computed(() => {
  return store.damages.filter((d) => {
    const q = filters.query.trim().toLowerCase();
    const matchQ = !q || d.id.toLowerCase().includes(q) || d.road_name.includes(q) || d.type.includes(q);
    const matchRoad = !filters.road || d.road_id === filters.road;
    const matchType = !filters.type || d.type === filters.type;
    const matchRisk = !filters.riskLevel || d.risk_level === filters.riskLevel;
    const matchStatus = !filters.status || d.status === filters.status;
    return matchQ && matchRoad && matchType && matchRisk && matchStatus;
  });
});

const totalPages = computed(() => Math.ceil(filteredDamages.value.length / pageSize.value) || 1);

const paginatedDamages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredDamages.value.slice(start, start + pageSize.value);
});

function handleSelectionChange(rows: DamageItem[]) {
  selectedRows.value = rows;
}

function openDrawer(damage: DamageItem) {
  selectedDamage.value = damage;
  drawerVisible.value = true;
}

function handleBatchInspection() {
  const count = selectedRows.value.length;
  selectedRows.value.forEach((d) => {
    if (d.status === '待确认') {
      store.createInspectionTask({
        damage_id: d.id,
        priority: d.risk_level === '高' ? '紧急' : '高',
      });
    }
  });
  ElMessage.success(`已为选中的 ${count} 个病害批量生成巡检任务`);
}

function handleBatchWorkOrder() {
  const count = selectedRows.value.length;
  selectedRows.value.forEach((d) => {
    if (d.status === '已确认' || d.risk_level === '高') {
      store.createWorkOrder({
        damage_id: d.id,
      });
    }
  });
  ElMessage.success(`已为选中的 ${count} 个病害批量创建维修工单`);
}

function exportCSV() {
  const headers = ['病害编号', '道路名称', '方向', '桩号里程(m)', '病害类型', '严重度', '风险评分', '风险等级', '置信度(%)', '当前状态', '发现时间'];
  const rows = filteredDamages.value.map((d) => [
    d.id,
    d.road_name,
    d.direction,
    d.mileage_m,
    d.type,
    d.severity,
    d.risk_score,
    d.risk_level,
    d.confidence,
    d.status,
    d.created_at,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `非机动车道微病害清单_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  ElMessage.success('已成功导出病害清单 CSV');
}
</script>
