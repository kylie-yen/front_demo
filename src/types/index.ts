export type RiskLevel = '高' | '中' | '低';

export type DamageStatus = '待确认' | '已确认' | '待维修' | '已维修' | '已销项';

export type DamageType = '坑洼' | '沉陷' | '凸起' | '修补破损' | '严重裂缝' | '连续颠簸路段';

export type FacilityType = '井盖' | '雨水篦子' | '减速带' | '道路接缝' | '路缘坡道';

export type RiskScenarioType = '学校出入口' | '地铁站出入口' | '公交站' | '道路交叉口' | '下坡路段' | '狭窄车道';

export type EventClass = '正常' | '疑似病害冲击' | '固定设施冲击' | '骑行动作';

export type InspectionStatus = '待巡检' | '巡检中' | '已完成' | '已取消';

export type InspectionResult = '确认病害' | '固定设施' | '误报' | '无法判断';

export type WorkOrderStatus = '待派工' | '已派工' | '处理中' | '待复核' | '已完成' | '已取消';

export type WorkOrderPriority = 'P1-紧急' | 'P2-优先' | 'P3-常规';

export interface RoadItem {
  id: string;
  name: string;
  direction: string; // '东向西' | '西向东' | '南向北' | '北向南' | '双向'
  length_m: number;
  start_node: string;
  end_node: string;
  surface: string; // '沥青' | '彩色透水沥青' | '透水砖' | '水泥混凝土'
  width_m: number;
  oneway: boolean;
  geometry: [number, number][]; // [lng, lat][]
  created_at: string;
}

export interface FacilityItem {
  id: string;
  type: FacilityType;
  road_id: string;
  road_name: string;
  offset_m: number; // 距道路起点里程
  distance_m: number; // 距路缘距离
  condition: '良好' | '轻微下沉' | '凸起松动' | '周边破损';
  source: '人工普查' | '航测导入' | '巡检登记';
  photo_url: string;
  geometry: [number, number]; // [lng, lat]
  created_at: string;
  updated_by: string;
}

export interface RiskScenarioItem {
  id: string;
  name: string;
  type: RiskScenarioType;
  buffer_m: number;
  risk_weight: number; // 10 - 40
  geometry: [number, number]; // [lng, lat]
  remark: string;
  created_at: string;
}

export interface SensorSampleItem {
  timestamp: string;
  longitude: number;
  latitude: number;
  speed_kmh: number;
  acc_x: number;
  acc_y: number;
  acc_z: number;
  heading: number;
  device_model: string;
}

export interface ImpactEventItem {
  id: string;
  track_id: string;
  road_id: string;
  road_name: string;
  direction: string;
  mileage_m: number;
  occurred_at: string;
  peak_acc: number; // 垂向峰值 m/s²
  rms: number; // 均方根值
  duration_ms: number;
  event_class: EventClass;
  probability: number; // 0 - 100
  geometry: [number, number]; // [lng, lat]
  rule_hit_desc: string;
  near_facility_id?: string;
  near_facility_name?: string;
}

export interface RideTrackItem {
  id: string;
  track_no: string;
  source_file: string;
  device_info: string;
  vehicle_info: string;
  weather: string;
  rider: string;
  distance_km: number;
  duration_min: number;
  event_count: number;
  damages_generated: number;
  started_at: string;
  ended_at: string;
  status: '已处理' | '处理中' | '解析失败';
  samples_count: number;
  coordinates: [number, number][]; // [lng, lat][]
  raw_samples?: SensorSampleItem[];
}

export interface RiskFactors {
  harm_score: number; // 危害程度 (0-100) 权重 0.30
  exposure_score: number; // 暴露程度 (0-100) 权重 0.20
  vulnerability_score: number; // 场景脆弱性 (0-100) 权重 0.20
  trend_score: number; // 变化趋势 (0-100) 权重 0.15
  consequence_score: number; // 后果严重性 (0-100) 权重 0.15
}

export interface ConfidenceFactors {
  sample_count: number;
  anomaly_ratio: number; // 百分比
  multi_device: boolean;
  multi_date: boolean;
  has_photo: boolean;
  inspection_verified: boolean;
}

export interface DamageItem {
  id: string; // e.g. DH-202608-001
  road_id: string;
  road_name: string;
  direction: string;
  mileage_m: number;
  type: DamageType;
  severity: '轻度' | '中度' | '重度';
  risk_score: number; // 0 - 100
  risk_level: RiskLevel;
  confidence: number; // 0 - 100
  status: DamageStatus;
  close_reason?: string;
  geometry: [number, number]; // [lng, lat]
  factors: RiskFactors;
  confidence_factors: ConfidenceFactors;
  linked_events_count: number;
  photos: string[];
  created_at: string;
  updated_at: string;
  inspection_id?: string;
  work_order_id?: string;
  near_scenario_name?: string;
  near_facility_name?: string;
}

export interface InspectionTaskItem {
  id: string; // e.g. XJ-202608-001
  damage_id: string;
  damage_code: string;
  road_name: string;
  location_desc: string;
  damage_type: DamageType;
  risk_level: RiskLevel;
  priority: '紧急' | '高' | '普通';
  assignee_id: string;
  assignee_name: string;
  deadline: string;
  status: InspectionStatus;
  created_at: string;
  completed_at?: string;
  result?: InspectionResult;
  verified_type?: DamageType;
  verified_severity?: '轻度' | '中度' | '重度';
  measured_size?: string;
  photos?: string[];
  remark?: string;
  suggestion?: string;
  geometry: [number, number];
}

export interface RepairRecord {
  method: string;
  before_photos: string[];
  after_photos: string[];
  completed_at: string;
  duration_hours: number;
  materials_used?: string;
  notes?: string;
  retest_vibration_rms?: number;
  retest_status: '已降至安全阈值' | '效果达标' | '暂未复测';
  review_result?: '通过' | '驳回';
  review_remark?: string;
  reviewer?: string;
  reviewed_at?: string;
}

export interface WorkOrderItem {
  id: string; // e.g. WX-202608-001
  damage_id: string;
  damage_code: string;
  road_name: string;
  location_desc: string;
  damage_type: DamageType;
  priority: WorkOrderPriority;
  risk_score: number;
  risk_level: RiskLevel;
  team_id: string;
  team_name: string;
  planned_date: string;
  deadline: string;
  estimated_hours: number;
  status: WorkOrderStatus;
  solution_plan: string;
  remark: string;
  repair_record?: RepairRecord;
  geometry: [number, number];
  created_at: string;
}

export interface UserItem {
  id: string;
  name: string;
  account: string;
  role: '管理人员' | '巡检班组' | '维修班组';
  department?: string;
  phone: string;
  status: '启用' | '禁用';
  avatar: string;
  created_at: string;
}

export interface SystemConfig {
  risk_weights: {
    harm: number; // 0.30
    exposure: number; // 0.20
    vulnerability: number; // 0.20
    trend: number; // 0.15
    consequence: number; // 0.15
  };
  risk_thresholds: {
    high: number; // 70
    medium: number; // 40
  };
  confidence_threshold: number; // 60
  facility_buffer_m: number; // 10m
  cluster_distance_m: number; // 5m
  shock_threshold_acc: number; // 14.5 m/s²
}

export interface AuditLogItem {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  module: string;
  target_id: string;
  details: string;
  timestamp: string;
  before_val?: string;
  after_val?: string;
}
