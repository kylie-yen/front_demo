import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import AppLayout from '../components/AppLayout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录 - 道路微病害主动养护平台', public: true },
  },
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { title: '综合看板', icon: 'Odometer' },
      },
      {
        path: 'gis-map',
        name: 'GisMasterMap',
        component: () => import('../views/GisMasterMapView.vue'),
        meta: { title: '一张图总览', icon: 'MapLocation' },
      },
      {
        path: 'damages',
        name: 'DamageList',
        component: () => import('../views/DamageListView.vue'),
        meta: { title: '病害列表', icon: 'Warning' },
      },
      {
        path: 'damages/:id',
        name: 'DamageDetail',
        component: () => import('../views/DamageDetailView.vue'),
        meta: { title: '病害详情', hidden: true },
      },
      {
        path: 'import',
        name: 'DataImport',
        component: () => import('../views/DataImportView.vue'),
        meta: { title: '骑行数据导入', icon: 'UploadFilled' },
      },
      {
        path: 'tracks',
        name: 'TrackDetail',
        component: () => import('../views/TrackDetailView.vue'),
        meta: { title: '轨迹与事件详情', icon: 'Promotion' },
      },
      {
        path: 'tracks/:id',
        name: 'TrackDetailWithId',
        component: () => import('../views/TrackDetailView.vue'),
        meta: { title: '轨迹回放与事件', hidden: true },
      },
      {
        path: 'inspections',
        name: 'InspectionCenter',
        component: () => import('../views/InspectionCenterView.vue'),
        meta: { title: '巡检任务中心', icon: 'Checked' },
      },
      {
        path: 'work-orders',
        name: 'WorkOrderCenter',
        component: () => import('../views/WorkOrderCenterView.vue'),
        meta: { title: '维修工单中心', icon: 'Tools' },
      },
      {
        path: 'spatial-assets',
        name: 'SpatialAssets',
        component: () => import('../views/SpatialAssetView.vue'),
        meta: { title: '空间图层管理', icon: 'Files' },
      },
      {
        path: 'reports',
        name: 'ReportCenter',
        component: () => import('../views/ReportCenterView.vue'),
        meta: { title: '报表中心', icon: 'TrendCharts' },
      },
      {
        path: 'settings',
        name: 'SystemSettings',
        component: () => import('../views/SystemSettingView.vue'),
        meta: { title: '系统设置', icon: 'Setting' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  document.title = (to.meta.title ? `${to.meta.title} - ` : '') + '非机动车道微病害主动养护平台';
  next();
});

export default router;
