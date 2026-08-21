<template>
  <div class="app-shell">
    <button v-if="mobileNavOpen" class="nav-scrim" aria-label="关闭导航" @click="mobileNavOpen = false" />

    <aside class="app-sidebar" :class="{ 'is-open': mobileNavOpen }">
      <div class="brand-block">
        <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
        <div><strong>路安智养</strong><small>ROAD CARE WORKROOM</small></div>
      </div>

      <nav class="app-nav" aria-label="主导航">
        <section v-for="group in navGroups" :key="group.title" class="nav-section">
          <h2>{{ group.title }}</h2>
          <router-link v-for="item in group.items" :key="item.path" :to="item.path" v-slot="{ isActive, navigate }" custom>
            <button class="nav-item" :class="{ 'is-active': isActive }" @click="navigate(); mobileNavOpen = false">
              <span class="nav-icon"><el-icon :size="17"><component :is="item.icon" /></el-icon></span>
              <span>{{ item.label }}</span>
              <span v-if="item.badge && item.badge > 0" class="nav-badge">{{ item.badge }}</span>
            </button>
          </router-link>
        </section>
      </nav>

      <div class="sidebar-account">
        <div class="user-avatar">{{ store.currentUser?.name?.slice(0, 1) || '用' }}</div>
        <div class="user-meta"><strong>{{ store.currentUser?.name }}</strong><span>{{ store.currentUser?.department || store.currentUser?.role }}</span></div>
        <el-tooltip content="退出登录" placement="top">
          <button class="icon-button" aria-label="退出登录" @click="handleLogout"><el-icon><SwitchButton /></el-icon></button>
        </el-tooltip>
      </div>
    </aside>

    <section class="app-workspace">
      <header class="app-topbar">
        <div class="topbar-context">
          <button class="icon-button menu-button" aria-label="打开导航" @click="mobileNavOpen = true"><el-icon><Menu /></el-icon></button>
          <div><span class="context-label">闵行区道路主动养护中心</span><strong>{{ currentRouteTitle }}</strong></div>
        </div>
        <div class="topbar-tools">
          <div class="pilot-chip"><span class="live-dot"></span><span>{{ store.currentPilotArea }}</span></div>
          <el-date-picker v-model="store.dateRange" type="daterange" range-separator="—" start-placeholder="开始日期" end-placeholder="结束日期" size="small" value-format="YYYY-MM-DD" class="date-range" />
          <el-popover placement="bottom-end" :width="360" trigger="click">
            <template #reference>
              <button class="icon-button notification-button" aria-label="系统通知"><el-icon :size="18"><Bell /></el-icon><span v-if="unreadCount > 0" class="notification-dot" /></button>
            </template>
            <div class="notification-panel">
              <div class="notification-header"><div><strong>通知中心</strong><span>{{ unreadCount }} 条未读</span></div><button @click="markAllRead">全部已读</button></div>
              <div class="notification-list">
                <article v-for="item in store.notifications" :key="item.id" :class="{ 'is-read': item.read }">
                  <span class="activity-mark"></span><div><strong>{{ item.title }}</strong><p>{{ item.message }}</p><time>{{ item.time }}</time></div>
                </article>
              </div>
            </div>
          </el-popover>
          <el-dropdown @command="switchUserRole">
            <button class="role-switcher"><span class="role-avatar">{{ store.currentUser?.name?.slice(0, 1) }}</span><span>{{ store.currentUser?.role }}</span><el-icon :size="12"><ArrowDown /></el-icon></button>
            <template #dropdown><el-dropdown-menu><el-dropdown-item command="admin">管理人员 · 张明远</el-dropdown-item><el-dropdown-item command="inspector1">巡检班组 · 李建国</el-dropdown-item><el-dropdown-item command="repair1">维修班组 · 王宏伟</el-dropdown-item></el-dropdown-menu></template>
          </el-dropdown>
        </div>
      </header>

      <main class="page-stage">
        <router-view v-slot="{ Component }"><transition name="page-fade" mode="out-in"><component :is="Component" /></transition></router-view>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowDown, Bell, Checked, Files, MapLocation, Menu, Odometer, Promotion, Setting, SwitchButton, Tools, TrendCharts, UploadFilled, Warning } from '@element-plus/icons-vue';
import { useAppStore } from '../stores/appStore';

const router = useRouter();
const route = useRoute();
const store = useAppStore();
const mobileNavOpen = ref(false);
const unreadCount = computed(() => store.notifications.filter((item) => !item.read).length);
const currentRouteTitle = computed(() => (route.meta.title as string) || '综合看板');
const navGroups = computed(() => [
  { title: '工作台', items: [{ path: '/dashboard', label: '综合看板', icon: Odometer }, { path: '/gis-map', label: 'GIS 一张图', icon: MapLocation }] },
  { title: '养护业务', items: [{ path: '/damages', label: '病害台账', icon: Warning, badge: store.metrics.highRiskDamages }, { path: '/import', label: '感知数据导入', icon: UploadFilled }, { path: '/tracks', label: '骑行轨迹回放', icon: Promotion }, { path: '/inspections', label: '巡检核验', icon: Checked, badge: store.metrics.pendingInspections }, { path: '/work-orders', label: '维修工单', icon: Tools, badge: store.metrics.pendingRepairWorkOrders }] },
  { title: '分析与配置', items: [{ path: '/spatial-assets', label: '空间资产', icon: Files }, { path: '/reports', label: '统计报表', icon: TrendCharts }, { path: '/settings', label: '系统设置', icon: Setting }] },
]);

function markAllRead() { store.notifications.forEach((item) => (item.read = true)); ElMessage.success('通知已全部标记为已读'); }
function switchUserRole(account: string) { store.login(account); ElMessage.success(`已切换至${store.currentUser.role}`); }
function handleLogout() { store.logout(); router.push('/login'); }
</script>

<style scoped>
.page-fade-enter-active, .page-fade-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.page-fade-enter-from { opacity: 0; transform: translateY(4px); }
.page-fade-leave-to { opacity: 0; }
</style>
