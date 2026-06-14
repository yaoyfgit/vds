import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Activity, Vehicle, Driver, Task, TaskStatus, Supplier, AuditRecord } from '../types';
import { activities, vehicles, drivers, tasks, suppliers, auditRecords } from '../data/mockData';

interface AppState {
  activities: Activity[];
  vehicles: Vehicle[];
  drivers: Driver[];
  tasks: Task[];
  suppliers: Supplier[];
  auditRecords: AuditRecord[];
  activeModal: string | null;
  modalData: any;
}

const initialState: AppState = {
  activities: activities,
  vehicles: vehicles,
  drivers: drivers,
  tasks: tasks,
  suppliers: suppliers,
  auditRecords: auditRecords,
  activeModal: null,
  modalData: null,
};

type Action =
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'UPDATE_ACTIVITY'; payload: { id: string; data: Partial<Activity> } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; data: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: { id: string } }
  | { type: 'SET_TASK_STATUS'; payload: { id: string; status: TaskStatus; reason?: string; operator?: string } }
  | { type: 'ASSIGN_RESOURCE_TO_TASK'; payload: { taskId: string; vehicleId?: string; driverId?: string } }
  | { type: 'REASSIGN_TASK'; payload: { taskId: string; vehicleId?: string; driverId?: string; remark?: string } }
  | { type: 'CANCEL_TASK'; payload: { id: string; reason: string } }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'UPDATE_VEHICLE'; payload: { id: string; data: Partial<Vehicle> } }
  | { type: 'DELETE_VEHICLE'; payload: { id: string } }
  | { type: 'SET_VEHICLE_UNAVAILABLE'; payload: { id: string; reason: string } }
  | { type: 'SET_VEHICLE_AVAILABLE'; payload: { id: string } }
  | { type: 'ADD_DRIVER'; payload: Driver }
  | { type: 'UPDATE_DRIVER'; payload: { id: string; data: Partial<Driver> } }
  | { type: 'DELETE_DRIVER'; payload: { id: string } }
  | { type: 'SET_DRIVER_UNAVAILABLE'; payload: { id: string; reason: string; expectedReturnDate?: string } }
  | { type: 'SET_DRIVER_AVAILABLE'; payload: { id: string } }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: { id: string; data: Partial<Supplier> } }
  | { type: 'ASSIGN_VEHICLE_TO_ACTIVITY'; payload: { activityId: string; vehicleId: string } }
  | { type: 'ASSIGN_DRIVER_TO_ACTIVITY'; payload: { activityId: string; driverId: string } }
  | { type: 'REMOVE_VEHICLE_FROM_ACTIVITY'; payload: { activityId: string; vehicleId: string } }
  | { type: 'REMOVE_DRIVER_FROM_ACTIVITY'; payload: { activityId: string; driverId: string } }
  | { type: 'ADD_AUDIT_RECORD'; payload: AuditRecord }
  | { type: 'OPEN_MODAL'; payload: { type: string; data?: any } }
  | { type: 'CLOSE_MODAL' };

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_ACTIVITY':
      return { ...state, activities: [...state.activities, action.payload] };
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(act =>
          act.id === action.payload.id ? { ...act, ...action.payload.data } : act
        ),
      };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload.data } : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload.id)
      };
    case 'SET_TASK_STATUS':
      const taskToUpdate = state.tasks.find(t => t.id === action.payload.id);
      if (!taskToUpdate) return state;
      
      const newHistory = [
        ...(taskToUpdate.history || []),
        {
          status: action.payload.status,
          time: new Date().toISOString(),
          operator: action.payload.operator || '司机',
          remark: action.payload.reason
        }
      ];
      
      const updatedTask = { ...taskToUpdate, status: action.payload.status, history: newHistory };
      
      // 如果是拒绝任务，保存拒绝原因
      if (action.payload.status === '已拒绝' && action.payload.reason) {
        updatedTask.rejectReason = action.payload.reason;
      }
      
      // 如果任务完成，保存备注并释放资源
      if (action.payload.status === '已完成' && action.payload.reason) {
        updatedTask.remark = action.payload.reason;
      }
      
      // 如果任务完成或拒绝，释放车辆和司机资源
      const shouldReleaseResources = ['已完成', '已拒绝', '已取消'].includes(action.payload.status);
      
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id ? updatedTask : task
        ),
        ...(shouldReleaseResources && {
          vehicles: state.vehicles.map(vehicle => 
            vehicle.id === taskToUpdate.vehicleId 
              ? { ...vehicle, status: '可调配' } 
              : vehicle
          ),
          drivers: state.drivers.map(driver => 
            driver.id === taskToUpdate.driverId 
              ? { ...driver, status: '可调配' } 
              : driver
          )
        })
      };
    case 'ASSIGN_RESOURCE_TO_TASK':
      const taskToAssign = state.tasks.find(t => t.id === action.payload.taskId);
      if (!taskToAssign) return state;
      
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload.taskId) {
            const newHistory = [
              ...(task.history || []),
              {
                status: task.status,
                time: new Date().toISOString(),
                operator: '调度员',
                remark: '分配车辆/司机'
              }
            ];
            return { 
              ...task, 
              vehicleId: action.payload.vehicleId || task.vehicleId,
              driverId: action.payload.driverId || task.driverId,
              history: newHistory
            };
          }
          return task;
        }),
        vehicles: state.vehicles.map(vehicle => {
          if (vehicle.id === action.payload.vehicleId) {
            return { ...vehicle, status: '已调度' };
          }
          return vehicle;
        }),
        drivers: state.drivers.map(driver => {
          if (driver.id === action.payload.driverId) {
            return { ...driver, status: '已调度' };
          }
          return driver;
        }),
      };
    case 'REASSIGN_TASK':
      const taskToReassign = state.tasks.find(t => t.id === action.payload.taskId);
      if (!taskToReassign) return state;
      
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload.taskId) {
            const newHistory = [
              ...(task.history || []),
              {
                status: task.status,
                time: new Date().toISOString(),
                operator: '调度员',
                remark: '改派车辆/司机'
              }
            ];
            return { 
              ...task, 
              vehicleId: action.payload.vehicleId || task.vehicleId,
              driverId: action.payload.driverId || task.driverId,
              status: '待接收',
              history: newHistory
            };
          }
          return task;
        }),
        vehicles: state.vehicles.map(vehicle => {
          if (vehicle.id === taskToReassign.vehicleId) {
            return { ...vehicle, status: '可调配' };
          }
          if (vehicle.id === action.payload.vehicleId) {
            return { ...vehicle, status: '已调度' };
          }
          return vehicle;
        }),
        drivers: state.drivers.map(driver => {
          if (driver.id === taskToReassign.driverId) {
            return { ...driver, status: '可调配' };
          }
          if (driver.id === action.payload.driverId) {
            return { ...driver, status: '已调度' };
          }
          return driver;
        }),
      };
    case 'CANCEL_TASK':
      const taskToCancel = state.tasks.find(t => t.id === action.payload.id);
      if (!taskToCancel) return state;
      
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload.id) {
            const newHistory = [
              ...(task.history || []),
              {
                status: '已取消' as TaskStatus,
                time: new Date().toISOString(),
                operator: '调度员',
                remark: action.payload.reason
              }
            ];
            return { 
              ...task, 
              status: '已取消', 
              cancelReason: action.payload.reason,
              history: newHistory
            };
          }
          return task;
        }),
        vehicles: state.vehicles.map(vehicle => {
          if (vehicle.id === taskToCancel.vehicleId) {
            return { ...vehicle, status: '可调配' };
          }
          return vehicle;
        }),
        drivers: state.drivers.map(driver => {
          if (driver.id === taskToCancel.driverId) {
            return { ...driver, status: '可调配' };
          }
          return driver;
        }),
      };
    case 'ADD_VEHICLE':
      return { ...state, vehicles: [...state.vehicles, action.payload] };
    case 'UPDATE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.id ? { ...vehicle, ...action.payload.data } : vehicle
        ),
      };
    case 'DELETE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.filter(vehicle => vehicle.id !== action.payload.id)
      };
    case 'SET_VEHICLE_UNAVAILABLE':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.id 
            ? { ...vehicle, status: '不可用', unavailableReason: action.payload.reason }
            : vehicle
        ),
      };
    case 'SET_VEHICLE_AVAILABLE':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.id 
            ? { ...vehicle, status: '可调配', unavailableReason: undefined }
            : vehicle
        ),
      };
    case 'ADD_DRIVER':
      return { ...state, drivers: [...state.drivers, action.payload] };
    case 'UPDATE_DRIVER':
      return {
        ...state,
        drivers: state.drivers.map(driver =>
          driver.id === action.payload.id ? { ...driver, ...action.payload.data } : driver
        ),
      };
    case 'DELETE_DRIVER':
      return {
        ...state,
        drivers: state.drivers.filter(driver => driver.id !== action.payload.id)
      };
    case 'SET_DRIVER_UNAVAILABLE':
      return {
        ...state,
        drivers: state.drivers.map(driver =>
          driver.id === action.payload.id 
            ? { 
                ...driver, 
                status: '不可用', 
                unavailableReason: action.payload.reason,
                expectedReturnDate: action.payload.expectedReturnDate
              }
            : driver
        ),
      };
    case 'SET_DRIVER_AVAILABLE':
      return {
        ...state,
        drivers: state.drivers.map(driver =>
          driver.id === action.payload.id 
            ? { 
                ...driver, 
                status: '可调配', 
                unavailableReason: undefined,
                expectedReturnDate: undefined
              }
            : driver
        ),
      };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(supplier =>
          supplier.id === action.payload.id ? { ...supplier, ...action.payload.data } : supplier
        ),
      };
    case 'ASSIGN_VEHICLE_TO_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(act => {
          if (act.id === action.payload.activityId && !act.vehicleIds.includes(action.payload.vehicleId)) {
            return { ...act, vehicleIds: [...act.vehicleIds, action.payload.vehicleId] };
          }
          return act;
        })
      };
    case 'ASSIGN_DRIVER_TO_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(act => {
          if (act.id === action.payload.activityId && !act.driverIds.includes(action.payload.driverId)) {
            return { ...act, driverIds: [...act.driverIds, action.payload.driverId] };
          }
          return act;
        })
      };
    case 'REMOVE_VEHICLE_FROM_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(act => {
          if (act.id === action.payload.activityId) {
            return { ...act, vehicleIds: act.vehicleIds.filter(id => id !== action.payload.vehicleId) };
          }
          return act;
        })
      };
    case 'REMOVE_DRIVER_FROM_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(act => {
          if (act.id === action.payload.activityId) {
            return { ...act, driverIds: act.driverIds.filter(id => id !== action.payload.driverId) };
          }
          return act;
        })
      };
    case 'ADD_AUDIT_RECORD':
      return { ...state, auditRecords: [...state.auditRecords, action.payload] };
    case 'OPEN_MODAL':
      return { ...state, activeModal: action.payload.type, modalData: action.payload.data };
    case 'CLOSE_MODAL':
      return { ...state, activeModal: null, modalData: null };
    default:
      return state;
  }
};

interface AppContextType extends AppState {
  dispatch: React.Dispatch<Action>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
