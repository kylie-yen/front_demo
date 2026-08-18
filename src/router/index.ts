import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import AppLayout from '../components/AppLayout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录', public: true },
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
        meta: { title: '地图看板', icon: 'MapLocation' },
      },
      {
        path: 'damages',
        name: 'DamageList',
        component: () => import('../views/DamageListView.vue'),
        meta: { title: '病害台账', icon: 'Warning' },
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
        meta: { title: '数据导入', icon: 'UploadFilled' },
      },
      {
        path: 'tracks',
        name: 'TrackDetail',
        component: () => import('../views/TrackDetailView.vue'),
        meta: { title: '轨迹回放', icon: 'Promotion' },
      },
      {
        path: 'tracks/:id',
        name: 'TrackDetailWithId',
        component: () => import('../views/TrackDetailView.vue'),
        meta: { title: '轨迹详情', hidden: true },
      },
      {
        path: 'inspections',
        name: 'InspectionCenter',
        component: () => import('../views/InspectionCenterView.vue'),
        meta: { title: '巡检核验', icon: 'Checked' },
      },
      {
        path: 'work-orders',
        name: 'WorkOrderCenter',
        component: () => import('../views/WorkOrderCenterView.vue'),
        meta: { title: '维修工单', icon: 'Tools' },
      },
      {
        path: 'spatial-assets',
        name: 'SpatialAssets',
        component: () => import('../views/SpatialAssetView.vue'),
        meta: { title: '空间资产', icon: 'Files' },
      },
      {
        path: 'reports',
        name: 'ReportCenter',
        component: () => import('../views/ReportCenterView.vue'),
        meta: { title: '统计报表', icon: 'TrendCharts' },
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
  document.title = (to.meta.title ? `${to.meta.title} - ` : '') + '道路微病害主动养护平台';
  next();
});

export default router;
