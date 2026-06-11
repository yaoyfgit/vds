export type ActivityStatus = '筹备中' | '进行中' | '已结束';
export type TaskStatus = '待派发' | '待接收' | '已接收' | '执行中' | '已完成' | '已取消' | '已拒绝';
export type ResourceStatus = '可调配' | '已调度' | '执行中' | '不可用';
export type VehicleType = '轿车' | 'SUV' | '商务车' | '中巴' | '大巴';
export type LicenseType = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Activity {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  status: ActivityStatus;
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
  contactPhone?: string;
  availableRanges: { from: string; to: string }[];
  notes?: string;
  status: ResourceStatus;
  unavailableReason?: string;
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
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  status: ResourceStatus;
  unavailableReason?: string;
  expectedReturnDate?: string;
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
