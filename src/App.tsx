import React, { useState } from 'react';
import { 
  Car, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  MapPin, 
  Smartphone,
  Monitor,
  AlertCircle,
  History,
  UserPlus,
  Map,
  Play,
  RotateCcw,
  Clock,
  Navigation,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import PCLayout from './components/PC/PCLayout';
import MobileLayout from './components/Mobile/MobileLayout';
import Modal from './components/Modal';
import { generateId, cn, getTaskAbnormalRules } from './lib/utils';
import type { Task, Vehicle, Driver, Activity, ActivityStatus, ActivityPeriod, ResourceStatus, TaskStatus, AuditStatus } from './types';

// Main App Component
export default function App() {
  const [view, setView] = useState<'pc' | 'mobile'>('pc');
  
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="fixed bottom-4 right-4 z-50 flex gap-2 bg-white p-1 rounded-full shadow-lg border border-slate-200">
          <button 
            onClick={() => setView('pc')}
            className={cn(
              "p-2 rounded-full transition-all",
              view === 'pc' ? "bg-brand-500 text-white" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Monitor size={20} />
          </button>
          <button 
            onClick={() => setView('mobile')}
            className={cn(
              "p-2 rounded-full transition-all",
              view === 'mobile' ? "bg-brand-500 text-white" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Smartphone size={20} />
          </button>
        </div>
        
        {view === 'pc' ? <PCApp /> : <MobileApp />}
      </div>
    </AppProvider>
  );
}

// PC App with all the modal logic
function PCApp() {
  const { tasks, vehicles, drivers, activities, activeModal, modalData, dispatch } = useApp();

  const [formData, setFormData] = useState<any>({});
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [vehicleAvailableRanges, setVehicleAvailableRanges] = useState<{from: string, to: string}[]>([]);
  const [driverAvailableRanges, setDriverAvailableRanges] = useState<{from: string, to: string}[]>([]);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');

  const handleClose = () => {
    dispatch({ type: 'CLOSE_MODAL' });
    setFormData({});
    setSelectedVehicles([]);
    setSelectedDrivers([]);
    setVehicleAvailableRanges([]);
    setDriverAvailableRanges([]);
    setCancelReason('');
    setSelectedActivityId('');
  };

  const checkTimeConflicts = (vehicleId: string | undefined, driverId: string | undefined, taskDate: string, startTime: string, endTime: string, excludeTaskId?: string) => {
    const conflicts: string[] = [];

    if (vehicleId) {
      const vehicleTasks = tasks.filter(t => 
        t.vehicleId === vehicleId && 
        t.date === taskDate && 
        t.id !== excludeTaskId &&
        t.status !== '已取消' &&
        t.status !== '已完成'
      );
      vehicleTasks.forEach(t => {
        if (!(endTime <= t.startTime || startTime >= t.endTime)) {
          conflicts.push(`车辆已被任务"${t.name}"占用`);
        }
      });
    }

    if (driverId) {
      const driverTasks = tasks.filter(t => 
        t.driverId === driverId && 
        t.date === taskDate && 
        t.id !== excludeTaskId &&
        t.status !== '已取消' &&
        t.status !== '已完成'
      );
      driverTasks.forEach(t => {
        if (!(endTime <= t.startTime || startTime >= t.endTime)) {
          conflicts.push(`司机已被任务"${t.name}"占用`);
        }
      });
    }

    return conflicts;
  };

  const checkAvailableDate = (vehicleId: string | undefined, driverId: string | undefined, taskDate: string) => {
    const errors: string[] = [];

    if (vehicleId) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle && vehicle.availableRanges && vehicle.availableRanges.length > 0) {
        const inRange = vehicle.availableRanges.some(range => {
          return taskDate >= range.from && taskDate <= range.to;
        });
        if (!inRange) {
          errors.push(`车辆 ${vehicle.plateNumber} 在 ${taskDate} 不可用`);
        }
      }
    }

    if (driverId) {
      const driver = drivers.find(d => d.id === driverId);
      if (driver && driver.availableRanges && driver.availableRanges.length > 0) {
        const inRange = driver.availableRanges.some(range => {
          return taskDate >= range.from && taskDate <= range.to;
        });
        if (!inRange) {
          errors.push(`司机 ${driver.name} 在 ${taskDate} 不可用`);
        }
      }
    }

    return errors;
  };

  const checkLicenseMatch = (vehicleId: string | undefined, driverId: string | undefined) => {
    if (!vehicleId || !driverId) return true;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const driver = drivers.find(d => d.id === driverId);
    if (!vehicle || !driver) return true;
    
    const licenseOrder = ['C1', 'C2', 'B1', 'B2', 'A1', 'A2'];
    const vehicleLevel = licenseOrder.indexOf(vehicle.licenseRequired);
    const driverLevel = licenseOrder.indexOf(driver.licenseType);
    
    return driverLevel >= vehicleLevel;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeModal === 'NEW_ACTIVITY') {
      const newActivity: Activity = {
        id: generateId(),
        name: formData.name || '新活动',
        startTime: formData.startTime || '2026-06-11 09:00',
        endTime: formData.endTime || '2026-06-11 18:00',
        location: formData.location || '未设置',
        description: formData.description || '',
        status: '筹备中' as ActivityStatus,
        period: '筹备期' as ActivityPeriod,
        managers: ['调度员-陈某'],
        vehicleIds: selectedVehicles,
        driverIds: selectedDrivers
      };
      dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
      handleClose();
    } else if (activeModal === 'NEW_VEHICLE') {
      const existingVehicle = vehicles.find(v => v.plateNumber === formData.plateNumber);
      if (existingVehicle) {
        alert('该车牌号已存在，请检查后重新输入');
        return;
      }
      const newVehicle: Vehicle = {
        id: generateId(),
        plateNumber: formData.plateNumber,
        type: formData.type || '轿车',
        brand: formData.brand || '',
        capacity: formData.capacity ? Number(formData.capacity) : 5,
        color: formData.color,
        licenseRequired: formData.licenseRequired || 'C1',
        supplier: formData.supplier || '',
        supplierId: '',
        contactPhone: formData.contactPhone,
        availableRanges: vehicleAvailableRanges,
        notes: formData.notes,
        activityId: selectedActivityId || undefined,
        status: '可调配' as ResourceStatus,
        auditStatus: '待审核' as AuditStatus,
        auditMaterials: {
          vehiclePhotos: [],
          inspectionCert: [],
          insurance: [],
          other: []
        }
      };
      dispatch({ type: 'ADD_VEHICLE', payload: newVehicle });
      handleClose();
    } else if (activeModal === 'EDIT_VEHICLE') {
      dispatch({
        type: 'UPDATE_VEHICLE',
        payload: {
          id: modalData.id,
          data: {
            ...formData,
            availableRanges: vehicleAvailableRanges
          }
        }
      });
      handleClose();
    } else if (activeModal === 'NEW_DRIVER') {
      const existingDriver = drivers.find(d => d.phone === formData.phone);
      if (existingDriver) {
        alert('该手机号已存在，请检查后重新输入');
        return;
      }
      const newDriver: Driver = {
        id: generateId(),
        name: formData.name,
        phone: formData.phone,
        idCardNumber: formData.idCardNumber,
        licenseType: formData.licenseType || 'C1',
        licenseExpiry: formData.licenseExpiry,
        supplier: formData.supplier || '',
        supplierId: '',
        availableRanges: driverAvailableRanges,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        notes: formData.notes,
        activityId: selectedActivityId || undefined,
        status: '可调配' as ResourceStatus,
        auditStatus: '待审核' as AuditStatus,
        auditMaterials: {
          licenseFront: [],
          licenseBack: [],
          other: []
        }
      };
      dispatch({ type: 'ADD_DRIVER', payload: newDriver });
      handleClose();
    } else if (activeModal === 'EDIT_DRIVER') {
      dispatch({
        type: 'UPDATE_DRIVER',
        payload: {
          id: modalData.id,
          data: {
            ...formData,
            availableRanges: driverAvailableRanges
          }
        }
      });
      handleClose();
    } else if (activeModal === 'NEW_TASK') {
      if (!selectedActivityId) {
        alert('请选择所属活动');
        return;
      }
      const newTask: Task = {
        id: generateId(),
        name: formData.name,
        type: formData.type || '接送机',
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        from: formData.from,
        to: formData.to,
        passenger: formData.passenger,
        passengerPhone: formData.passengerPhone,
        passengerCount: formData.passengerCount,
        description: formData.description,
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        activityId: selectedActivityId || modalData?.id || '',
        fieldDispatcher: formData.fieldDispatcher || '当前用户',
        status: '待派发' as TaskStatus,
        history: []
      };
      dispatch({ type: 'ADD_TASK', payload: newTask });
      handleClose();
    } else if (activeModal === 'EDIT_TASK') {
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          id: modalData.id,
          data: formData
        }
      });
      handleClose();
    } else if (activeModal === 'ASSIGN_RESOURCE') {
      const conflicts = checkTimeConflicts(
        formData.vehicleId, 
        formData.driverId, 
        modalData.date, 
        modalData.startTime, 
        modalData.endTime,
        modalData.id
      );
      
      if (!checkLicenseMatch(formData.vehicleId, formData.driverId)) {
        alert('司机驾照类型不满足车辆要求！');
        return;
      }
      
      if (conflicts.length > 0) {
        alert('时间冲突：\n' + conflicts.join('\n'));
        return;
      }

      const dateErrors = checkAvailableDate(formData.vehicleId, formData.driverId, modalData.date);
      if (dateErrors.length > 0) {
        alert('可用日期校验失败：\n' + dateErrors.join('\n'));
        return;
      }
      
      dispatch({
        type: 'ASSIGN_RESOURCE_TO_TASK',
        payload: {
          taskId: modalData.id,
          vehicleId: formData.vehicleId,
          driverId: formData.driverId
        }
      });
      handleClose();
    } else if (activeModal === 'REASSIGN_TASK') {
      const conflicts = checkTimeConflicts(
        formData.vehicleId, 
        formData.driverId, 
        modalData.date, 
        modalData.startTime, 
        modalData.endTime,
        modalData.id
      );
      
      if (!checkLicenseMatch(formData.vehicleId, formData.driverId)) {
        alert('司机驾照类型不满足车辆要求！');
        return;
      }

      const dateErrors = checkAvailableDate(formData.vehicleId, formData.driverId, modalData.date);
      if (dateErrors.length > 0) {
        alert('可用日期校验失败：\n' + dateErrors.join('\n'));
        return;
      }
      
      if (conflicts.length > 0) {
        alert('时间冲突：\n' + conflicts.join('\n'));
        return;
      }
      
      dispatch({
        type: 'REASSIGN_TASK',
        payload: {
          taskId: modalData.id,
          vehicleId: formData.vehicleId,
          driverId: formData.driverId,
          remark: formData.remark
        }
      });
      handleClose();
    } else if (activeModal === 'CANCEL_TASK') {
      if (!cancelReason) {
        alert('请填写取消原因');
        return;
      }
      dispatch({
        type: 'CANCEL_TASK',
        payload: {
          id: modalData.id,
          reason: cancelReason
        }
      });
      handleClose();
    } else if (activeModal === 'ASSIGN_VEHICLES') {
      dispatch({
        type: 'UPDATE_ACTIVITY',
        payload: {
          id: modalData.id,
          data: { vehicleIds: selectedVehicles }
        }
      });
      handleClose();
    } else if (activeModal === 'ASSIGN_DRIVERS') {
      dispatch({
        type: 'UPDATE_ACTIVITY',
        payload: {
          id: modalData.id,
          data: { driverIds: selectedDrivers }
        }
      });
      handleClose();
    }
  };

  return (
    <>
      <PCLayout />
      
      <Modal isOpen={activeModal === 'NEW_ACTIVITY' || activeModal === 'EDIT_ACTIVITY'} onClose={handleClose} title={activeModal === 'NEW_ACTIVITY' ? '新建活动' : '编辑活动'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              活动名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              defaultValue={activeModal === 'EDIT_ACTIVITY' ? modalData?.name : ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
              placeholder="如：2026年夏季调研活动"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">开始时间</label>
              <input
                type="datetime-local"
                defaultValue={activeModal === 'EDIT_ACTIVITY' ? modalData?.startTime : ''}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">结束时间</label>
              <input
                type="datetime-local"
                defaultValue={activeModal === 'EDIT_ACTIVITY' ? modalData?.endTime : ''}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">活动地点</label>
            <input
              type="text"
              defaultValue={activeModal === 'EDIT_ACTIVITY' ? modalData?.location : ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              placeholder="活动举办地点"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">活动描述</label>
            <textarea
              defaultValue={activeModal === 'EDIT_ACTIVITY' ? modalData?.description : ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
              placeholder="活动背景、特殊要求等"
            />
          </div>

          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
            <CheckCircle2 size={20} />
            保存活动
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'ACTIVITY_DETAIL'} onClose={handleClose} title="活动详情" size="xl">
        {modalData && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{modalData.name || '未命名活动'}</h3>
                <p className="text-sm text-slate-500">{modalData.startTime || ''} - {modalData.endTime || ''}</p>
              </div>
              <div className="flex gap-2">
                {modalData.status !== '已结束' && (
                  <>
                    <button 
                      onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'EDIT_ACTIVITY', data: modalData } })}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Edit2 size={16} />
                      编辑活动
                    </button>
                    <button 
                      onClick={() => {
                        const hasUnfinishedTasks = tasks.some(t => 
                          t.activityId === modalData.id && 
                          ['待派发', '待接收', '已接收', '执行中'].includes(t.status)
                        );
                        if (hasUnfinishedTasks) {
                          alert('该活动还有未完成的任务，请先处理！');
                        } else {
                          dispatch({ type: 'UPDATE_ACTIVITY', payload: { id: modalData.id, data: { status: '已结束' } } });
                          handleClose();
                        }
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      结束活动
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">活动地点</p>
                <p className="font-medium text-slate-900">{modalData.location || '未设置'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">活动状态</p>
                <p className="font-medium text-slate-900">{modalData.status || '未知'}</p>
              </div>
            </div>

            {modalData.description && (
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">活动描述</p>
                <p className="text-slate-700">{modalData.description}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-700">关联车辆 ({(modalData.vehicleIds || []).length})</h4>
                <button 
                  onClick={() => {
                    setSelectedVehicles([...(modalData.vehicleIds || [])]);
                    dispatch({ type: 'OPEN_MODAL', payload: { type: 'ASSIGN_VEHICLES', data: modalData } });
                  }}
                  className="text-brand-600 text-sm font-medium flex items-center gap-1"
                >
                  <UserPlus size={14} /> 管理
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(modalData.vehicleIds || []).map((vid: string) => {
                  const v = vehicles.find(vv => vv.id === vid);
                  return v ? (
                    <div key={vid} className="bg-white border border-slate-200 p-3 rounded-lg flex items-center gap-2">
                      <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center">
                        <Car size={14} className="text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{v.plateNumber}</p>
                        <p className="text-xs text-slate-500">{v.brand}</p>
                      </div>
                    </div>
                  ) : null;
                })}
                {(modalData.vehicleIds || []).length === 0 && (
                  <p className="text-slate-400 text-sm col-span-3">暂未关联车辆</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-700">关联司机 ({(modalData.driverIds || []).length})</h4>
                <button 
                  onClick={() => {
                    setSelectedDrivers([...(modalData.driverIds || [])]);
                    dispatch({ type: 'OPEN_MODAL', payload: { type: 'ASSIGN_DRIVERS', data: modalData } });
                  }}
                  className="text-brand-600 text-sm font-medium flex items-center gap-1"
                >
                  <UserPlus size={14} /> 管理
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(modalData.driverIds || []).map((did: string) => {
                  const d = drivers.find(dd => dd.id === did);
                  return d ? (
                    <div key={did} className="bg-white border border-slate-200 p-3 rounded-lg flex items-center gap-2">
                      <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center">
                        <Users size={14} className="text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{d.name}</p>
                        <p className="text-xs text-slate-500">{d.phone}</p>
                      </div>
                    </div>
                  ) : null;
                })}
                {(modalData.driverIds || []).length === 0 && (
                  <p className="text-slate-400 text-sm col-span-3">暂未关联司机</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-700">任务列表 ({tasks.filter(t => t.activityId === modalData.id).length})</h4>
                <button 
                  onClick={() => {
                    setSelectedActivityId(modalData.id);
                    dispatch({ type: 'OPEN_MODAL', payload: { type: 'NEW_TASK', data: modalData } });
                  }}
                  className="text-brand-600 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={14} /> 新建任务
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {tasks.filter(t => t.activityId === modalData.id).map(task => (
                  <div key={task.id} className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{task.name}</p>
                      <p className="text-xs text-slate-500">{task.date} {task.startTime} - {task.endTime}</p>
                    </div>
                    <button 
                      onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'TASK_DETAIL', data: task } })}
                      className="text-brand-600 hover:text-brand-700"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                ))}
                {tasks.filter(t => t.activityId === modalData.id).length === 0 && (
                  <p className="text-slate-400 text-sm">暂无任务</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={activeModal === 'ASSIGN_VEHICLES'} onClose={handleClose} title="关联车辆" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {vehicles.filter(v => v.status === '可调配').map(vehicle => (
              <label key={vehicle.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedVehicles.includes(vehicle.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVehicles([...selectedVehicles, vehicle.id]);
                      } else {
                        setSelectedVehicles(selectedVehicles.filter(id => id !== vehicle.id));
                      }
                    }}
                    className="w-5 h-5 text-brand-600 rounded"
                  />
                  <div>
                    <p className="font-medium">{vehicle.plateNumber}</p>
                    <p className="text-sm text-slate-500">{vehicle.brand} · {vehicle.type}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  vehicle.status === '可调配' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>{vehicle.status}</span>
              </label>
            ))}
          </div>
          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all">
            保存
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'ASSIGN_DRIVERS'} onClose={handleClose} title="关联司机" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {drivers.filter(d => d.status === '可调配').map(driver => (
              <label key={driver.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedDrivers.includes(driver.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDrivers([...selectedDrivers, driver.id]);
                      } else {
                        setSelectedDrivers(selectedDrivers.filter(id => id !== driver.id));
                      }
                    }}
                    className="w-5 h-5 text-brand-600 rounded"
                  />
                  <div>
                    <p className="font-medium">{driver.name}</p>
                    <p className="text-sm text-slate-500">{driver.phone} · {driver.licenseType}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  driver.status === '可调配' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>{driver.status}</span>
              </label>
            ))}
          </div>
          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all">
            保存
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'NEW_VEHICLE' || activeModal === 'EDIT_VEHICLE'} onClose={handleClose} title={activeModal === 'NEW_VEHICLE' ? '新增车辆' : '编辑车辆'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 活动选择 */}
          {activeModal === 'NEW_VEHICLE' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                所属活动
              </label>
              <select
                value={selectedActivityId}
                onChange={(e) => {
                  const activityId = e.target.value;
                  setSelectedActivityId(activityId);
                  // 选择活动后自动设置可用日期为活动日期范围
                  if (activityId) {
                    const activity = activities.find(a => a.id === activityId);
                    if (activity) {
                      const startDate = activity.startTime.split(' ')[0];
                      const endDate = activity.endTime.split(' ')[0];
                      setVehicleAvailableRanges([{ from: startDate, to: endDate }]);
                    }
                  } else {
                    setVehicleAvailableRanges([]);
                  }
                }}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              >
                <option value="">不关联活动</option>
                {activities.filter(a => a.period !== '结束期').map(activity => (
                  <option key={activity.id} value={activity.id}>{activity.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                车牌号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_VEHICLE' ? modalData?.plateNumber : ''}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                placeholder="如：京A12345"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">车辆类型</label>
              <select
                defaultValue={activeModal === 'EDIT_VEHICLE' ? modalData?.type : '轿车'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              >
                <option value="轿车">轿车</option>
                <option value="商务车">商务车</option>
                <option value="大巴">大巴</option>
                <option value="中巴">中巴</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">品牌型号</label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_VEHICLE' ? modalData?.brand : ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                placeholder="如：奔驰 S450"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">车身颜色</label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_VEHICLE' ? modalData?.color : ''}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                placeholder="如：黑色"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">核载人数</label>
              <input
                type="number"
                defaultValue={activeModal === 'EDIT_VEHICLE' ? modalData?.capacity : 5}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">驾照要求</label>
              <select
                defaultValue={activeModal === 'EDIT_VEHICLE' ? modalData?.licenseRequired : 'C1'}
                onChange={(e) => setFormData({ ...formData, licenseRequired: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              >
                <option value="C1">C1</option>
                <option value="C2">C2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">供应商</label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_VEHICLE' ? modalData?.supplier : ''}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                placeholder="车辆所属供应商"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
              <input
                type="tel"
                defaultValue={activeModal === 'EDIT_VEHICLE' ? modalData?.contactPhone : ''}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">可用日期范围</label>
            <div className="space-y-2">
              {(activeModal === 'EDIT_VEHICLE' ? (modalData?.availableRanges || []) : vehicleAvailableRanges).map((range: {from: string, to: string}, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="date"
                    defaultValue={range.from}
                    onChange={(e) => {
                      const newRanges = [...vehicleAvailableRanges];
                      newRanges[idx] = { ...newRanges[idx], from: e.target.value };
                      setVehicleAvailableRanges(newRanges);
                    }}
                    className="flex-1 p-2 rounded-lg border border-slate-200"
                  />
                  <span className="text-slate-400">至</span>
                  <input
                    type="date"
                    defaultValue={range.to}
                    onChange={(e) => {
                      const newRanges = [...vehicleAvailableRanges];
                      newRanges[idx] = { ...newRanges[idx], to: e.target.value };
                      setVehicleAvailableRanges(newRanges);
                    }}
                    className="flex-1 p-2 rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newRanges = [...vehicleAvailableRanges];
                      newRanges.splice(idx, 1);
                      setVehicleAvailableRanges(newRanges);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setVehicleAvailableRanges([...vehicleAvailableRanges, { from: '', to: '' }])}
                className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                + 添加日期范围
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea
              defaultValue={activeModal === 'EDIT_VEHICLE' ? modalData?.notes : ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
            />
          </div>

          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all">
            保存车辆
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'NEW_DRIVER' || activeModal === 'EDIT_DRIVER'} onClose={handleClose} title={activeModal === 'NEW_DRIVER' ? '新增司机' : '编辑司机'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 活动选择 */}
          {activeModal === 'NEW_DRIVER' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                所属活动
              </label>
              <select
                value={selectedActivityId}
                onChange={(e) => {
                  const activityId = e.target.value;
                  setSelectedActivityId(activityId);
                  // 选择活动后自动设置可用日期为活动日期范围
                  if (activityId) {
                    const activity = activities.find(a => a.id === activityId);
                    if (activity) {
                      const startDate = activity.startTime.split(' ')[0];
                      const endDate = activity.endTime.split(' ')[0];
                      setDriverAvailableRanges([{ from: startDate, to: endDate }]);
                    }
                  } else {
                    setDriverAvailableRanges([]);
                  }
                }}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              >
                <option value="">不关联活动</option>
                {activities.filter(a => a.period !== '结束期').map(activity => (
                  <option key={activity.id} value={activity.id}>{activity.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_DRIVER' ? modalData?.name : ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                defaultValue={activeModal === 'EDIT_DRIVER' ? modalData?.phone : ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">身份证号</label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_DRIVER' ? modalData?.idCardNumber : ''}
                onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">驾照类型</label>
              <select
                defaultValue={activeModal === 'EDIT_DRIVER' ? modalData?.licenseType : 'C1'}
                onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              >
                <option value="C1">C1</option>
                <option value="C2">C2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">驾照有效期至</label>
              <input
                type="date"
                defaultValue={activeModal === 'EDIT_DRIVER' ? modalData?.licenseExpiry : ''}
                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">供应商</label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_DRIVER' ? modalData?.supplier : ''}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">紧急联系人</label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_DRIVER' ? modalData?.emergencyContact : ''}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">紧急联系电话</label>
              <input
                type="tel"
                defaultValue={activeModal === 'EDIT_DRIVER' ? modalData?.emergencyPhone : ''}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">可用日期范围</label>
            <div className="space-y-2">
              {(activeModal === 'EDIT_DRIVER' ? (modalData?.availableRanges || []) : driverAvailableRanges).map((range: {from: string, to: string}, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="date"
                    defaultValue={range.from}
                    onChange={(e) => {
                      const newRanges = [...driverAvailableRanges];
                      newRanges[idx] = { ...newRanges[idx], from: e.target.value };
                      setDriverAvailableRanges(newRanges);
                    }}
                    className="flex-1 p-2 rounded-lg border border-slate-200"
                  />
                  <span className="text-slate-400">至</span>
                  <input
                    type="date"
                    defaultValue={range.to}
                    onChange={(e) => {
                      const newRanges = [...driverAvailableRanges];
                      newRanges[idx] = { ...newRanges[idx], to: e.target.value };
                      setDriverAvailableRanges(newRanges);
                    }}
                    className="flex-1 p-2 rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newRanges = [...driverAvailableRanges];
                      newRanges.splice(idx, 1);
                      setDriverAvailableRanges(newRanges);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDriverAvailableRanges([...driverAvailableRanges, { from: '', to: '' }])}
                className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                + 添加日期范围
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea
              defaultValue={activeModal === 'EDIT_DRIVER' ? modalData?.notes : ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
            />
          </div>

          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all">
            保存司机
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'NEW_TASK' || activeModal === 'EDIT_TASK'} onClose={handleClose} title={activeModal === 'NEW_TASK' ? '新建任务' : '编辑任务'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 活动选择 */}
          {activeModal === 'NEW_TASK' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                所属活动 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              >
                <option value="">请选择活动</option>
                {activities.filter(a => a.period !== '结束期').map(activity => (
                  <option key={activity.id} value={activity.id}>{activity.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              任务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              defaultValue={activeModal === 'EDIT_TASK' ? modalData?.name : ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
              placeholder="如：6月10日张局长接机"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">任务类型</label>
              <select
                defaultValue={activeModal === 'EDIT_TASK' ? modalData?.type : '接送机'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              >
                <option value="接送机">接送机</option>
                <option value="办事出行">办事出行</option>
                <option value="会议通勤">会议通勤</option>
                <option value="考察调研">考察调研</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">任务日期</label>
              <input
                type="date"
                defaultValue={activeModal === 'EDIT_TASK' ? modalData?.date : ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">开始时间</label>
              <input
                type="time"
                defaultValue={activeModal === 'EDIT_TASK' ? modalData?.startTime : ''}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">结束时间</label>
              <input
                type="time"
                defaultValue={activeModal === 'EDIT_TASK' ? modalData?.endTime : ''}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">出发地</label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_TASK' ? modalData?.from : ''}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                placeholder="出发地点"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">目的地</label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_TASK' ? modalData?.to : ''}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                placeholder="目的地点"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">乘车人</label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_TASK' ? modalData?.passenger : ''}
                onChange={(e) => setFormData({ ...formData, passenger: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
              <input
                type="tel"
                defaultValue={activeModal === 'EDIT_TASK' ? modalData?.passengerPhone : ''}
                onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">乘车人数</label>
              <input
                type="number"
                min="1"
                defaultValue={activeModal === 'EDIT_TASK' ? modalData?.passengerCount : ''}
                onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value) })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                placeholder="用于匹配车辆座位数"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">现场调度员 <span className="text-red-500">*</span></label>
              <select
                defaultValue={activeModal === 'EDIT_TASK' ? modalData?.fieldDispatcher : '当前用户'}
                onChange={(e) => setFormData({ ...formData, fieldDispatcher: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                required
              >
                <option value="当前用户">当前用户（默认）</option>
                <option value="陈某">陈某</option>
                <option value="李某">李某</option>
                <option value="王某">王某</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">分配车辆</label>
              <select
                value={formData.vehicleId || ''}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              >
                <option value="">暂不分配</option>
                {vehicles.filter(v => v.status === '可调配' || v.id === modalData?.vehicleId).map(v => (
                  <option key={v.id} value={v.id}>{v.plateNumber} - {v.brand || v.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">分配司机</label>
              <select
                value={formData.driverId || ''}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              >
                <option value="">暂不分配</option>
                {drivers.filter(d => d.status === '可调配' || d.id === modalData?.driverId).map(d => (
                  <option key={d.id} value={d.id}>{d.name} - {d.phone}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">任务描述</label>
            <textarea
              defaultValue={activeModal === 'EDIT_TASK' ? modalData?.description : ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
              placeholder="特殊要求、注意事项等"
            />
          </div>

          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
            <CheckCircle2 size={20} />
            {activeModal === 'NEW_TASK' ? '创建任务' : '保存修改'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'TASK_DETAIL'} onClose={handleClose} title="任务详情" size="xl">
        {modalData && (
          <div className="space-y-6">
            {/* 异常标签区域 */}
            {(() => {
              const abnormalRules = getTaskAbnormalRules(modalData);
              if (abnormalRules.length > 0) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={18} className="text-red-600" />
                      <span className="font-bold text-red-700">异常任务</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {abnormalRules.map((rule, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1">
                          <span className="font-bold">{rule.code}</span>
                          <span>{rule.name}</span>
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 space-y-1">
                      {abnormalRules.map((rule, index) => (
                        <p key={index} className="text-xs text-red-600">
                          {rule.code} {rule.name}：{rule.description}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{modalData.name || '未命名任务'}</h3>
                <p className="text-sm text-slate-500">{modalData.date} {modalData.startTime} - {modalData.endTime}</p>
              </div>
              <span className={cn(
                "px-4 py-2 rounded-full text-sm font-bold",
                modalData.status === '执行中' ? "bg-green-100 text-green-700" :
                modalData.status === '待接收' ? "bg-blue-100 text-blue-700" :
                modalData.status === '已接收' ? "bg-purple-100 text-purple-700" :
                modalData.status === '待派发' ? "bg-yellow-100 text-yellow-700" :
                modalData.status === '已取消' ? "bg-red-100 text-red-700" :
                modalData.status === '已拒绝' ? "bg-orange-100 text-orange-700" :
                "bg-slate-100 text-slate-700"
              )}>{modalData.status || '未知'}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">任务类型</p>
                <p className="font-medium text-slate-900">{modalData.type || '未设置'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">乘车人</p>
                <p className="font-medium text-slate-900">{modalData.passenger || '未填写'}</p>
                {modalData.passengerPhone && (
                  <p className="text-sm text-slate-500">{modalData.passengerPhone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">乘车人数</p>
                <p className="font-medium text-slate-900">{modalData.passengerCount || '未填写'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">现场调度员</p>
                <p className="font-medium text-slate-900">{modalData.fieldDispatcher || '未指定'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                  <MapPin size={16} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">出发地</p>
                  <p className="font-medium text-slate-900">{modalData.from || '未设置'}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                  <MapPin size={16} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">目的地</p>
                  <p className="font-medium text-slate-900">{modalData.to || '未设置'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-2">分配车辆</p>
                {modalData.vehicleId ? (
                  (() => {
                    const v = vehicles.find(vv => vv.id === modalData.vehicleId);
                    return v ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
                          <Car size={18} className="text-brand-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{v.plateNumber}</p>
                          <p className="text-xs text-slate-500">{v.brand} · {v.supplier}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400">车辆信息不存在</p>
                    );
                  })()
                ) : (
                  <p className="text-slate-400">未分配车辆</p>
                )}
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-2">分配司机</p>
                {modalData.driverId ? (
                  (() => {
                    const d = drivers.find(dd => dd.id === modalData.driverId);
                    return d ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
                          <Users size={18} className="text-brand-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{d.name}</p>
                          <p className="text-xs text-slate-500">{d.phone} · {d.licenseType}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400">司机信息不存在</p>
                    );
                  })()
                ) : (
                  <p className="text-slate-400">未分配司机</p>
                )}
              </div>
            </div>

            {modalData.description && (
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">任务描述</p>
                <p className="text-slate-700">{modalData.description}</p>
              </div>
            )}

            {modalData.rejectReason && (
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                <p className="text-xs text-orange-600 mb-1">拒绝原因</p>
                <p className="text-orange-800">{modalData.rejectReason}</p>
              </div>
            )}

            {modalData.cancelReason && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <p className="text-xs text-red-600 mb-1">取消原因</p>
                <p className="text-red-800">{modalData.cancelReason}</p>
              </div>
            )}

            {/* 轨迹区域 */}
            {['执行中', '已完成'].includes(modalData.status || '') && (
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Map size={16} className="text-brand-600" />
                    任务轨迹
                  </h4>
                  {modalData.status === '执行中' && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                      <Navigation size={12} />
                      定位中
                    </span>
                  )}
                </div>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-brand-50 to-blue-50 flex items-center justify-center relative">
                    {/* 模拟地图背景 */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="w-full h-full" style={{
                        backgroundImage: `
                          linear-gradient(90deg, #e2e8f0 1px, transparent 1px),
                          linear-gradient(#e2e8f0 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                      }} />
                    </div>
                    
                    {/* 出发地标记 */}
                    <div className="absolute left-8 bottom-8 flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-xs text-slate-600">{modalData.from}</span>
                    </div>
                    
                    {/* 目的地标记 */}
                    <div className="absolute right-8 bottom-8 flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-xs text-slate-600">{modalData.to}</span>
                    </div>
                    
                    {/* 轨迹线 */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
                      <path 
                        d="M 100 350 Q 200 250 400 200 T 700 100" 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="3"
                        strokeDasharray={modalData.status === '执行中' ? "10,5" : "none"}
                        className={modalData.status === '执行中' ? "animate-pulse" : ""}
                      />
                    </svg>
                    
                    {/* 当前位置（执行中） */}
                    {modalData.status === '执行中' && (
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="relative">
                          <div className="w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-50" />
                          <div className="absolute inset-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Navigation size={14} className="text-white transform rotate-45" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {modalData.status === '已完成' && (
                      <div className="text-center text-slate-400">
                        <Map size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">任务已完成，轨迹已记录</p>
                      </div>
                    )}
                  </div>
                  
                  {/* 轨迹回放控制（已完成任务） */}
                  {modalData.status === '已完成' && (
                    <div className="p-3 border-t border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-4">
                        <button className="p-2 bg-white rounded-lg hover:bg-slate-100 transition-colors">
                          <RotateCcw size={16} className="text-slate-600" />
                        </button>
                        <button className="p-2 bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">
                          <Play size={16} className="text-white ml-0.5" />
                        </button>
                        <div className="flex-1">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            defaultValue="0" 
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          {['1x', '2x', '4x', '8x'].map((speed) => (
                            <button 
                              key={speed}
                              className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors"
                            >
                              {speed}
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={12} />
                          00:00 / 00:45
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {modalData.history && modalData.history.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-3">状态变更记录</p>
                <div className="space-y-4">
                  {[...modalData.history].reverse().map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="relative">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          index === 0 ? "bg-brand-500" : "bg-slate-300"
                        )} />
                        {index !== modalData.history.length - 1 && (
                          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-full bg-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            item.status === '执行中' ? "bg-green-100 text-green-700" :
                            item.status === '待接收' ? "bg-blue-100 text-blue-700" :
                            item.status === '已接收' ? "bg-purple-100 text-purple-700" :
                            item.status === '待派发' ? "bg-yellow-100 text-yellow-700" :
                            item.status === '已取消' ? "bg-red-100 text-red-700" :
                            item.status === '已拒绝' ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-700"
                          )}>{item.status}</span>
                          {item.operator && (
                            <span className="text-xs text-slate-500">{item.operator}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(item.time).toLocaleString('zh-CN')}
                        </p>
                        {item.remark && (
                          <p className="text-sm text-slate-600 mt-1">{item.remark}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {['待派发', '待接收', '已接收'].includes(modalData.status || '') && (
                <button 
                  onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'EDIT_TASK', data: modalData } })}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  编辑任务
                </button>
              )}

              {modalData.status === '待派发' && (
                <button 
                  onClick={() => {
                    setFormData({ vehicleId: modalData.vehicleId, driverId: modalData.driverId });
                    dispatch({ type: 'OPEN_MODAL', payload: { type: 'ASSIGN_RESOURCE', data: modalData } });
                  }}
                  className="px-4 py-2 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Users size={16} />
                  分配资源
                </button>
              )}

              {modalData.status === '待派发' && modalData.vehicleId && modalData.driverId && (
                <button 
                  onClick={() => {
                    const activity = activities.find(a => a.id === modalData.activityId);
                    if (activity && activity.period !== '执行期') {
                      alert('活动尚未开始，请在执行期派发任务');
                      return;
                    }
                    if (!modalData.driverId) {
                      alert('请先分配司机');
                      return;
                    }
                    dispatch({ type: 'ASSIGN_RESOURCE_TO_TASK', payload: { taskId: modalData.id, vehicleId: modalData.vehicleId, driverId: modalData.driverId } });
                    dispatch({ type: 'SET_TASK_STATUS', payload: { id: modalData.id, status: '待接收', reason: '任务下发' } });
                    handleClose();
                  }}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  下发任务
                </button>
              )}

              {['待接收', '已接收'].includes(modalData.status || '') && (
                <button 
                  onClick={() => {
                    setFormData({ vehicleId: modalData.vehicleId, driverId: modalData.driverId });
                    dispatch({ type: 'OPEN_MODAL', payload: { type: 'REASSIGN_TASK', data: modalData } });
                  }}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                >
                  改派任务
                </button>
              )}

              {['待派发', '待接收', '已接收'].includes(modalData.status || '') && (
                <button 
                  onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'CANCEL_TASK', data: modalData } })}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  取消任务
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <History size={16} />
                状态变更记录
              </h4>
              <div className="space-y-3">
                {(modalData.history || []).length > 0 ? (
                  (modalData.history || []).reverse().map((h: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-slate-900">
                          <span className="font-medium">{h?.operator || '系统'}</span>
                          {' · '}
                          <span className={cn(
                            "font-medium",
                            h?.status === '执行中' ? "text-green-600" :
                            h?.status === '待接收' ? "text-blue-600" :
                            h?.status === '已取消' ? "text-red-600" : "text-slate-600"
                          )}>
                            {h?.status || '未知'}
                          </span>
                        </p>
                        {h?.remark && <p className="text-xs text-slate-500">{h.remark}</p>}
                        {h?.time && <p className="text-xs text-slate-400">{new Date(h.time).toLocaleString()}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">暂无状态变更记录</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={activeModal === 'ASSIGN_RESOURCE'} onClose={handleClose} title="分配资源">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择车辆</label>
            <select
              value={formData.vehicleId || ''}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">请选择车辆</option>
              {vehicles.filter(v => v.status === '可调配').map(v => (
                <option key={v.id} value={v.id}>{v.plateNumber} - {v.brand}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择司机</label>
            <select
              value={formData.driverId || ''}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">请选择司机</option>
              {drivers.filter(d => d.status === '可调配').map(d => (
                <option key={d.id} value={d.id}>{d.name} - {d.phone}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all">
            确认分配
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'REASSIGN_TASK'} onClose={handleClose} title="改派任务">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择车辆</label>
            <select
              value={formData.vehicleId || ''}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">请选择车辆</option>
              {vehicles.filter(v => v.status === '可调配').map(v => (
                <option key={v.id} value={v.id}>{v.plateNumber} - {v.brand}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择司机</label>
            <select
              value={formData.driverId || ''}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">请选择司机</option>
              {drivers.filter(d => d.status === '可调配').map(d => (
                <option key={d.id} value={d.id}>{d.name} - {d.phone}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">改派说明</label>
            <textarea
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
              placeholder="说明改派原因"
            />
          </div>
          <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-all">
            确认改派
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'CANCEL_TASK'} onClose={handleClose} title="取消任务">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-800">确定要取消此任务吗？</p>
                <p className="text-sm text-red-600 mt-1">此操作无法撤销，已分配的资源将被释放。</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">取消原因 <span className="text-red-500">*</span></label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
              placeholder="请填写取消原因"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
            >
              取消
            </button>
            <button type="submit" className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">
              确认取消
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// Mobile App Wrapper
function MobileApp() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      <MobileLayout />
    </div>
  );
}
