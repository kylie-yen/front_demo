<template>
  <div class="flex h-screen w-screen overflow-hidden bg-[#F1F5F9] text-[#334155] font-sans">
    <!-- Left Navigation Sidebar -->
    <aside class="w-64 bg-white border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 z-30">
      <!-- Top Brand Header -->
      <div class="flex flex-col">
        <div class="p-5 flex items-center space-x-3 border-b border-slate-100">
          <div class="w-8 h-8 bg-[#246BCE] rounded-lg flex items-center justify-center text-white shadow-xs">
            <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="font-bold text-sm text-slate-900 tracking-tight leading-tight">道路微病害主动养护</span>
            <span class="text-[10px] text-slate-400 font-medium">众包感知与闭环养护平台</span>
          </div>
        </div>

        <!-- Navigation Menu with Clean Categorized Groups -->
        <nav class="flex-1 px-3 py-3 overflow-y-auto max-h-[calc(100vh-140px)] space-y-3">
          <div v-for="group in navGroups" :key="group.title" class="space-y-1">
            <div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-2 mb-1">
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
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 text-left cursor-pointer',
                  isActive
                    ? 'bg-[#F1F5F9] text-[#246BCE] font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium',
                ]"
              >
                <div class="flex items-center space-x-2.5 min-w-0">
                  <el-icon :size="15" :class="isActive ? 'text-[#246BCE]' : 'text-slate-400'">
                    <component :is="item.icon" />
                  </el-icon>
                  <span class="truncate">{{ item.label }}</span>
                </div>
                <span
                  v-if="item.badge && item.badge > 0"
                  class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D93025] text-white shrink-0"
                >
                  {{ item.badge }}
                </span>
              </button>
            </router-link>
          </div>
        </nav>
      </div>

      <!-- Bottom User Profile & Switcher -->
      <div class="p-3.5 border-t border-slate-100 bg-white">
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <div class="flex items-center space-x-2.5 overflow-hidden">
            <div class="w-8 h-8 rounded-full bg-[#246BCE]/10 flex items-center justify-center text-[#246BCE] font-bold text-xs shrink-0">
              {{ store.currentUser?.name?.slice(0, 1) || '张' }}
            </div>
            <div class="flex flex-col truncate">
              <span class="text-xs font-bold text-slate-800 truncate">{{ store.currentUser?.name }}</span>
              <span class="text-[10px] text-slate-400 truncate">{{ store.currentUser?.department || store.currentUser?.role }}</span>
            </div>
          </div>
          <el-tooltip content="退出登录" placement="top">
            <button
              @click="handleLogout"
              class="p-1.5 text-slate-400 hover:text-[#D93025] rounded-lg hover:bg-red-50 transition cursor-pointer"
            >
              <el-icon :size="14"><SwitchButton /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Header Toolbar -->
      <header class="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 z-20">
        <!-- Left: Page Title & Pilot Area Tag -->
        <div class="flex items-center space-x-4">
          <h1 class="text-base font-bold text-slate-900">{{ currentRouteTitle }}</h1>
          <div class="h-4 w-[1px] bg-slate-200"></div>
          <div class="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80 text-xs">
            <el-icon class="text-[#246BCE]"><Location /></el-icon>
            <span class="text-xs font-medium text-slate-700">{{ store.currentPilotArea }}</span>
            <span class="w-1.5 h-1.5 rounded-full bg-[#18A57A] animate-pulse ml-1"></span>
          </div>

          <!-- Date Range Picker -->
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

        <!-- Right: Notifications & Quick Switch -->
        <div class="flex items-center space-x-3">
          <div class="text-xs text-slate-400 hidden lg:block">数据更新: 2026-08-16 08:30</div>

          <!-- Notification Popover -->
          <el-popover placement="bottom-end" :width="340" trigger="click">
            <template #reference>
              <button class="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                <el-icon :size="18"><Bell /></el-icon>
                <span
                  v-if="unreadCount > 0"
                  class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D93025] ring-2 ring-white"
                />
              </button>
            </template>
            <div class="p-1">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span class="font-bold text-xs text-slate-800">系统通知与告警</span>
                <span class="text-[10px] text-[#246BCE] cursor-pointer" @click="markAllRead">全部标为已读</span>
              </div>
              <div class="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                <div
                  v-for="item in store.notifications"
                  :key="item.id"
                  class="p-2 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-blue-50/40 transition text-xs flex flex-col gap-1"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-slate-800">{{ item.title }}</span>
                    <span class="text-[10px] text-slate-400">{{ item.time }}</span>
                  </div>
                  <p class="text-slate-600 text-[11px] leading-relaxed">{{ item.message }}</p>
                </div>
              </div>
            </div>
          </el-popover>

          <!-- User Role Quick Selector for Demo -->
          <el-dropdown @command="switchUserRole">
            <button class="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 transition cursor-pointer border border-slate-200/80">
              <span class="text-slate-500">角色:</span>
              <span class="font-medium text-slate-800">{{ store.currentUser?.role }}</span>
              <el-icon :size="12" class="text-slate-400"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="admin">切换为: 管理人员 (张明远)</el-dropdown-item>
                <el-dropdown-item command="inspector1">切换为: 巡检班组 (李建军)</el-dropdown-item>
                <el-dropdown-item command="repair1">切换为: 维修班组 (王宏伟)</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Scrollable Main Router View -->
      <main class="flex-1 overflow-y-auto p-6 space-y-6">
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
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import {
  Odometer,
  MapLocation,
  Warning,
  UploadFilled,
  Promotion,
  Checked,
  Tools,
  Files,
  TrendCharts,
  Setting,
  Location,
  Bell,
  SwitchButton,
  ArrowDown,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const store = useAppStore();

const unreadCount = computed(() => store.notifications.filter((n) => !n.read).length);
const currentRouteTitle = computed(() => (route.meta.title as string) || '综合看板');

const navGroups = computed(() => [
  {
    title: '监测概览',
    items: [
      { path: '/dashboard', label: '综合看板', icon: Odometer },
      { path: '/gis-map', label: '一张图总览', icon: MapLocation },
    ],
  },
  {
    title: '核心业务',
    items: [
      { path: '/damages', label: '病害管理', icon: Warning, badge: store.metrics.highRiskDamages },
      { path: '/import', label: '数据导入', icon: UploadFilled },
      { path: '/tracks', label: '轨迹与事件', icon: Promotion },
      { path: '/inspections', label: '巡检任务', icon: Checked, badge: store.metrics.pendingInspections },
      { path: '/work-orders', label: '维修工单', icon: Tools, badge: store.metrics.pendingRepairWorkOrders },
    ],
  },
  {
    title: '空间与底座',
    items: [
      { path: '/spatial-assets', label: '空间图层', icon: Files },
    ],
  },
  {
    title: '统计与设置',
    items: [
      { path: '/reports', label: '报表中心', icon: TrendCharts },
      { path: '/settings', label: '系统设置', icon: Setting },
    ],
  },
]);

function markAllRead() {
  store.notifications.forEach((n) => (n.read = true));
  ElMessage.success('已全部标记为已读');
}

function switchUserRole(account: string) {
  store.login(account);
  ElMessage.success(`已切换为【${store.currentUser.role}】身份`);
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
