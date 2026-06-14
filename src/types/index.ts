export type ActivityPeriod = '筹备期' | '执行期' | '结束期';
export type ActivityStatus = '筹备中' | '进行中' | '已结束';
export type TaskStatus = '待派发' | '待接收' | '已接收' | '执行中' | '已完成' | '已取消' | '已拒绝';
export type ResourceStatus = '可调配' | '已调度' | '执行中' | '不可用';
export type AuditStatus = '待审核' | '审核通过' | '审核不通过';
export type VehicleType = '轿车' | 'SUV' | '商务车' | '中巴' | '大巴';
export type LicenseType = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'C1' | 'C2';
export type SupplierType = '租车公司' | '客运公司' | '个人车主' | '其他';
export type SupplierStatus = '合作中' | '暂停合作' | '已终止';

export interface AuditRecord {
  id: string;
  resourceType: 'vehicle' | 'driver';
  resourceId: string;
  resourceName: string;
  supplier: string;
  activityId?: string;
  activityName?: string;
  submitTime: string;
  auditResult: '通过' | '驳回';
  auditRemark?: string;
  auditor: string;
  auditTime: string;
}

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  creditCode?: string;
  contactName: string;
  contactPhone: string;
  backupPhone?: string;
  address?: string;
  contractStartDate: string;
  contractEndDate?: string;
  status: SupplierStatus;
  contractNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  status: ActivityStatus;
  period: ActivityPeriod;
  managers: string[];
  vehicleIds: string[];
  driverIds: string[];
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: VehicleType;
  brand: string;
  capacity: number;
  color?: string;
  licenseRequired: LicenseType;
  supplier: string;
  supplierId: string;
  contactPhone?: string;
  availableRanges: { from: string; to: string }[];
  notes?: string;
  status: ResourceStatus;
  auditStatus: AuditStatus;
  auditRemark?: string;
  unavailableReason?: string;
  activityId?: string;
  auditMaterials: {
    vehiclePhotos: string[];
    inspectionCert: string[];
    insurance: string[];
    other: string[];
  };
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  idCardNumber?: string;
  licenseType: LicenseType;
  licenseExpiry?: string;
  availableRanges: { from: string; to: string }[];
  supplier: string;
  supplierId: string;
  activityId?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  status: ResourceStatus;
  auditStatus: AuditStatus;
  auditRemark?: string;
  unavailableReason?: string;
  expectedReturnDate?: string;
  auditMaterials: {
    licenseFront: string[];
    licenseBack: string[];
    other: string[];
  };
}

export interface Task {
  id: string;
  activityId: string;
  name: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  from: string;
  to: string;
  passenger?: string;
  passengerPhone?: string;
  passengerCount?: number;
  description?: string;
  vehicleId?: string;
  driverId?: string;
  fieldDispatcher?: string;
  status: TaskStatus;
  rejectReason?: string;
  cancelReason?: string;
  remark?: string;
  history?: {
    status: TaskStatus;
    time: string;
    operator?: string;
    remark?: string;
  }[];
}
