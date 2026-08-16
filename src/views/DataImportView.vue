<template>
  <div class="flex flex-col gap-5">
    <!-- Top Header -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
          <el-icon :size="20"><UploadFilled /></el-icon>
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-800">骑行众包传感器数据导入与质量校验</h2>
          <p class="text-xs text-slate-500 mt-0.5">支持智能手机/车载传感器 CSV/GeoJSON 轨迹数据解析、地图匹配投影与微病害候选事件聚合</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button plain size="small" @click="downloadTemplate">
          下载标准数据模板 (.csv)
        </el-button>
        <el-button type="primary" plain size="small" @click="loadPresetSample">
          加载演示示例数据集 (永德路)
        </el-button>
      </div>
    </div>

    <!-- Upload & Preview Box -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- Left: Upload Zone -->
      <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <h3 class="text-sm font-bold text-slate-800 mb-3">1. 上传传感器轨迹文件</h3>

        <div
          class="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/30"
          @click="triggerFileSelect"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".csv,.json,.geojson"
            class="hidden"
            @change="handleFileChange"
          />
          <el-icon :size="40" class="text-blue-500 mb-2"><Upload /></el-icon>
          <div class="text-xs font-semibold text-slate-700">点击或将骑行数据文件拖拽至此处</div>
          <div class="text-[11px] text-slate-400 mt-1">支持 .csv, .geojson, .json 格式 (单文件 ≤ 50MB)</div>
        </div>

        <!-- Selected File Status -->
        <div v-if="selectedFileName" class="mt-4 p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs flex items-center justify-between">
          <div class="flex items-center gap-2 text-blue-900 font-medium truncate">
            <el-icon><Document /></el-icon>
            <span class="truncate">{{ selectedFileName }}</span>
          </div>
          <span class="text-slate-500 shrink-0">{{ fileSizeText }}</span>
        </div>

        <el-button
          type="primary"
          class="w-full mt-4 !rounded-xl"
          :disabled="!selectedFileName || isProcessing"
          :loading="isProcessing"
          @click="startProcessingData"
        >
          {{ isProcessing ? '正在执行质量校验与地图匹配...' : '开始导入并解析微病害' }}
        </el-button>
      </div>

      <!-- Right: 5-Point Validation Engine & Progress -->
      <div class="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-800">2. 传感器数据质量多维校验引擎 (5项规则)</h3>
            <span v-if="validationDone" class="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <el-icon><Check /></el-icon> 校验通过率 100%
            </span>
          </div>

          <!-- Progress Bar during processing -->
          <div v-if="isProcessing" class="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
            <div class="flex justify-between text-xs text-slate-600">
              <span class="font-medium">{{ processStepText }}</span>
              <span class="font-bold text-blue-600">{{ processProgress }}%</span>
            </div>
            <el-progress :percentage="processProgress" :stroke-width="8" :show-text="false" status="success" />
          </div>

          <!-- 5 Rules Verification Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5">
              <el-icon :class="validationDone ? 'text-emerald-600 mt-0.5' : 'text-slate-400 mt-0.5'"><CircleCheckFilled /></el-icon>
              <div>
                <div class="font-semibold text-slate-800">① 经纬度边界与漂移核查</div>
                <div class="text-[11px] text-slate-500 mt-0.5">WGS84坐标校验，过滤上海试点区以外及跳变漂移点 (&gt;50km/h)</div>
              </div>
            </div>

            <div class="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5">
              <el-icon :class="validationDone ? 'text-emerald-600 mt-0.5' : 'text-slate-400 mt-0.5'"><CircleCheckFilled /></el-icon>
              <div>
                <div class="font-semibold text-slate-800">② 时间戳连续单调性检查</div>
                <div class="text-[11px] text-slate-500 mt-0.5">确保采样频率 (20Hz-50Hz) 均匀且无倒流重复时间戳</div>
              </div>
            </div>

            <div class="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5">
              <el-icon :class="validationDone ? 'text-emerald-600 mt-0.5' : 'text-slate-400 mt-0.5'"><CircleCheckFilled /></el-icon>
              <div>
                <div class="font-semibold text-slate-800">③ 三轴加速度通道完整性</div>
                <div class="text-[11px] text-slate-500 mt-0.5">检查 ax, ay, az 重力剔除与垂向加速度有效范围 (±40m/s²)</div>
              </div>
            </div>

            <div class="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5">
              <el-icon :class="validationDone ? 'text-emerald-600 mt-0.5' : 'text-slate-400 mt-0.5'"><CircleCheckFilled /></el-icon>
              <div>
                <div class="font-semibold text-slate-800">④ 陀螺仪角速度有效性</div>
                <div class="text-[11px] text-slate-500 mt-0.5">过滤因剧烈挥手、掉落产生的瞬时超限离群抖动 (±500°/s)</div>
              </div>
            </div>

            <div class="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5 sm:col-span-2">
              <el-icon :class="validationDone ? 'text-emerald-600 mt-0.5' : 'text-slate-400 mt-0.5'"><CircleCheckFilled /></el-icon>
              <div>
                <div class="font-semibold text-slate-800">⑤ 非机动车有效骑行速度过滤 (3 km/h ~ 35 km/h)</div>
                <div class="text-[11px] text-slate-500 mt-0.5">自动排除静止红绿灯等待阶段及搭载机动车的高速干扰轨迹</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Result Stats when done -->
        <div v-if="validationDone" class="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
          <span>
            <strong>解析成功：</strong>共导入 <strong>1,840</strong> 个点位，识别出 <strong>4</strong> 处异常颠簸事件，已成功匹配至 <strong>永德路</strong> 非机动车道路网。
          </span>
          <el-button size="small" type="success" @click="router.push('/tracks')">
            查看轨迹详情 &rarr;
          </el-button>
        </div>
      </div>
    </div>

    <!-- Data Preview Table (First 5 Rows) -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-bold text-slate-800">3. 轨迹数据字段映射与前 5 行数据预览</h3>
          <span class="text-xs text-slate-400">系统已自动识别并绑定标准时空与动力学字段</span>
        </div>
      </div>

      <el-table :data="previewData" stripe size="small" style="width: 100%">
        <el-table-column prop="timestamp" label="时间戳 (timestamp)" width="180" />
        <el-table-column prop="lng" label="经度 (lng / WGS84)" width="140" />
        <el-table-column prop="lat" label="纬度 (lat / WGS84)" width="140" />
        <el-table-column prop="acc_z" label="垂向加速度 az (m/s²)" width="160">
          <template #default="{ row }">
            <span :class="row.acc_z > 15 ? 'text-red-600 font-bold' : 'text-slate-700'">{{ row.acc_z }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="acc_x" label="横向加速度 ax (m/s²)" width="150" />
        <el-table-column prop="gyro_z" label="偏航角速度 gz (°/s)" width="150" />
        <el-table-column prop="speed" label="骑行速度 (km/h)" width="130" />
      </el-table>
    </div>

    <!-- Historical Import Logs -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-slate-800">历史导入任务记录</h3>
        <span class="text-xs text-slate-400">最近 30 天记录</span>
      </div>

      <el-table :data="importLogs" stripe size="small" style="width: 100%">
        <el-table-column prop="id" label="任务ID" width="120" />
        <el-table-column prop="file_name" label="导入文件名" min-width="200" />
        <el-table-column prop="rows" label="数据行数" width="100" />
        <el-table-column prop="extracted_events" label="提取事件数" width="110">
          <template #default="{ row }">
            <span class="text-blue-600 font-semibold">{{ row.extracted_events }} 个</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="解析状态" width="110">
          <template #default="{ row }">
            <StatusTag :value="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="110" />
        <el-table-column prop="time" label="导入时间" width="140" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import StatusTag from '../components/StatusTag.vue';
import { UploadFilled, Upload, Document, Check, CircleCheckFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFileName = ref('');
const fileSizeText = ref('');
const isProcessing = ref(false);
const processProgress = ref(0);
const processStepText = ref('');
const validationDone = ref(false);

const previewData = ref([
  { timestamp: '2026-08-16 08:15:02.100', lng: 121.4342, lat: 31.0238, acc_z: 9.81, acc_x: 0.12, gyro_z: 0.05, speed: 18.2 },
  { timestamp: '2026-08-16 08:15:02.150', lng: 121.4343, lat: 31.0238, acc_z: 11.45, acc_x: 0.35, gyro_z: 0.12, speed: 18.4 },
  { timestamp: '2026-08-16 08:15:02.200', lng: 121.4345, lat: 31.0239, acc_z: 24.82, acc_x: 1.85, gyro_z: 0.45, speed: 18.1 },
  { timestamp: '2026-08-16 08:15:02.250', lng: 121.4346, lat: 31.0240, acc_z: 14.12, acc_x: 0.92, gyro_z: 0.20, speed: 17.8 },
  { timestamp: '2026-08-16 08:15:02.300', lng: 121.4347, lat: 31.0241, acc_z: 9.90, acc_x: 0.10, gyro_z: 0.08, speed: 17.6 },
]);

const importLogs = ref([
  { id: 'IMP-20260816-01', file_name: '永德路_早高峰众包轨迹_20260816.csv', rows: 2450, extracted_events: 4, status: '已销项' as any, operator: '张明远', time: '2026-08-16 08:30' },
  { id: 'IMP-20260815-02', file_name: '剑川路_巡检实测轨迹_20260815.csv', rows: 1820, extracted_events: 3, status: '已销项' as any, operator: '李建军', time: '2026-08-15 14:20' },
  { id: 'IMP-20260814-01', file_name: '莲花南路_众包骑行轨迹_20260814.csv', rows: 3100, extracted_events: 5, status: '已销项' as any, operator: '张明远', time: '2026-08-14 09:10' },
]);

function triggerFileSelect() {
  fileInputRef.value?.click();
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    selectedFileName.value = file.name;
    fileSizeText.value = `${(file.size / 1024).toFixed(1)} KB`;
    validationDone.value = false;
  }
}

function loadPresetSample() {
  selectedFileName.value = '永德路_闵行非机动车道众包感知数据集_20260816.csv';
  fileSizeText.value = '348.5 KB';
  validationDone.value = false;
  ElMessage.success('已载入永德路试点区骑行传感器示例数据集');
}

function downloadTemplate() {
  const csvContent =
    '\uFEFF' +
    'timestamp,longitude,latitude,acc_z,acc_x,acc_y,gyro_z,speed_kmh\n' +
    '2026-08-16 08:00:00.000,121.4342,31.0238,9.81,0.12,-0.05,0.02,18.5\n' +
    '2026-08-16 08:00:00.050,121.4343,31.0239,24.80,1.20,-0.15,0.35,18.2\n';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '道路微病害众包传感器数据导入标准模板.csv';
  a.click();
  ElMessage.success('标准模板下载成功');
}

function startProcessingData() {
  isProcessing.value = true;
  processProgress.value = 10;
  processStepText.value = '正在读取文件并进行时空格式转换...';

  setTimeout(() => {
    processProgress.value = 35;
    processStepText.value = '正在执行 5 项传感器数据质量多维规则校验...';
  }, 400);

  setTimeout(() => {
    processProgress.value = 70;
    processStepText.value = '正在与非机动车道空间路网进行地图匹配与桩号投影...';
  }, 900);

  setTimeout(() => {
    processProgress.value = 95;
    processStepText.value = '正在聚类颠簸冲击事件并计算可解释风险得分...';
  }, 1400);

  setTimeout(() => {
    processProgress.value = 100;
    isProcessing.value = false;
    validationDone.value = true;
    ElMessage.success('数据校验与微病害解析完成！已生成候选病害记录');
  }, 1800);
}
</script>
