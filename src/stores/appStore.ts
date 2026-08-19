import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  RoadItem,
  FacilityItem,
  RiskScenarioItem,
  DamageItem,
  RideTrackItem,
  ImpactEventItem,
  InspectionTaskItem,
  WorkOrderItem,
  UserItem,
  SystemConfig,
  AuditLogItem,
  DamageStatus,
  RiskLevel,
  DamageType,
  FacilityType,
  RiskScenarioType,
  WorkOrderPriority,
  InspectionResult,
} from '../types';
import {
  initialConfig,
  initialUsers,
  initialRoads,
  initialFacilities,
  initialRiskScenarios,
  initialDamages,
  initialImpactEvents,
  initialRideTracks,
  initialInspectionTasks,
  initialWorkOrders,
  initialAuditLogs,
} from '../mock/seedData';
import dayjs from 'dayjs';

export const useAppStore = defineStore('app', () => {
  // Current logged in user
  const currentUser = ref<UserItem>(initialUsers[0]);
  const isAuthenticated = ref<boolean>(true);

  // Global pilot filter & date range
  const currentPilotArea = ref<string>('闵行区·永德路地铁站周边试点区');
  const dateRange = ref<[string, string]>([
    dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);

  // Datasets
  const config = ref<SystemConfig>(JSON.parse(JSON.stringify(initialConfig)));
  const users = ref<UserItem[]>(JSON.parse(JSON.stringify(initialUsers)));
  const roads = ref<RoadItem[]>(JSON.parse(JSON.stringify(initialRoads)));
  const facilities = ref<FacilityItem[]>(JSON.parse(JSON.stringify(initialFacilities)));
  const riskScenarios = ref<RiskScenarioItem[]>(JSON.parse(JSON.stringify(initialRiskScenarios)));
  const damages = ref<DamageItem[]>(JSON.parse(JSON.stringify(initialDamages)));
  const impactEvents = ref<ImpactEventItem[]>(JSON.parse(JSON.stringify(initialImpactEvents)));
  const rideTracks = ref<RideTrackItem[]>(JSON.parse(JSON.stringify(initialRideTracks)));
  const inspectionTasks = ref<InspectionTaskItem[]>(JSON.parse(JSON.stringify(initialInspectionTasks)));
  const workOrders = ref<WorkOrderItem[]>(JSON.parse(JSON.stringify(initialWorkOrders)));
  const auditLogs = ref<AuditLogItem[]>(JSON.parse(JSON.stringify(initialAuditLogs)));

  // Notifications
  const notifications = ref([
    {
      id: 'N-01',
      title: '高风险微病害告警',
      message: '永德路460m处 (DH-202608-001) 风险分 88，邻近地铁1号口，建议优先派工。',
      time: '10分钟前',
      type: 'warning',
      read: false,
    },
    {
      id: 'N-02',
      title: '工单完工待复核',
      message: '市政特快修二组已提交永德路820m处修补完工记录 (WX-202608-003)，待复核销项。',
      time: '1小时前',
      type: 'info',
      read: false,
    },
    {
      id: 'N-03',
      title: '骑行数据自动解析完成',
      message: '众包轨迹 ride_yongde_am_0815.csv 已自动提取 5 个冲击事件。',
      time: '2小时前',
      type: 'success',
      read: true,
    },
  ]);

  // Auth actions
  function login(account: string, role?: string) {
    const found = users.value.find((u) => u.account === account) || users.value[0];
    currentUser.value = { ...found, role: (role as any) || found.role };
    isAuthenticated.value = true;
    addAuditLog('用户登录', '安全认证', currentUser.value.id, `用户 ${currentUser.value.name} 登录系统`);
  }

  function logout() {
    addAuditLog('用户登出', '安全认证', currentUser.value.id, `用户 ${currentUser.value.name} 退出登录`);
    isAuthenticated.value = false;
  }

  // Audit log helper
  function addAuditLog(
    action: string,
    module: string,
    targetId: string,
    details: string,
    beforeVal?: string,
    afterVal?: string
  ) {
    const newLog: AuditLogItem = {
      id: `LOG-${Date.now()}`,
      user_name: currentUser.value ? currentUser.value.name.split(' ')[0] : '系统',
      user_role: currentUser.value ? currentUser.value.role : '系统',
      action,
      module,
      target_id: targetId,
      details,
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      before_val: beforeVal,
      after_val: afterVal,
    };
    auditLogs.value.unshift(newLog);
  }

  // Compute Risk Score based on configured formula
  function calculateRiskScore(factors: DamageItem['factors']): { score: number; level: RiskLevel } {
    const w = config.value.risk_weights;
    const score = Math.round(
      factors.harm_score * w.harm +
        factors.exposure_score * w.exposure +
        factors.vulnerability_score * w.vulnerability +
        factors.trend_score * w.trend +
        factors.consequence_score * w.consequence
    );
    let level: RiskLevel = '低';
    if (score >= config.value.risk_thresholds.high) {
      level = '高';
    } else if (score >= config.value.risk_thresholds.medium) {
      level = '中';
    }
    return { score, level };
  }

  // Damage Actions
  function updateDamage(updated: Partial<DamageItem> & { id: string }) {
    const index = damages.value.findIndex((d) => d.id === updated.id);
    if (index !== -1) {
      const beforeStatus = damages.value[index].status;
      if (updated.factors) {
        const { score, level } = calculateRiskScore(updated.factors);
        updated.risk_score = score;
        updated.risk_level = level;
      }
      damages.value[index] = {
        ...damages.value[index],
        ...updated,
        updated_at: dayjs().format('YYYY-MM-DD HH:mm'),
      };
      addAuditLog(
        '更新病害信息',
        '病害管理',
        updated.id,
        `更新病害 ${updated.id} 属性，状态: ${damages.value[index].status}`,
        beforeStatus,
        damages.value[index].status
      );
    }
  }

  function createManualDamage(params: {
    road_id: string;
    type: DamageType;
    severity: '轻度' | '中度' | '重度';
    mileage_m: number;
    geometry: [number, number];
    photos: string[];
    factors: DamageItem['factors'];
  }) {
    const road = roads.value.find((r) => r.id === params.road_id) || roads.value[0];
    const { score, level } = calculateRiskScore(params.factors);
    const newId = `DH-${dayjs().format('YYYYMM')}-${String(damages.value.length + 1).padStart(3, '0')}`;
    const newDamage: DamageItem = {
      id: newId,
      road_id: road.id,
      road_name: road.name,
      direction: road.direction,
      mileage_m: params.mileage_m,
      type: params.type,
      severity: params.severity,
      risk_score: score,
      risk_level: level,
      confidence: 85,
      status: '待确认',
      geometry: params.geometry,
      factors: params.factors,
      confidence_factors: {
        sample_count: 1,
        anomaly_ratio: 100,
        multi_device: false,
        multi_date: false,
        has_photo: params.photos.length > 0,
        inspection_verified: false,
      },
      linked_events_count: 1,
      photos: params.photos.length ? params.photos : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'],
      created_at: dayjs().format('YYYY-MM-DD HH:mm'),
      updated_at: dayjs().format('YYYY-MM-DD HH:mm'),
    };
    damages.value.unshift(newDamage);
    addAuditLog('人工新增病害点', '病害管理', newId, `在道路 ${road.name} ${params.mileage_m}m 处手动登记病害点`);
    return newDamage;
  }

  function closeDamage(id: string, reason: string) {
    const damage = damages.value.find((d) => d.id === id);
    if (damage) {
      const beforeStatus = damage.status;
      damage.status = '已销项';
      damage.close_reason = reason;
      damage.updated_at = dayjs().format('YYYY-MM-DD HH:mm');
      addAuditLog('病害销项归档', '病害管理', id, `病害 ${id} 状态变更为【已销项】，销项原因: ${reason}`, beforeStatus, '已销项');
    }
  }

  // Inspection Task Actions
  function createInspectionTask(params: {
    damage_id: string;
    priority?: '紧急' | '高' | '普通';
    assignee_id?: string;
    assignee_name?: string;
    deadline?: string;
  }) {
    const damage = damages.value.find((d) => d.id === params.damage_id);
    if (!damage) return null;

    const taskId = `XJ-${dayjs().format('YYYYMM')}-${String(inspectionTasks.value.length + 1).padStart(3, '0')}`;
    const newTask: InspectionTaskItem = {
      id: taskId,
      damage_id: damage.id,
      damage_code: damage.id,
      road_name: damage.road_name,
      location_desc: `${damage.road_name} ${damage.mileage_m}m 处`,
      damage_type: damage.type,
      risk_level: damage.risk_level,
      priority: params.priority || (damage.risk_level === '高' ? '紧急' : '高'),
      assignee_id: params.assignee_id || 'U-002',
      assignee_name: params.assignee_name || '李建军 (巡检一班)',
      deadline: params.deadline || dayjs().add(2, 'day').format('YYYY-MM-DD 18:00'),
      status: '待巡检',
      created_at: dayjs().format('YYYY-MM-DD HH:mm'),
      geometry: damage.geometry,
    };
    inspectionTasks.value.unshift(newTask);
    damage.inspection_id = taskId;
    damage.updated_at = dayjs().format('YYYY-MM-DD HH:mm');
    addAuditLog('创建巡检任务', '巡检任务', taskId, `为病害 ${damage.id} 派发巡检任务 ${taskId}，指派给 ${newTask.assignee_name}`);
    return newTask;
  }

  function submitInspectionResult(
    taskId: string,
    data: {
      result: InspectionResult;
      verified_type?: DamageType;
      verified_severity?: '轻度' | '中度' | '重度';
      measured_size?: string;
      photos?: string[];
      remark?: string;
      suggestion?: string;
    }
  ) {
    const task = inspectionTasks.value.find((t) => t.id === taskId);
    if (!task) return;

    task.status = '已完成';
    task.completed_at = dayjs().format('YYYY-MM-DD HH:mm');
    task.result = data.result;
    task.verified_type = data.verified_type || task.damage_type;
    task.verified_severity = data.verified_severity || '中度';
    task.measured_size = data.measured_size || '现场测量标准尺寸';
    task.photos = data.photos || task.photos || ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'];
    task.remark = data.remark || '巡检员核验完毕';
    task.suggestion = data.suggestion || '';

    // Synchronize to linked damage
    const damage = damages.value.find((d) => d.id === task.damage_id);
    if (damage) {
      damage.confidence = Math.min(100, damage.confidence + 20);
      damage.confidence_factors.inspection_verified = true;
      if (data.photos && data.photos.length) {
        damage.photos = [...new Set([...damage.photos, ...data.photos])];
        damage.confidence_factors.has_photo = true;
      }
      if (data.result === '确认病害') {
        damage.status = '已确认';
        if (data.verified_type) damage.type = data.verified_type;
        if (data.verified_severity) damage.severity = data.verified_severity;
      } else if (data.result === '固定设施' || data.result === '误报') {
        damage.status = '已销项';
        damage.close_reason = `巡检判定为【${data.result}】：${data.remark || ''}`;
      }
      damage.updated_at = dayjs().format('YYYY-MM-DD HH:mm');
    }

    addAuditLog(
      '提交巡检结果',
      '巡检任务',
      taskId,
      `完成任务 ${taskId} 核验，结论: 【${data.result}】，病害更新为: ${damage?.status || '已同步'}`
    );
  }

  // Work Order Actions
  function createWorkOrder(params: {
    damage_id: string;
    priority?: WorkOrderPriority;
    team_name?: string;
    planned_date?: string;
    deadline?: string;
    estimated_hours?: number;
    solution_plan?: string;
    remark?: string;
  }) {
    const damage = damages.value.find((d) => d.id === params.damage_id);
    if (!damage) return null;

    // Check if active work order exists
    if (damage.work_order_id) {
      const existing = workOrders.value.find((w) => w.id === damage.work_order_id && w.status !== '已完成' && w.status !== '已取消');
      if (existing) {
        return existing;
      }
    }

    const orderId = `WX-${dayjs().format('YYYYMM')}-${String(workOrders.value.length + 1).padStart(3, '0')}`;
    const newOrder: WorkOrderItem = {
      id: orderId,
      damage_id: damage.id,
      damage_code: damage.id,
      road_name: damage.road_name,
      location_desc: `${damage.road_name} ${damage.mileage_m}m 处`,
      damage_type: damage.type,
      priority: params.priority || (damage.risk_score >= 70 ? 'P1-紧急' : 'P2-优先'),
      risk_score: damage.risk_score,
      risk_level: damage.risk_level,
      team_id: 'U-003',
      team_name: params.team_name || '市政特快修二组 (王宏伟)',
      planned_date: params.planned_date || dayjs().format('YYYY-MM-DD'),
      deadline: params.deadline || dayjs().add(1, 'day').format('YYYY-MM-DD 18:00'),
      estimated_hours: params.estimated_hours || 2.5,
      status: '待派工',
      solution_plan: params.solution_plan || `针对${damage.type}微病害进行针对性修补并夯实平整`,
      remark: params.remark || '请严格遵守非机动车道施工安全规程',
      geometry: damage.geometry,
      created_at: dayjs().format('YYYY-MM-DD HH:mm'),
    };

    workOrders.value.unshift(newOrder);
    damage.work_order_id = orderId;
    damage.status = '待维修';
    damage.updated_at = dayjs().format('YYYY-MM-DD HH:mm');

    addAuditLog('创建维修工单', '维修工单', orderId, `从病害 ${damage.id} 创建维修工单 ${orderId}，当前状态【待维修】`);
    return newOrder;
  }

  function updateWorkOrderStatus(orderId: string, status: WorkOrderItem['status']) {
    const order = workOrders.value.find((w) => w.id === orderId);
    if (order) {
      const before = order.status;
      order.status = status;
      addAuditLog('更新工单状态', '维修工单', orderId, `工单 ${orderId} 状态由【${before}】更新为【${status}】`, before, status);
    }
  }

  function submitWorkOrderCompletion(
    orderId: string,
    data: {
      method: string;
      before_photos: string[];
      after_photos: string[];
      duration_hours: number;
      materials_used?: string;
      notes?: string;
      retest_vibration_rms?: number;
      retest_status?: '已降至安全阈值' | '效果达标' | '暂未复测';
    }
  ) {
    const order = workOrders.value.find((w) => w.id === orderId);
    if (!order) return;

    order.status = '待复核';
    order.repair_record = {
      method: data.method,
      before_photos: data.before_photos.length ? data.before_photos : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'],
      after_photos: data.after_photos.length ? data.after_photos : ['https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=600&auto=format&fit=crop&q=80'],
      completed_at: dayjs().format('YYYY-MM-DD HH:mm'),
      duration_hours: data.duration_hours || 2.0,
      materials_used: data.materials_used,
      notes: data.notes,
      retest_vibration_rms: data.retest_vibration_rms ?? 0.42,
      retest_status: data.retest_status || '已降至安全阈值',
    };

    // Update damage state to 已维修
    const damage = damages.value.find((d) => d.id === order.damage_id);
    if (damage) {
      damage.status = '已维修';
      damage.updated_at = dayjs().format('YYYY-MM-DD HH:mm');
    }

    addAuditLog('提交完工申请', '维修工单', orderId, `工单 ${orderId} 完工并上传修补后证据，病害状态同步为【已维修】，等待管理复核`);
  }

  function reviewWorkOrder(orderId: string, approved: boolean, remark: string) {
    const order = workOrders.value.find((w) => w.id === orderId);
    if (!order || !order.repair_record) return;

    order.repair_record.review_result = approved ? '通过' : '驳回';
    order.repair_record.review_remark = remark;
    order.repair_record.reviewer = currentUser.value.name;
    order.repair_record.reviewed_at = dayjs().format('YYYY-MM-DD HH:mm');

    const damage = damages.value.find((d) => d.id === order.damage_id);

    if (approved) {
      order.status = '已完成';
      if (damage) {
        damage.status = '已销项';
        damage.close_reason = `维修复核通过已销项：${remark}`;
        damage.updated_at = dayjs().format('YYYY-MM-DD HH:mm');
      }
      addAuditLog('工单复核通过并销项', '维修工单', orderId, `工单 ${orderId} 复核通过，关联病害 ${damage?.id} 成功闭环销项`);
    } else {
      order.status = '处理中'; // Retried
      if (damage) {
        damage.status = '待维修';
        damage.updated_at = dayjs().format('YYYY-MM-DD HH:mm');
      }
      addAuditLog('工单复核驳回', '维修工单', orderId, `工单 ${orderId} 复核驳回，原因: ${remark}，退回【待维修】重新处理`);
    }
  }

  // Facility Actions
  function addFacility(facility: Omit<FacilityItem, 'id' | 'created_at' | 'updated_by'>) {
    const newId = `FAC-${String(facilities.value.length + 1).padStart(3, '0')}`;
    const newFac: FacilityItem = {
      ...facility,
      id: newId,
      created_at: dayjs().format('YYYY-MM-DD'),
      updated_by: currentUser.value.name.split(' ')[0],
    };
    facilities.value.push(newFac);
    addAuditLog('新增固定设施', '空间资产', newId, `在道路 ${facility.road_name} 新增固定设施 【${facility.type}】`);
    return newFac;
  }

  function updateFacility(facility: FacilityItem) {
    const idx = facilities.value.findIndex((f) => f.id === facility.id);
    if (idx !== -1) {
      facilities.value[idx] = { ...facility, updated_by: currentUser.value.name.split(' ')[0] };
      addAuditLog('编辑固定设施', '空间资产', facility.id, `更新固定设施 ${facility.id} (${facility.type}) 属性`);
    }
  }

  function deleteFacility(id: string) {
    const idx = facilities.value.findIndex((f) => f.id === id);
    if (idx !== -1) {
      const removed = facilities.value.splice(idx, 1)[0];
      addAuditLog('删除固定设施', '空间资产', id, `删除固定设施 ${id} (${removed.type})`);
    }
  }

  // Risk Scenario Actions
  function addRiskScenario(scenario: Omit<RiskScenarioItem, 'id' | 'created_at'>) {
    const newId = `RS-${String(riskScenarios.value.length + 1).padStart(3, '0')}`;
    const newSc: RiskScenarioItem = {
      ...scenario,
      id: newId,
      created_at: dayjs().format('YYYY-MM-DD'),
    };
    riskScenarios.value.push(newSc);
    addAuditLog('新增风险场景', '空间资产', newId, `新增风险场景 【${scenario.name}】(${scenario.type})，权重 +${scenario.risk_weight}`);
    return newSc;
  }

  function updateRiskScenario(scenario: RiskScenarioItem) {
    const idx = riskScenarios.value.findIndex((s) => s.id === scenario.id);
    if (idx !== -1) {
      riskScenarios.value[idx] = { ...scenario };
      addAuditLog('编辑风险场景', '空间资产', scenario.id, `更新风险场景 ${scenario.name} (权重 ${scenario.risk_weight})`);
    }
  }

  function deleteRiskScenario(id: string) {
    const idx = riskScenarios.value.findIndex((s) => s.id === id);
    if (idx !== -1) {
      const removed = riskScenarios.value.splice(idx, 1)[0];
      addAuditLog('删除风险场景', '空间资产', id, `删除风险场景 ${removed.name}`);
    }
  }

  // Import New Track
  function importTrackRecord(track: RideTrackItem, newEvents: ImpactEventItem[], newDamages: DamageItem[]) {
    rideTracks.value.unshift(track);
    impactEvents.value.unshift(...newEvents);
    damages.value.unshift(...newDamages);
    addAuditLog(
      '导入骑行传感器数据',
      '感知导入',
      track.track_no,
      `成功解析文件 ${track.source_file}，识别 ${newEvents.length} 个候选冲击事件，生成/更新 ${newDamages.length} 个病害点`
    );
  }

  // Config Actions
  function updateConfig(newConfig: Partial<SystemConfig>) {
    config.value = { ...config.value, ...newConfig };
    // Recalculate all damage risk scores
    damages.value.forEach((d) => {
      const { score, level } = calculateRiskScore(d.factors);
      d.risk_score = score;
      d.risk_level = level;
    });
    addAuditLog('更新系统权重与阈值', '系统设置', 'SYS-CFG', '更新了病害风险五维度权重及高/中风险分界阈值');
  }

  // Aggregated Metrics for Dashboard
  const metrics = computed(() => {
    const totalMileageKm = roads.value.reduce((acc, r) => acc + r.length_m, 0) / 1000;
    const trackCount = rideTracks.value.length;
    const pendingConfirmCount = damages.value.filter((d) => d.status === '待确认').length;
    const pendingRepairWorkOrders = workOrders.value.filter((w) => w.status === '待派工' || w.status === '已派工' || w.status === '处理中').length;
    const highRiskDamages = damages.value.filter((d) => d.risk_level === '高' && d.status !== '已销项').length;
    const closedDamages = damages.value.filter((d) => d.status === '已销项').length;

    const pendingInspections = inspectionTasks.value.filter((t) => t.status === '待巡检' || t.status === '巡检中').length;
    const pendingReviews = workOrders.value.filter((w) => w.status === '待复核').length;

    // Status distribution
    const statusDist = {
      待确认: damages.value.filter((d) => d.status === '待确认').length,
      已确认: damages.value.filter((d) => d.status === '已确认').length,
      待维修: damages.value.filter((d) => d.status === '待维修').length,
      已维修: damages.value.filter((d) => d.status === '已维修').length,
      已销项: damages.value.filter((d) => d.status === '已销项').length,
    };

    // Risk level distribution
    const riskDist = {
      高风险: damages.value.filter((d) => d.risk_level === '高' && d.status !== '已销项').length,
      中风险: damages.value.filter((d) => d.risk_level === '中' && d.status !== '已销项').length,
      低风险: damages.value.filter((d) => d.risk_level === '低' && d.status !== '已销项').length,
    };

    // Type distribution
    const typeMap: Record<string, number> = {};
    damages.value.forEach((d) => {
      typeMap[d.type] = (typeMap[d.type] || 0) + 1;
    });

    // Top 10 High Risk Pending Damages
    const topHighRisk = damages.value
      .filter((d) => d.status !== '已销项')
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 10);

    return {
      totalMileageKm: totalMileageKm.toFixed(2),
      trackCount,
      pendingConfirmCount,
      pendingRepairWorkOrders,
      highRiskDamages,
      closedDamages,
      pendingInspections,
      pendingReviews,
      statusDist,
      riskDist,
      typeMap,
      topHighRisk,
    };
  });

  return {
    currentUser,
    isAuthenticated,
    currentPilotArea,
    dateRange,
    config,
    users,
    roads,
    facilities,
    riskScenarios,
    damages,
    impactEvents,
    rideTracks,
    inspectionTasks,
    workOrders,
    auditLogs,
    notifications,
    metrics,
    login,
    logout,
    addAuditLog,
    calculateRiskScore,
    updateDamage,
    createManualDamage,
    closeDamage,
    createInspectionTask,
    submitInspectionResult,
    createWorkOrder,
    updateWorkOrderStatus,
    submitWorkOrderCompletion,
    reviewWorkOrder,
    addFacility,
    updateFacility,
    deleteFacility,
    addRiskScenario,
    updateRiskScenario,
    deleteRiskScenario,
    importTrackRecord,
    updateConfig,
  };
});
