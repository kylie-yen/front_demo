<template>
  <div class="flex h-screen w-screen overflow-hidden bg-[#F1F5F9] text-[#334155] font-sans">
    <aside class="z-30 flex w-64 shrink-0 flex-col justify-between border-r border-[#E2E8F0] bg-white">
      <div class="flex flex-col">
        <div class="flex items-center space-x-3 border-b border-slate-100 p-5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#246BCE] text-white shadow-xs">
            <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold leading-tight tracking-tight text-slate-900">道路微病害主动养护平台</span>
            <span class="text-[10px] font-medium text-slate-400">众包感知、核验闭环与养护协同</span>
          </div>
        </div>

        <nav class="max-h-[calc(100vh-140px)] flex-1 space-y-3 overflow-y-auto px-3 py-3">
          <div v-for="group in navGroups" :key="group.title" class="space-y-1">
            <div class="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {{ group.title }}
            </div>
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              v-slot="{ isActive, navigate }"
              custom
            >
              <button
                @click="navigate"
                :class="[
                  'w-full cursor-pointer rounded-xl px-3 py-2 text-left text-xs transition-all duration-150 flex items-center justify-between',
                  isActive ? 'bg-[#F1F5F9] text-[#246BCE] font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium',
                ]"
              >
                <div class="flex min-w-0 items-center space-x-2.5">
                  <el-icon :size="15" :class="isActive ? 'text-[#246BCE]' : 'text-slate-400'">
                    <component :is="item.icon" />
                  </el-icon>
                  <span class="truncate">{{ item.label }}</span>
                </div>
                <span
                  v-if="item.badge && item.badge > 0"
                  class="shrink-0 rounded-full bg-[#D93025] px-1.5 py-0.5 text-[10px] font-bold text-white"
                >
                  {{ item.badge }}
                </span>
              </button>
            </router-link>
          </div>
        </nav>
      </div>

      <div class="border-t border-slate-100 bg-white p-3.5">
        <div class="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 p-2">
          <div class="flex min-w-0 items-center space-x-2.5 overflow-hidden">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#246BCE]/10 text-xs font-bold text-[#246BCE]">
              {{ store.currentUser?.name?.slice(0, 1) || '用' }}
            </div>
            <div class="flex min-w-0 flex-col truncate">
              <span class="truncate text-xs font-bold text-slate-800">{{ store.currentUser?.name }}</span>
              <span class="truncate text-[10px] text-slate-400">{{ store.currentUser?.department || store.currentUser?.role }}</span>
            </div>
          </div>
          <el-tooltip content="退出登录" placement="top">
            <button
              @click="handleLogout"
              class="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-[#D93025]"
            >
              <el-icon :size="14"><SwitchButton /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>
    </aside>

    <div class="flex flex-1 flex-col overflow-hidden">
      <header class="flex h-16 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-6 z-20">
        <div class="flex items-center space-x-4">
          <h1 class="text-base font-bold text-slate-900">{{ currentRouteTitle }}</h1>
          <div class="h-4 w-[1px] bg-slate-200"></div>
          <div class="flex items-center space-x-2 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs">
            <el-icon class="text-[#246BCE]"><Location /></el-icon>
            <span class="text-xs font-medium text-slate-700">{{ store.currentPilotArea }}</span>
            <span class="ml-1 h-1.5 w-1.5 animate-pulse rounded-full bg-[#18A57A]"></span>
          </div>
          <el-date-picker
            v-model="store.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            value-format="YYYY-MM-DD"
            class="!w-56"
          />
        </div>

        <div class="flex items-center space-x-3">
          <div class="hidden text-xs text-slate-400 lg:block">数据更新: 2026-08-16 08:30</div>

          <el-popover placement="bottom-end" :width="340" trigger="click">
            <template #reference>
              <button class="relative cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-slate-100">
                <el-icon :size="18"><Bell /></el-icon>
                <span
                  v-if="unreadCount > 0"
                  class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#D93025] ring-2 ring-white"
                />
              </button>
            </template>
            <div class="p-1">
              <div class="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-xs font-bold text-slate-800">系统通知与告警</span>
                <span class="cursor-pointer text-[10px] text-[#246BCE]" @click="markAllRead">全部标记为已读</span>
              </div>
              <div class="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                <div
                  v-for="item in store.notifications"
                  :key="item.id"
                  class="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-xs transition hover:bg-blue-50/40"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-slate-800">{{ item.title }}</span>
                    <span class="text-[10px] text-slate-400">{{ item.time }}</span>
                  </div>
                  <p class="text-[11px] leading-relaxed text-slate-600">{{ item.message }}</p>
                </div>
              </div>
            </div>
          </el-popover>

          <el-dropdown @command="switchUserRole">
            <button class="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100">
              <span class="text-slate-500">角色:</span>
              <span class="font-medium text-slate-800">{{ store.currentUser?.role }}</span>
              <el-icon :size="12" class="text-slate-400"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="admin">切换为 管理人员 (张明远)</el-dropdown-item>
                <el-dropdown-item command="inspector1">切换为 巡检班组 (李建国)</el-dropdown-item>
                <el-dropdown-item command="repair1">切换为 维修班组 (王宏伟)</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="flex-1 space-y-6 overflow-y-auto p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  ArrowDown,
  Bell,
  Checked,
  Files,
  Location,
  MapLocation,
  Odometer,
  Promotion,
  Setting,
  SwitchButton,
  Tools,
  TrendCharts,
  UploadFilled,
  Warning,
} from '@element-plus/icons-vue';
import { useAppStore } from '../stores/appStore';

const router = useRouter();
const route = useRoute();
const store = useAppStore();

const unreadCount = computed(() => store.notifications.filter((n) => !n.read).length);
const currentRouteTitle = computed(() => (route.meta.title as string) || '信息总览');

const navGroups = computed(() => [
  {
    title: '信息总览',
    items: [
      { path: '/dashboard', label: '综合看板', icon: Odometer },
      { path: '/gis-map', label: '地图看板', icon: MapLocation },
    ],
  },
  {
    title: '业务处理',
    items: [
      { path: '/damages', label: '病害台账', icon: Warning, badge: store.metrics.highRiskDamages },
      { path: '/import', label: '数据导入', icon: UploadFilled },
      { path: '/tracks', label: '轨迹回放', icon: Promotion },
      { path: '/inspections', label: '巡检核验', icon: Checked, badge: store.metrics.pendingInspections },
      { path: '/work-orders', label: '维修工单', icon: Tools, badge: store.metrics.pendingRepairWorkOrders },
    ],
  },
  {
    title: '空间底座',
    items: [
      { path: '/spatial-assets', label: '空间资产', icon: Files },
      { path: '/reports', label: '统计报表', icon: TrendCharts },
    ],
  },
  {
    title: '系统设置',
    items: [{ path: '/settings', label: '系统设置', icon: Setting }],
  },
]);

function markAllRead() {
  store.notifications.forEach((n) => (n.read = true));
  ElMessage.success('已全部标记为已读');
}

function switchUserRole(account: string) {
  store.login(account);
  ElMessage.success(`已切换为「${store.currentUser.role}」身份`);
}

function handleLogout() {
  store.logout();
  router.push('/login');
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
