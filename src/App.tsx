import React, { useState } from 'react';
import { 
  Car, 
  Users, 
  Route,
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  MapPin, 
  Smartphone,
  Monitor,
  AlertCircle,
  UserPlus,
  Map as MapIcon,
  Play,
  RotateCcw,
  Clock,
  Navigation,
  ChevronRight,
  X,
  Image,
  FileText,
  CreditCard,
  XCircle,
  Download,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import PCLayout from './components/PC/PCLayout';
import MobileLayout from './components/Mobile/MobileLayout';
import Modal from './components/Modal';
import HelpIcon from './components/HelpIcon';
import VehicleDetail from './components/PC/VehicleDetail';
import DriverDetail from './components/PC/DriverDetail';
import MapLocationPicker, { MapLocationValue } from './components/PC/MapLocationPicker';
import {
  generateId,
  cn,
  getTaskAbnormalRules,
  validateDispatcherNamePhone,
  findUnfinishedTasksForDispatcher,
  formatUnfinishedTaskPrompt,
  isValidChineseMobile,
  buildDispatcherTemplateCSV,
  downloadTextAsFile,
  parseCSV,
  DISPATCHER_IMPORT_HEADERS,
} from './lib/utils';
import type { Task, TaskAssignment, Vehicle, Driver, Activity, Supplier, ActivityStatus, ActivityPeriod, ResourceStatus, TaskStatus, AuditStatus, SupplierStatus, SupplierAttachment, Dispatcher, DispatcherStatus } from './types';
import { systemAccounts } from './data/mockData';
import { parseTaskText } from './lib/taskTextParser';
import { activityHelpData, supplierHelpData, vehicleHelpData, driverHelpData, taskHelpData, trackHelpData, dispatcherHelpData } from './constants/helpData';

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
  const { tasks, vehicles, drivers, activities, suppliers, dispatchers, activeModal, modalData, currentUser, dispatch } = useApp();

  const [formData, setFormData] = useState<any>({});
  // 新建任务-需求文本识别：粘贴内容、已识别字段、表单回填序号（触发字段重挂载以更新 defaultValue）
  const [taskPasteText, setTaskPasteText] = useState('');
  const [taskPasteRecognized, setTaskPasteRecognized] = useState<string[]>([]);
  const [taskFillSeq, setTaskFillSeq] = useState(0);
  // 新建/编辑任务-出发地/目的地地图选点弹窗：'from' | 'to' | null
  const [taskLocationPicker, setTaskLocationPicker] = useState<'from' | 'to' | null>(null);
  // 选点弹窗内的临时草稿，点"确定"才回填表单，避免拖动标记时误提交
  const [taskLocationDraft, setTaskLocationDraft] = useState<MapLocationValue | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [vehicleAvailableRanges, setVehicleAvailableRanges] = useState<{from: string, to: string}[]>([]);
  const [driverAvailableRanges, setDriverAvailableRanges] = useState<{from: string, to: string}[]>([]);
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([]);
  const [inspectionCerts, setInspectionCerts] = useState<string[]>([]);
  const [insuranceDocs, setInsuranceDocs] = useState<string[]>([]);
  const [otherMaterials, setOtherMaterials] = useState<string[]>([]);
  const [driverLicenseFront, setDriverLicenseFront] = useState<string[]>([]);
  const [driverLicenseBack, setDriverLicenseBack] = useState<string[]>([]);
  const [driverPhotos, setDriverPhotos] = useState<string[]>([]);
  const [driverOtherMaterials, setDriverOtherMaterials] = useState<string[]>([]);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [pcActiveTab, setPcActiveTab] = useState<string>('home');
  const [contractFiles, setContractFiles] = useState<SupplierAttachment[]>([]);
  const [qualificationFiles, setQualificationFiles] = useState<SupplierAttachment[]>([]);
  const [otherSupplierFiles, setOtherSupplierFiles] = useState<SupplierAttachment[]>([]);
  const [activityManagers, setActivityManagers] = useState<string[]>([]);
  // 新建任务-资源分配：公共车辆检索条件（车型、核载人数、车牌号）
  const [taskVehicleTypeFilter, setTaskVehicleTypeFilter] = useState('');
  const [taskVehicleCapacityFilter, setTaskVehicleCapacityFilter] = useState('');
  const [taskVehiclePlateFilter, setTaskVehiclePlateFilter] = useState('');
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [showManagerSearch, setShowManagerSearch] = useState(false);
  const [managerSearchResults, setManagerSearchResults] = useState<{name: string, phone: string}[]>([]);
  // 调度员批量导入预览
  const [importPreview, setImportPreview] = useState<
    { data: Record<string, string>; ok: boolean; reason?: string }[]
  >([]);
  const [importTruncated, setImportTruncated] = useState(false);

  // 搜索总调度员
  const handleManagerSearch = (query: string) => {
    setManagerSearchQuery(query);
    
    if (!query.trim()) {
      setManagerSearchResults([]);
      setShowManagerSearch(false);
      return;
    }

    const results = systemAccounts
      .filter(account => 
        account.name.includes(query) || 
        account.phone.includes(query)
      )
      .map(account => ({ name: account.name, phone: account.phone }))
      .slice(0, 5);

    setManagerSearchResults(results);
    setShowManagerSearch(results.length > 0);
  };

  // 选择总调度员
  const handleSelectManager = (result: { name: string; phone: string }) => {
    if (!activityManagers.includes(result.name)) {
      setActivityManagers([...activityManagers, result.name]);
    }
    setShowManagerSearch(false);
    setManagerSearchQuery('');
    setManagerSearchResults([]);
  };

  // 删除总调度员
  const handleRemoveManager = (name: string) => {
    setActivityManagers(activityManagers.filter(m => m !== name));
  };

  // 初始化编辑活动的总调度员
  React.useEffect(() => {
    if (activeModal === 'EDIT_ACTIVITY' && modalData?.managers) {
      setActivityManagers(modalData.managers);
    }
  }, [activeModal, modalData]);

  // 初始化新建/编辑任务的多车辆分配行
  React.useEffect(() => {
    if (activeModal === 'NEW_TASK') {
      // 新建任务：从空开始，通过点击公共检索结果追加车辆行
      setFormData((f: any) => (f.assignments ? f : { ...f, assignments: [] }));
    } else if (activeModal === 'EDIT_TASK' && modalData) {
      // 编辑任务：从已有 assignments 回填；旧数据仅有 vehicleId 时降级为单行
      setFormData((f: any) => {
        if (f.assignments) return f;
        const fromExisting =
          (modalData.assignments && modalData.assignments.length > 0)
            ? modalData.assignments.map((a: any) => ({ vehicleId: a.vehicleId || '', driverId: a.driverId || '' }))
            : (modalData.vehicleId
                ? [{ vehicleId: modalData.vehicleId, driverId: modalData.driverId || '' }]
                : []);
        return { ...f, assignments: fromExisting };
      });
    }
  }, [activeModal, modalData]);

  // 打开新建任务弹窗时重置需求文本识别状态
  React.useEffect(() => {
    if (activeModal === 'NEW_TASK') {
      setTaskPasteText('');
      setTaskPasteRecognized([]);
    }
  }, [activeModal]);

  // 识别粘贴的用车需求文本并回填表单
  const handleTaskPasteParse = () => {
    const parsed = parseTaskText(taskPasteText);
    if (parsed.recognized.length === 0) {
      alert('未能识别出有效信息，请检查文本内容（需包含出发地/目的地、时间或乘车人等）');
      return;
    }
    const { recognized, ...fields } = parsed;
    // 文本识别只带出地点名称、没有坐标，清掉可能残留的旧坐标，避免坐标与名称不符
    setFormData((f: any) => ({
      ...f,
      ...fields,
      ...(fields.from !== undefined ? { fromLatitude: undefined, fromLongitude: undefined } : {}),
      ...(fields.to !== undefined ? { toLatitude: undefined, toLongitude: undefined } : {}),
    }));
    setTaskFillSeq(s => s + 1);
    setTaskPasteRecognized(recognized);
  };

  // 打开出发地/目的地选点弹窗，先把已有坐标载入草稿
  const openTaskLocationPicker = (prefix: 'from' | 'to') => {
    const src = activeModal === 'EDIT_TASK' ? modalData : formData;
    if (src?.[`${prefix}Latitude`] !== undefined && src?.[`${prefix}Longitude`] !== undefined) {
      setTaskLocationDraft({
        location: src[`${prefix}`] || '',
        latitude: src[`${prefix}Latitude`],
        longitude: src[`${prefix}Longitude`],
      });
    } else {
      setTaskLocationDraft(null);
    }
    setTaskLocationPicker(prefix);
  };

  // 草稿回填到出发地/目的地（名称 + 经纬度）
  const confirmTaskLocationPick = () => {
    if (!taskLocationDraft || !taskLocationPicker) {
      alert('请先在地图上选择地点');
      return;
    }
    const prefix = taskLocationPicker;
    setFormData((f: any) => ({
      ...f,
      [`${prefix}`]: taskLocationDraft.location,
      [`${prefix}Latitude`]: taskLocationDraft.latitude,
      [`${prefix}Longitude`]: taskLocationDraft.longitude,
    }));
    setTaskLocationPicker(null);
  };

  const handleClose = () => {
    dispatch({ type: 'CLOSE_MODAL' });
    setFormData({});
    setSelectedVehicles([]);
    setSelectedDrivers([]);
    setVehicleAvailableRanges([]);
    setDriverAvailableRanges([]);
    setVehiclePhotos([]);
    setInspectionCerts([]);
    setInsuranceDocs([]);
    setOtherMaterials([]);
    setDriverLicenseFront([]);
    setDriverLicenseBack([]);
    setDriverPhotos([]);
    setDriverOtherMaterials([]);
    setContractFiles([]);
    setQualificationFiles([]);
    setOtherSupplierFiles([]);
    setCancelReason('');
    setActivityManagers([]);
    setManagerSearchQuery('');
    setShowManagerSearch(false);
    setManagerSearchResults([]);
    setSelectedActivityId('');
    setSelectedSupplierId('');
    setTaskVehicleTypeFilter('');
    setTaskVehicleCapacityFilter('');
    setTaskVehiclePlateFilter('');
    setImportPreview([]);
    setImportTruncated(false);
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

  // 构建&校验多车辆分配（每辆车单独分配司机）
  // 返回 { ok, assignments, vehicleId, driverId, error }
  type BuildAssignmentsResult =
    | { ok: true; assignments: TaskAssignment[]; vehicleId?: string; driverId?: string }
    | { ok: false; error: string };
  const buildAssignments = (formData: any): BuildAssignmentsResult => {
    const rawAssignments: { vehicleId: string; driverId?: string }[] =
      (formData.assignments || []).filter((a: any) => a.vehicleId);

    // 每辆车必须分配司机（符合“每辆车需单独分配司机”的变更要求）
    for (let i = 0; i < rawAssignments.length; i++) {
      if (!rawAssignments[i].driverId) {
        const v = vehicles.find(vv => vv.id === rawAssignments[i].vehicleId);
        return { ok: false, error: `请为车辆 ${v?.plateNumber || '第' + (i + 1) + '辆'} 分配司机，或删除该车辆` };
      }
    }

    // 同一任务内：车辆不可重复、司机不可重复
    for (let i = 0; i < rawAssignments.length; i++) {
      for (let j = i + 1; j < rawAssignments.length; j++) {
        if (rawAssignments[i].vehicleId === rawAssignments[j].vehicleId) {
          const v = vehicles.find(vv => vv.id === rawAssignments[i].vehicleId);
          return { ok: false, error: `车辆 ${v?.plateNumber || ''} 在本任务中重复分配` };
        }
        if (rawAssignments[i].driverId && rawAssignments[i].driverId === rawAssignments[j].driverId) {
          const d = drivers.find(dd => dd.id === rawAssignments[i].driverId);
          return { ok: false, error: `司机 ${d?.name || ''} 在本任务中重复分配` };
        }
      }
    }

    // 逐对校验：时间段冲突、可用日期、驾照匹配
    // 编辑任务时未修改的日期/时间字段以原任务数据（modalData）回退，避免误判
    const taskDate = formData.date || modalData?.date;
    const taskStartTime = formData.startTime || modalData?.startTime;
    const taskEndTime = formData.endTime || modalData?.endTime;
    for (const a of rawAssignments) {
      const conflicts = checkTimeConflicts(a.vehicleId, a.driverId, taskDate, taskStartTime, taskEndTime);
      if (conflicts.length) return { ok: false, error: conflicts.join('；') };
      const dateErrors = checkAvailableDate(a.vehicleId, a.driverId, taskDate);
      if (dateErrors.length) return { ok: false, error: dateErrors.join('；') };
      if (!checkLicenseMatch(a.vehicleId, a.driverId)) {
        const v = vehicles.find(vv => vv.id === a.vehicleId);
        const d = drivers.find(dd => dd.id === a.driverId);
        return { ok: false, error: `司机 ${d?.name} 的驾照类型不满足车辆 ${v?.plateNumber} 的要求` };
      }
    }

    const assignments = rawAssignments.map(a => ({ vehicleId: a.vehicleId, driverId: a.driverId }));
    return {
      ok: true,
      assignments,
      vehicleId: assignments[0]?.vehicleId,
      driverId: assignments[0]?.driverId
    };
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
        managers: activityManagers.length > 0 ? activityManagers : ['调度员-陈某'],
        vehicleIds: selectedVehicles,
        driverIds: selectedDrivers,
        supplierIds: [],
        workGroupIds: []
      };
      dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
      handleClose();
    } else if (activeModal === 'EDIT_ACTIVITY') {
      dispatch({
        type: 'UPDATE_ACTIVITY',
        payload: {
          id: modalData.id,
          data: {
            name: formData.name,
            startTime: formData.startTime,
            endTime: formData.endTime,
            location: formData.location,
            description: formData.description,
            managers: activityManagers
          }
        }
      });
      handleClose();
    } else if (activeModal === 'NEW_VEHICLE') {
      const existingVehicle = vehicles.find(v => v.plateNumber === formData.plateNumber);
      if (existingVehicle) {
        alert('该车牌号已存在，请检查后重新输入');
        return;
      }
      const supplierName = currentUser.role === 'supplier' ? currentUser.name : (formData.supplier || '');
      const newVehicle: Vehicle = {
        id: generateId(),
        plateNumber: formData.plateNumber,
        type: formData.type || '轿车',
        brand: formData.brand || '',
        capacity: formData.capacity ? Number(formData.capacity) : 5,
        color: formData.color,
        licenseRequired: formData.licenseRequired || 'C1',
        supplier: supplierName,
        supplierId: currentUser.supplierId || '',
        contactPhone: formData.contactPhone,
        availableRanges: vehicleAvailableRanges,
        notes: formData.notes,
        activityId: selectedActivityId || undefined,
        activityLocations: [],
        status: '可调配' as ResourceStatus,
        auditStatus: '待审核' as AuditStatus,
        auditMaterials: {
          vehiclePhotos: vehiclePhotos,
          inspectionCert: inspectionCerts,
          insurance: insuranceDocs,
          other: otherMaterials
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
      const supplierName = currentUser.role === 'supplier' ? currentUser.name : (formData.supplier || '');
      const newDriver: Driver = {
        id: generateId(),
        name: formData.name,
        phone: formData.phone,
        idCardNumber: formData.idCardNumber,
        licenseType: formData.licenseType || 'C1',
        licenseExpiry: formData.licenseExpiry,
        supplier: supplierName,
        supplierId: currentUser.supplierId || '',
        availableRanges: driverAvailableRanges,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        notes: formData.notes,
        activityId: selectedActivityId || undefined,
        status: '可调配' as ResourceStatus,
        auditStatus: '待审核' as AuditStatus,
        privacyAgreementAccepted: false,
        auditMaterials: {
          licenseFront: driverLicenseFront,
          licenseBack: driverLicenseBack,
          photos: driverPhotos,
          otherQualifications: driverOtherMaterials
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
    } else if (activeModal === 'NEW_SUPPLIER') {
      const existingSupplier = suppliers.find(s => s.name === formData.name);
      if (existingSupplier) {
        alert('该供应商名称已存在，请检查后重新输入');
        return;
      }
      const newSupplier: Supplier = {
        id: generateId(),
        name: formData.name,
        type: formData.type || '租车公司',
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        backupPhone: formData.backupPhone,
        address: formData.address,
        creditCode: formData.creditCode,
        contractStartDate: formData.contractStartDate,
        contractEndDate: formData.contractEndDate,
        contractNumber: formData.contractNumber,
        notes: formData.notes,
        status: '合作中' as SupplierStatus,
        createdAt: new Date().toISOString(),
        attachments: {
          contractFiles,
          qualificationFiles,
          otherFiles: otherSupplierFiles
        }
      };
      dispatch({ type: 'ADD_SUPPLIER', payload: newSupplier });
      handleClose();
    } else if (activeModal === 'EDIT_SUPPLIER') {
      dispatch({
        type: 'UPDATE_SUPPLIER',
        payload: {
          id: modalData.id,
          data: {
            ...formData,
            attachments: {
              contractFiles,
              qualificationFiles,
              otherFiles: otherSupplierFiles
            }
          }
        }
      });
      handleClose();
    } else if (activeModal === 'NEW_TASK') {
      if (!selectedActivityId) {
        alert('请选择所属活动');
        return;
      }
      // 多车辆分配构建与校验（每辆车单独分配司机）
      const built = buildAssignments(formData);
      if (!built.ok) {
        alert(built.error);
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
        fromTime: formData.startTime,
        fromLatitude: formData.fromLatitude,
        fromLongitude: formData.fromLongitude,
        to: formData.to,
        toTime: formData.endTime,
        toLatitude: formData.toLatitude,
        toLongitude: formData.toLongitude,
        waypoints: formData.waypoints?.filter((w: { name: string }) => w.name.trim()) || undefined,
        passenger: formData.passenger,
        passengerPhone: formData.passengerPhone,
        passengerCount: formData.passengerCount,
        description: formData.description,
        vehicleId: built.vehicleId,
        driverId: built.driverId,
        assignments: built.assignments.length ? built.assignments : undefined,
        activityId: selectedActivityId || modalData?.id || '',
        fieldDispatcher: formData.fieldDispatcher || '当前用户',
        status: '待派发' as TaskStatus,
        history: []
      };
      dispatch({ type: 'ADD_TASK', payload: newTask });
      handleClose();
    } else if (activeModal === 'EDIT_TASK') {
      // 编辑任务同样进行多车辆分配构建与校验
      const built = buildAssignments(formData);
      if (!built.ok) {
        alert(built.error);
        return;
      }
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          id: modalData.id,
          data: {
            ...formData,
            from: formData.from ?? modalData.from,
            to: formData.to ?? modalData.to,
            fromLatitude: formData.fromLatitude ?? modalData.fromLatitude,
            fromLongitude: formData.fromLongitude ?? modalData.fromLongitude,
            toLatitude: formData.toLatitude ?? modalData.toLatitude,
            toLongitude: formData.toLongitude ?? modalData.toLongitude,
            vehicleId: built.vehicleId,
            driverId: built.driverId,
            assignments: built.assignments.length ? built.assignments : undefined
          }
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
    } else if (activeModal === 'SET_VEHICLE_UNAVAILABLE') {
      if (!cancelReason) {
        alert('请填写不可用原因');
        return;
      }
      dispatch({
        type: 'SET_VEHICLE_UNAVAILABLE',
        payload: {
          id: modalData.id,
          reason: cancelReason
        }
      });
      handleClose();
    } else if (activeModal === 'DELETE_VEHICLE') {
      dispatch({
        type: 'DELETE_VEHICLE',
        payload: {
          id: modalData.id
        }
      });
      handleClose();
    } else if (activeModal === 'SET_DRIVER_UNAVAILABLE') {
      if (!cancelReason) {
        alert('请填写不可用原因');
        return;
      }
      dispatch({
        type: 'SET_DRIVER_UNAVAILABLE',
        payload: {
          id: modalData.id,
          reason: cancelReason
        }
      });
      handleClose();
    } else if (activeModal === 'DELETE_DRIVER') {
      dispatch({
        type: 'DELETE_DRIVER',
        payload: {
          id: modalData.id
        }
      });
      handleClose();
    } else if (activeModal === 'NEW_DISPATCHER') {
      const name = (formData.name || '').trim();
      const phone = (formData.phone || '').trim();
      const activityId = formData.activityId as string | undefined;
      const unitName = (formData.unitName || '').trim();
      const position = (formData.position || '').trim();

      if (!unitName) {
        alert('请输入单位名称');
        return;
      }
      if (!name) {
        alert('请输入调度员姓名');
        return;
      }
      if (!isValidChineseMobile(phone)) {
        alert('请输入有效手机号');
        return;
      }
      if (!activityId) {
        alert('请选择所属活动');
        return;
      }
      if (!position) {
        alert('请输入职务');
        return;
      }

      const namePhoneCheck = validateDispatcherNamePhone(dispatchers, name, phone);
      if (!namePhoneCheck.ok) {
        alert(namePhoneCheck.message);
        return;
      }

      const newDispatcher: Dispatcher = {
        id: generateId(),
        unitName,
        name,
        phone,
        activityId,
        position,
        idCardNumber: (formData.idCardNumber || '').trim() || undefined,
        status: '可用',
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_DISPATCHER', payload: newDispatcher });
      handleClose();
    } else if (activeModal === 'EDIT_DISPATCHER') {
      const existing: Dispatcher | undefined = modalData;
      if (!existing) {
        handleClose();
        return;
      }
      const targetStatus = formData.status as DispatcherStatus | undefined;

      // 若将状态切为禁用 → 未结束任务校验
      if (
        targetStatus === '禁用' &&
        existing.status !== '禁用'
      ) {
        const unfinished = findUnfinishedTasksForDispatcher(
          tasks,
          activities,
          formData.name ?? existing.name,
          formData.phone ?? existing.phone,
        );
        if (unfinished.length > 0) {
          dispatch({
            type: 'OPEN_MODAL',
            payload: {
              type: 'DISPATCHER_ALERT',
              data: { message: formatUnfinishedTaskPrompt(unfinished, '修改') },
            },
          });
          return;
        }
      }

      const newName = (formData.name ?? existing.name).trim();
      const newPhone = (formData.phone ?? existing.phone).trim();
      // 手机号格式
      if (!isValidChineseMobile(newPhone)) {
        alert('请输入有效手机号');
        return;
      }
      // 姓名/手机号冲突
      const namePhoneCheck = validateDispatcherNamePhone(
        dispatchers,
        newName,
        newPhone,
        existing.id,
      );
      if (!namePhoneCheck.ok) {
        alert(namePhoneCheck.message);
        return;
      }

      const patch: Partial<Dispatcher> = {
        unitName: (formData.unitName ?? existing.unitName).trim(),
        name: newName,
        phone: newPhone,
        position: (formData.position ?? existing.position).trim(),
        // idCardNumber：若表单中曾写入过（包括被清空为''），尊重表单值（空→undefined）
        // 若表单中从未碰过，则保留原值
        idCardNumber: 'idCardNumber' in formData
          ? ((formData.idCardNumber as string | undefined) ?? '').trim() || undefined
          : existing.idCardNumber,
      };
      if (targetStatus) patch.status = targetStatus;
      // 所属活动不可修改 → 不 patch activityId

      dispatch({ type: 'UPDATE_DISPATCHER', payload: { id: existing.id, data: patch } });
      handleClose();
    } else if (activeModal === 'DELETE_DISPATCHER') {
      // H.10.4: 删除确认框的"确认"按钮
      // 未结束任务校验已在点击列表"删除"按钮时完成（H.10.1），此处直接执行删除
      const target: Dispatcher | undefined = modalData;
      if (!target) {
        handleClose();
        return;
      }
      dispatch({
        type: 'DELETE_DISPATCHER',
        payload: { id: target.id },
      });
      handleClose();
    } else if (activeModal === 'IMPORT_DISPATCHERS') {
      const successRows = importPreview.filter((r) => r.ok);
      if (successRows.length === 0) {
        alert('无有效数据可导入');
        return;
      }

      const activityNameToId = new Map(activities.map((a) => [a.name, a.id] as [string, string]));

      let baseDispatchers = dispatchers;
      let importedCount = 0;
      const skippedReasons: { name: string; phone: string; reason: string }[] = [];
      for (const row of successRows) {
        const d = row.data;
        const name = (d['调度员姓名'] || '').trim();
        const phone = (d['手机号'] || '').trim();
        const activityName = (d['所属活动名称'] || '').trim();
        const activityId = activityNameToId.get(activityName);
        if (!activityId) {
          skippedReasons.push({ name, phone, reason: `活动"${activityName}"不存在（可能在预览后被删除或进入结束期）` });
          continue;
        }

        const nameCheck = validateDispatcherNamePhone(baseDispatchers, name, phone, undefined, 'batch');
        if (!nameCheck.ok) {
          skippedReasons.push({ name, phone, reason: nameCheck.message });
          continue;
        }

        const newDisp: Dispatcher = {
          id: generateId(),
          unitName: (d['单位名称'] || '').trim(),
          name,
          phone,
          activityId,
          position: (d['职务'] || '').trim(),
          idCardNumber: (d['身份证号'] || '').trim() || undefined,
          status: '可用',
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_DISPATCHER', payload: newDisp });
        importedCount += 1;
        // 对同批次防重复（避免导入 2 条同一手机+不同姓名），按顺序追加到临时列表
        baseDispatchers = [...baseDispatchers, newDisp];
      }
      if (skippedReasons.length > 0) {
        const uniqReasons = Array.from(new Set(skippedReasons.map((s) => s.reason)));
        const top = skippedReasons
          .slice(0, 3)
          .map((s) => `· ${s.name}（${s.phone}）：${s.reason}`)
          .join('\n');
        alert(
          `导入完成：成功 ${importedCount} 条，跳过 ${skippedReasons.length} 条。\n\n跳过原因概览：\n${top}${
            skippedReasons.length > 3 ? `\n... 等共 ${skippedReasons.length} 条` : ''
          }\n\n原因类型：${uniqReasons.join('；')}`,
        );
      } else if (importedCount > 0) {
        alert(`导入完成：成功导入 ${importedCount} 条调度员`);
      }
      handleClose();
    }
  };

  return (
    <>
        <PCLayout 
          activeTab={pcActiveTab}
          onTabChange={setPcActiveTab}
          onNavigateToAudit={() => setPcActiveTab('audit')}
          onNavigateToTasks={(filterStatus) => {
            setPcActiveTab('tasks');
            if (filterStatus) {
              (window as any).__taskFilterStatus = filterStatus;
            }
          }}
        />
      
      <Modal isOpen={activeModal === 'NEW_ACTIVITY' || activeModal === 'EDIT_ACTIVITY'} onClose={handleClose} title={activeModal === 'NEW_ACTIVITY' ? '新建活动' : '编辑活动'} helpData={activityHelpData['H.1.2']}>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">总调度员</label>
            <div className="relative">
              <input
                type="text"
                value={managerSearchQuery}
                onChange={(e) => handleManagerSearch(e.target.value)}
                onFocus={() => {
                  if (managerSearchQuery) handleManagerSearch(managerSearchQuery);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                placeholder="输入姓名或电话搜索系统账号"
              />
              {showManagerSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {managerSearchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectManager(result)}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                    >
                      <div className="font-medium text-slate-900">{result.name}</div>
                      <div className="text-xs text-slate-500">{result.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {activityManagers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {activityManagers.map((manager, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm"
                  >
                    {manager}
                    <button
                      type="button"
                      onClick={() => handleRemoveManager(manager)}
                      className="hover:text-brand-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
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

      <Modal isOpen={activeModal === 'ACTIVITY_DETAIL_READONLY'} onClose={handleClose} title="活动详情" size="xl">
        {modalData && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{modalData.name || '未命名活动'}</h3>
              <p className="text-sm text-slate-500">{modalData.startTime || ''} - {modalData.endTime || ''}</p>
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
              <h4 className="font-bold text-slate-700">关联车辆 ({(modalData.vehicleIds || []).length})</h4>
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
              <h4 className="font-bold text-slate-700">关联司机 ({(modalData.driverIds || []).length})</h4>
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
              <h4 className="font-bold text-slate-700 mb-4">任务列表 ({tasks.filter(t => t.activityId === modalData.id).length})</h4>
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

      <Modal isOpen={activeModal === 'NEW_VEHICLE' || activeModal === 'EDIT_VEHICLE'} onClose={handleClose} title={activeModal === 'NEW_VEHICLE' ? '新增车辆' : '编辑车辆'} size="xl" helpData={vehicleHelpData['H.3.2']}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 活动选择 */}
          {activeModal === 'NEW_VEHICLE' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  所属供应商 <span className="text-red-500">*</span>
                </label>
                {currentUser.role === 'supplier' ? (
                  <div className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
                    {currentUser.name}
                  </div>
                ) : (
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => {
                      const supplierId = e.target.value;
                      setSelectedSupplierId(supplierId);
                      setSelectedActivityId('');
                      setVehicleAvailableRanges([]);
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                  >
                    <option value="">请选择供应商</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  所属活动 <span className="text-red-500">*</span>
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
                  <option value="">请选择活动</option>
                  {(() => {
                    const currentSupplierId = currentUser.role === 'supplier' 
                      ? suppliers.find(s => s.name === currentUser.name)?.id 
                      : selectedSupplierId;
                    return activities.filter(a => 
                      a.period !== '结束期' && 
                      (currentSupplierId ? a.supplierIds?.includes(currentSupplierId) : true)
                    ).map(activity => (
                      <option key={activity.id} value={activity.id}>{activity.name}</option>
                    ));
                  })()}
                </select>
                {(() => {
                  const currentSupplierId = currentUser.role === 'supplier' 
                    ? suppliers.find(s => s.name === currentUser.name)?.id 
                    : selectedSupplierId;
                  const supplierActivities = activities.filter(a => 
                    a.period !== '结束期' && 
                    (currentSupplierId ? a.supplierIds?.includes(currentSupplierId) : true)
                  );
                  if (currentSupplierId && supplierActivities.length === 0) {
                    return (
                      <p className="mt-2 text-sm text-amber-600">
                        当前供应商暂无关联的筹备期/执行期活动，请先在活动详情页关联供应商
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">审核材料</label>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-1">车辆照片</label>
              <div className="flex gap-2 flex-wrap">
                {vehiclePhotos.map((_, index) => (
                  <div
                    key={index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <Image size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newPhotos = [...vehiclePhotos];
                        newPhotos.splice(index, 1);
                        setVehiclePhotos(newPhotos);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setVehiclePhotos([...vehiclePhotos, ''])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-1">年检合格证</label>
              <div className="flex gap-2 flex-wrap">
                {inspectionCerts.map((_, index) => (
                  <div
                    key={index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <FileText size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newCerts = [...inspectionCerts];
                        newCerts.splice(index, 1);
                        setInspectionCerts(newCerts);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setInspectionCerts([...inspectionCerts, ''])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-1">保险凭证</label>
              <div className="flex gap-2 flex-wrap">
                {insuranceDocs.map((_, index) => (
                  <div
                    key={index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <FileText size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newDocs = [...insuranceDocs];
                        newDocs.splice(index, 1);
                        setInsuranceDocs(newDocs);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setInsuranceDocs([...insuranceDocs, ''])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">其他材料</label>
              <div className="flex gap-2 flex-wrap">
                {otherMaterials.map((_, index) => (
                  <div
                    key={index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <FileText size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newMaterials = [...otherMaterials];
                        newMaterials.splice(index, 1);
                        setOtherMaterials(newMaterials);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOtherMaterials([...otherMaterials, ''])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all">
            保存车辆
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'NEW_DRIVER' || activeModal === 'EDIT_DRIVER'} onClose={handleClose} title={activeModal === 'NEW_DRIVER' ? '新增司机' : '编辑司机'} size="xl" helpData={driverHelpData['H.4.2']}>
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
              {activeModal === 'NEW_DRIVER' && currentUser.role === 'supplier' ? (
                <div className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
                  {currentUser.name}
                </div>
              ) : (
                <input
                  type="text"
                  defaultValue={activeModal === 'EDIT_DRIVER' ? modalData?.supplier : ''}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                />
              )}
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">审核材料</label>
            
            {/* 驾驶证正本 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-500">驾驶证正本 <span className="text-red-500">*</span></label>
                <span className="text-xs text-slate-400">JPG/PNG · ≤10MB</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {driverLicenseFront.map((_, index) => (
                  <div
                    key={index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <CreditCard size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...driverLicenseFront];
                        newItems.splice(index, 1);
                        setDriverLicenseFront(newItems);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDriverLicenseFront([...driverLicenseFront, ''])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            {/* 驾驶证副本 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-500">驾驶证副本 <span className="text-red-500">*</span></label>
                <span className="text-xs text-slate-400">JPG/PNG · ≤10MB</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {driverLicenseBack.map((_, index) => (
                  <div
                    key={index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <CreditCard size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...driverLicenseBack];
                        newItems.splice(index, 1);
                        setDriverLicenseBack(newItems);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDriverLicenseBack([...driverLicenseBack, ''])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            {/* 照片 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-500">照片</label>
                <span className="text-xs text-slate-400">可选 · JPG/PNG · 最多5张 · 单张≤10MB</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {driverPhotos.map((_, index) => (
                  <div
                    key={index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <Image size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...driverPhotos];
                        newItems.splice(index, 1);
                        setDriverPhotos(newItems);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {driverPhotos.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setDriverPhotos([...driverPhotos, ''])}
                    className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                  >
                    <Plus size={24} />
                  </button>
                )}
              </div>
            </div>

            {/* 其他资质材料 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-500">其他资质材料</label>
                <span className="text-xs text-slate-400">可选 · JPG/PNG/PDF · 最多5份 · 单份≤10MB</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {driverOtherMaterials.map((_, index) => (
                  <div
                    key={index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <FileText size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...driverOtherMaterials];
                        newItems.splice(index, 1);
                        setDriverOtherMaterials(newItems);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {driverOtherMaterials.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setDriverOtherMaterials([...driverOtherMaterials, ''])}
                    className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                  >
                    <Plus size={24} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all">
            保存司机
          </button>
        </form>
      </Modal>

      {/* 新增供应商 Modal */}
      <Modal isOpen={activeModal === 'NEW_SUPPLIER'} onClose={handleClose} title="新增供应商" size="xl" helpData={supplierHelpData['H.2.2']}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                供应商名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue={modalData?.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入供应商名称"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                供应商类型 <span className="text-red-500">*</span>
              </label>
              <select
                defaultValue={modalData?.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                required
              >
                <option value="">请选择类型</option>
                <option value="租车公司">租车公司</option>
                <option value="客运公司">客运公司</option>
                <option value="个人车主">个人车主</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                联系人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue={modalData?.contactName || ''}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入联系人姓名"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                联系电话 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                defaultValue={modalData?.contactPhone || ''}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入联系电话"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">备用电话</label>
              <input
                type="tel"
                defaultValue={modalData?.backupPhone || ''}
                onChange={(e) => setFormData({ ...formData, backupPhone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入备用电话"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">信用代码</label>
              <input
                type="text"
                defaultValue={modalData?.creditCode || ''}
                onChange={(e) => setFormData({ ...formData, creditCode: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入统一社会信用代码"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">公司地址</label>
            <input
              type="text"
              defaultValue={modalData?.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
              placeholder="请输入公司地址"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">合作开始日期 <span className="text-red-500">*</span></label>
              <input
                type="date"
                defaultValue={modalData?.contractStartDate || ''}
                onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">合作结束日期</label>
              <input
                type="date"
                defaultValue={modalData?.contractEndDate || ''}
                onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">合同编号</label>
              <input
                type="text"
                defaultValue={modalData?.contractNumber || ''}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入合同编号"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea
              defaultValue={modalData?.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none transition-all"
              placeholder="请输入备注信息"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">附件</label>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-1">合同文件</label>
              <div className="flex gap-2 flex-wrap">
                {contractFiles.map((file, index) => (
                  <div
                    key={file.id || index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <FileText size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...contractFiles];
                        newFiles.splice(index, 1);
                        setContractFiles(newFiles);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setContractFiles([...contractFiles, { id: `cf-${Date.now()}`, fileName: `合同文件${contractFiles.length + 1}.pdf`, filePath: '', fileSize: 0, uploadTime: new Date().toLocaleString(), fileType: 'pdf' }])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-1">资质文件</label>
              <div className="flex gap-2 flex-wrap">
                {qualificationFiles.map((file, index) => (
                  <div
                    key={file.id || index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <FileText size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...qualificationFiles];
                        newFiles.splice(index, 1);
                        setQualificationFiles(newFiles);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setQualificationFiles([...qualificationFiles, { id: `qf-${Date.now()}`, fileName: `资质文件${qualificationFiles.length + 1}.png`, filePath: '', fileSize: 0, uploadTime: new Date().toLocaleString(), fileType: 'png' }])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">其他文件</label>
              <div className="flex gap-2 flex-wrap">
                {otherSupplierFiles.map((file, index) => (
                  <div
                    key={file.id || index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <FileText size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...otherSupplierFiles];
                        newFiles.splice(index, 1);
                        setOtherSupplierFiles(newFiles);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOtherSupplierFiles([...otherSupplierFiles, { id: `of-${Date.now()}`, fileName: `其他文件${otherSupplierFiles.length + 1}.pdf`, filePath: '', fileSize: 0, uploadTime: new Date().toLocaleString(), fileType: 'pdf' }])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all">
            保存供应商
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'NEW_TASK' || activeModal === 'EDIT_TASK'} onClose={handleClose} title={activeModal === 'NEW_TASK' ? '新建任务' : '编辑任务'} size="xl" helpData={taskHelpData['H.6.2']}>
        <form key={taskFillSeq} onSubmit={handleSubmit} className="space-y-5">
          {/* 活动选择 */}
          {activeModal === 'NEW_TASK' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                所属活动 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white"
                required
              >
                <option value="">请选择活动</option>
                {activities.filter(a => a.period !== '结束期').map(activity => (
                  <option key={activity.id} value={activity.id}>{activity.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 需求文本识别（仅新建任务） */}
          {activeModal === 'NEW_TASK' && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  粘贴用车需求，自动填表
                </label>
                {taskPasteRecognized.length > 0 && (
                  <span className="text-xs text-violet-600">
                    已识别：{taskPasteRecognized.join('、')}
                  </span>
                )}
              </div>
              <textarea
                value={taskPasteText}
                onChange={(e) => setTaskPasteText(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-violet-200 focus:border-violet-500 outline-none resize-none bg-white text-sm"
                placeholder={'粘贴用车需求文字（微信消息、通知邮件等均可），系统自动识别出发地、目的地、用车时间、乘车人和联系方式并填入下方表单。\n示例：6月12日下午2点半，张局长一行4人从吴圩机场到市政务中心，乘车人张局长，联系电话13812345678'}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">识别后可在下方表单中修改，请核对无误再保存</span>
                <div className="flex gap-2">
                  {taskPasteText && (
                    <button
                      type="button"
                      onClick={() => { setTaskPasteText(''); setTaskPasteRecognized([]); }}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm"
                    >
                      清空
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleTaskPasteParse}
                    disabled={!taskPasteText.trim()}
                    className="px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1.5"
                  >
                    <Wand2 size={14} />
                    识别填入
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 任务信息 */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <FileText size={16} className="text-brand-600" />
                任务信息
              </h4>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  任务名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  defaultValue={activeModal === 'EDIT_TASK' ? modalData?.name : (formData.name ?? '')}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                  placeholder="如：6月10日张局长接机"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">任务类型</label>
                  <select
                    defaultValue={activeModal === 'EDIT_TASK' ? modalData?.type : (formData.type || '接送机')}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">现场调度员 <span className="text-red-500">*</span></label>
                  <select
                    defaultValue={activeModal === 'EDIT_TASK' ? modalData?.fieldDispatcher : (formData.fieldDispatcher || '当前用户')}
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">乘车人数</label>
                  <input
                    type="number"
                    defaultValue={activeModal === 'EDIT_TASK' ? modalData?.passengerCount : (formData.passengerCount ?? '')}
                    onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                    placeholder="乘车人数"
                    min="1"
                  />
                </div>
              </div>
              
              {/* 跨天任务支持 */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">开始日期 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    defaultValue={activeModal === 'EDIT_TASK' ? modalData?.date : (formData.date ?? '')}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">开始时间 <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    defaultValue={activeModal === 'EDIT_TASK' ? modalData?.startTime : (formData.startTime ?? '')}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">结束日期 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    defaultValue={activeModal === 'EDIT_TASK' ? modalData?.date : (formData.endDate ?? formData.date ?? '')}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">结束时间 <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    defaultValue={activeModal === 'EDIT_TASK' ? modalData?.endTime : (formData.endTime ?? '')}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">乘车人</label>
                  <input
                    type="text"
                    defaultValue={activeModal === 'EDIT_TASK' ? modalData?.passenger : (formData.passenger ?? '')}
                    onChange={(e) => setFormData({ ...formData, passenger: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
                  <input
                    type="tel"
                    defaultValue={activeModal === 'EDIT_TASK' ? modalData?.passengerPhone : (formData.passengerPhone ?? '')}
                    onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">任务描述</label>
                <textarea
                  defaultValue={activeModal === 'EDIT_TASK' ? modalData?.description : (formData.description ?? '')}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
                  placeholder="特殊要求、注意事项等"
                />
              </div>
            </div>
          </div>
          
          {/* 行程安排 */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <Route size={16} className="text-brand-600" />
                行程安排
              </h4>
            </div>
            <div className="p-4 space-y-4">
              {/* 出发地 */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-green-600 font-medium mb-1">出发地</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.from ?? (activeModal === 'EDIT_TASK' ? modalData?.from : '') ?? ''}
                      onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                      className="flex-1 min-w-0 p-2.5 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
                      placeholder="出发地点（可地图选点）"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => openTaskLocationPicker('from')}
                      className="shrink-0 px-3 rounded-lg border border-green-200 bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 flex items-center gap-1"
                      title="在地图上选择出发地"
                    >
                      <MapPin size={13} />
                      地图选点
                    </button>
                  </div>
                  {(formData.fromLatitude ?? modalData?.fromLatitude) !== undefined && (
                    <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">
                      {(formData.fromLongitude ?? modalData?.fromLongitude)?.toFixed(6)}, {(formData.fromLatitude ?? modalData?.fromLatitude)?.toFixed(6)}
                    </div>
                  )}
                </div>
                <div className="w-32">
                  <label className="block text-xs text-slate-500 mb-1">出发时间</label>
                  <input
                    type="time"
                    defaultValue={activeModal === 'EDIT_TASK' ? modalData?.fromTime : (formData.fromTime ?? formData.startTime ?? '')}
                    onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
              
              {/* 途经点 */}
              {formData.waypoints && formData.waypoints.length > 0 && (
                <div className="space-y-3 pl-4 border-l-2 border-dashed border-slate-200 ml-6">
                  {formData.waypoints.map((waypoint: { name: string; time?: string }, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-blue-600 font-medium mb-1">途经点 {index + 1}</label>
                        <input
                          type="text"
                          value={waypoint.name}
                          onChange={(e) => {
                            const newWaypoints = [...(formData.waypoints || [])];
                            newWaypoints[index] = { ...newWaypoints[index], name: e.target.value };
                            setFormData({ ...formData, waypoints: newWaypoints });
                          }}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
                          placeholder="途经点名称"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs text-slate-500 mb-1">预计时间</label>
                        <input
                          type="time"
                          value={waypoint.time || ''}
                          onChange={(e) => {
                            const newWaypoints = [...(formData.waypoints || [])];
                            newWaypoints[index] = { ...newWaypoints[index], time: e.target.value };
                            setFormData({ ...formData, waypoints: newWaypoints });
                          }}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newWaypoints = (formData.waypoints || []).filter((_: any, i: number) => i !== index);
                          setFormData({ ...formData, waypoints: newWaypoints });
                        }}
                        className="p-2 text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 添加途经点按钮 */}
              <button
                type="button"
                onClick={() => {
                  const newWaypoints = [...(formData.waypoints || []), { name: '', order: (formData.waypoints?.length || 0) + 1, time: '' }];
                  setFormData({ ...formData, waypoints: newWaypoints });
                }}
                className="ml-6 text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center gap-1"
              >
                <Plus size={14} />
                添加途经点
              </button>
              
              {/* 目的地 */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-red-600 font-medium mb-1">目的地</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.to ?? (activeModal === 'EDIT_TASK' ? modalData?.to : '') ?? ''}
                      onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                      className="flex-1 min-w-0 p-2.5 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
                      placeholder="目的地点（可地图选点）"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => openTaskLocationPicker('to')}
                      className="shrink-0 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 flex items-center gap-1"
                      title="在地图上选择目的地"
                    >
                      <MapPin size={13} />
                      地图选点
                    </button>
                  </div>
                  {(formData.toLatitude ?? modalData?.toLatitude) !== undefined && (
                    <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">
                      {(formData.toLongitude ?? modalData?.toLongitude)?.toFixed(6)}, {(formData.toLatitude ?? modalData?.toLatitude)?.toFixed(6)}
                    </div>
                  )}
                </div>
                <div className="w-32">
                  <label className="block text-xs text-slate-500 mb-1">到达时间</label>
                  <input
                    type="time"
                    defaultValue={activeModal === 'EDIT_TASK' ? modalData?.toTime : (formData.toTime ?? formData.endTime ?? '')}
                    onChange={(e) => setFormData({ ...formData, toTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 资源分配 - 多车辆，每辆车单独分配司机 */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <Car size={16} className="text-brand-600" />
                资源分配
                <span className="text-xs font-normal text-slate-400">支持多车辆，每辆车单独分配司机</span>
              </h4>
            </div>
            <div className="p-4 space-y-3">
              {/* 公共车辆检索区：车型、核载人数、车牌号；检索条件变更不影响已添加的车辆 */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Car size={14} className="text-brand-600" /> 车辆检索
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={taskVehicleTypeFilter}
                    onChange={(e) => setTaskVehicleTypeFilter(e.target.value)}
                    className="p-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-brand-500 outline-none"
                  >
                    <option value="">全部车型</option>
                    {[...new Set(vehicles.map(v => v.type).filter(Boolean))].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <select
                    value={taskVehicleCapacityFilter}
                    onChange={(e) => setTaskVehicleCapacityFilter(e.target.value)}
                    className="p-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-brand-500 outline-none"
                  >
                    <option value="">全部核载</option>
                    {[...new Set(vehicles.map(v => v.capacity).filter(Boolean))].sort((a, b) => a - b).map(cap => (
                      <option key={cap} value={String(cap)}>{cap}人</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={taskVehiclePlateFilter}
                    onChange={(e) => setTaskVehiclePlateFilter(e.target.value)}
                    placeholder="车牌号"
                    className="p-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-brand-500 outline-none"
                  />
                </div>
                {/* 检索结果列表：点击结果即追加为已分配车辆行 */}
                {(() => {
                  const usedVehicleIds: string[] = (formData.assignments || [])
                    .map((a: any) => a.vehicleId)
                    .filter(Boolean);
                  const filtered = vehicles.filter(v =>
                    v.status === '可调配' &&
                    !usedVehicleIds.includes(v.id) &&
                    (!taskVehicleTypeFilter || v.type === taskVehicleTypeFilter) &&
                    (!taskVehicleCapacityFilter || String(v.capacity) === taskVehicleCapacityFilter) &&
                    (!taskVehiclePlateFilter || (v.plateNumber || '').toUpperCase().includes(taskVehiclePlateFilter.toUpperCase()))
                  );
                  return (
                    <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto bg-white">
                      {filtered.length > 0 ? (
                        filtered.map(v => (
                          <div
                            key={v.id}
                            onClick={() => {
                              // 点击检索结果：追加为已分配车辆行，自动带出可用且未被占用的默认司机
                              const usedDriverIds: string[] = (formData.assignments || [])
                                .map((a: any) => a.driverId)
                                .filter(Boolean);
                              let newDriverId = '';
                              const defId = v.defaultDriverId;
                              if (defId && !usedDriverIds.includes(defId)) {
                                const defDriver = drivers.find(d => d.id === defId);
                                if (defDriver && defDriver.status === '可调配') newDriverId = defId;
                              }
                              setFormData({
                                ...formData,
                                assignments: [...(formData.assignments || []), { vehicleId: v.id, driverId: newDriverId }]
                              });
                            }}
                            className="p-2.5 border-b border-slate-100 last:border-b-0 cursor-pointer hover:bg-brand-50 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{v.plateNumber}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                <span className="inline-block mr-2">{v.type}</span>
                                <span className="inline-block mr-2">核载{v.capacity}人</span>
                                <span className="inline-block">{v.brand}</span>
                              </p>
                            </div>
                            <span className="text-brand-600 text-xs font-medium flex items-center gap-0.5">
                              <Plus size={12} /> 添加
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="p-3 text-center text-xs text-slate-400">无匹配车辆</p>
                      )}
                    </div>
                  );
                })()}
                <p className="text-xs text-slate-400">点击检索结果即可添加为分配车辆，再维护对应司机；重新检索不影响已添加的车辆。</p>
              </div>

              {/* 已分配车辆行：只读车辆卡片 + 司机选择 + 删除 */}
              {(formData.assignments || []).map((assignment: any, index: number) => {
                // 本任务其他行已占用的司机（下拉中排除，避免重复分配）
                const usedDriverIds: string[] = (formData.assignments || [])
                  .map((a: any, i: number) => (i !== index ? a.driverId : null))
                  .filter(Boolean);
                const vehicle = vehicles.find(v => v.id === assignment.vehicleId);
                return (
                  <div key={index} className="border border-brand-200 rounded-xl p-3 bg-brand-50/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">车辆 {index + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            assignments: (formData.assignments || []).filter((_: any, i: number) => i !== index)
                          })
                        }
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                      >
                        <X size={14} /> 删除
                      </button>
                    </div>
                    {/* 已选车辆卡片（只读） */}
                    {vehicle && (
                      <div className="border-2 border-brand-300 bg-brand-50 rounded-xl p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">已选择</span>
                            <p className="font-bold text-slate-900 text-base mt-1">{vehicle.plateNumber}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              <span className="inline-block mr-2">{vehicle.type}</span>
                              <span className="inline-block mr-2">核载{vehicle.capacity}人</span>
                              <span className="inline-block">{vehicle.brand}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* 司机选择 */}
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">分配司机 <span className="text-red-500">*</span></label>
                      <select
                        value={assignment.driverId || ''}
                        onChange={(e) => {
                          const newAssignments = [...(formData.assignments || [])];
                          newAssignments[index] = { ...newAssignments[index], driverId: e.target.value };
                          setFormData({ ...formData, assignments: newAssignments });
                        }}
                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white"
                      >
                        <option value="">请选择司机</option>
                        {drivers.filter(d =>
                          (d.status === '可调配' || d.id === assignment.driverId) &&
                          !usedDriverIds.includes(d.id)
                        ).map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} - {d.phone} ({d.licenseType})
                          </option>
                        ))}
                      </select>
                      {!assignment.driverId && (
                        <p className="text-xs text-red-500 mt-1">请为该车辆分配司机</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {(formData.assignments || []).length === 0 && (
                <p className="text-center text-xs text-slate-400 py-4">点击上方检索结果添加车辆</p>
              )}
              <p className="text-xs text-slate-400">说明：可添加多辆车，每辆车需单独分配一名司机；同一任务内车辆、司机不可重复。创建时可暂不分配（不添加任何车辆）。</p>
            </div>
          </div>

          <button type="submit" className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
            <CheckCircle2 size={20} />
            {activeModal === 'NEW_TASK' ? '创建任务' : '保存修改'}
          </button>
        </form>
      </Modal>

      {/* 任务出发地/目的地地图选点弹窗 */}
      <Modal
        isOpen={taskLocationPicker !== null}
        onClose={() => setTaskLocationPicker(null)}
        title={taskLocationPicker === 'from' ? '选择出发地' : '选择目的地'}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            搜索地址或在地图上点击选点，标记可拖动微调；选好后地点名称与经纬度会自动填入任务表单。
          </p>
          <MapLocationPicker
            value={taskLocationDraft}
            onChange={setTaskLocationDraft}
            label={taskLocationPicker === 'from' ? '出发地（地图选点）' : '目的地（地图选点）'}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTaskLocationPicker(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={confirmTaskLocationPick}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700"
            >
              确定
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'TASK_DETAIL'} onClose={handleClose} title="任务详情" size="xl" helpData={taskHelpData['H.6.3']}>
        {modalData && (
          <div className="space-y-6">
            {/* 异常告警 */}
            {(() => {
              const abnormalRules = getTaskAbnormalRules(modalData);
              if (abnormalRules.length > 0) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle size={18} className="text-red-600" />
                      <span className="font-bold text-red-700">异常告警</span>
                    </div>
                    <div className="space-y-2">
                      {abnormalRules.map((rule, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold flex-shrink-0">{rule.code}</span>
                          <div>
                            <p className="text-sm font-medium text-red-800">{rule.name}</p>
                            <p className="text-xs text-red-600">{rule.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* 基本信息卡片 */}
            <div className="bg-gradient-to-r from-brand-600 to-blue-700 rounded-xl p-5 text-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold mb-1">{modalData.name || '未命名任务'}</h3>
                  <p className="text-white/80 text-sm">{modalData.date} {modalData.startTime} - {modalData.endTime}</p>
                </div>
                <span className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-bold",
                  modalData.status === '执行中' ? "bg-green-400 text-green-900" :
                  modalData.status === '待接收' ? "bg-blue-400 text-blue-900" :
                  modalData.status === '已接收' ? "bg-purple-400 text-purple-900" :
                  modalData.status === '待派发' ? "bg-yellow-400 text-yellow-900" :
                  modalData.status === '已取消' ? "bg-red-400 text-red-900" :
                  modalData.status === '已拒绝' ? "bg-orange-400 text-orange-900" :
                  "bg-slate-400 text-slate-900"
                )}>{modalData.status || '未知'}</span>
              </div>
            </div>

            {/* 行程信息 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h4 className="font-bold text-slate-700 text-sm">行程安排</h4>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* 出发地 */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">出发地</span>
                        {modalData.fromTime && <span className="text-xs text-slate-500">{modalData.fromTime}</span>}
                      </div>
                      <p className="font-medium text-slate-900">{modalData.from || '未设置'}</p>
                    </div>
                  </div>
                  
                  {/* 箭头 */}
                  <ChevronRight size={20} className="text-slate-300 flex-shrink-0" />
                  
                  {/* 途经点 */}
                  {modalData.waypoints && modalData.waypoints.length > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        {modalData.waypoints.map((waypoint: { name: string; time?: string }, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium">途经点{index + 1}</span>
                                {waypoint.time && <span className="text-xs text-slate-500">{waypoint.time}</span>}
                              </div>
                              <p className="font-medium text-slate-900 text-sm">{waypoint.name}</p>
                            </div>
                            {index < modalData.waypoints.length - 1 && (
                              <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                      <ChevronRight size={20} className="text-slate-300 flex-shrink-0" />
                    </>
                  )}
                  
                  {/* 目的地 */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">目的地</span>
                        {modalData.toTime && <span className="text-xs text-slate-500">{modalData.toTime}</span>}
                      </div>
                      <p className="font-medium text-slate-900">{modalData.to || '未设置'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 任务信息 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h4 className="font-bold text-slate-700 text-sm">任务信息</h4>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">任务类型</span>
                    <span className="text-sm font-medium text-slate-900">{modalData.type || '未设置'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">乘车人数</span>
                    <span className="text-sm font-medium text-slate-900">{modalData.passengerCount || '未填写'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">乘车人</span>
                    <span className="text-sm font-medium text-slate-900">{modalData.passenger || '未填写'}</span>
                  </div>
                  {modalData.passengerPhone && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">联系电话</span>
                      <span className="text-sm font-medium text-slate-900">{modalData.passengerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">现场调度员</span>
                    <span className="text-sm font-medium text-slate-900">{modalData.fieldDispatcher || '未指定'}</span>
                  </div>
                  {modalData.fieldDispatcherPhone && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">调度员电话</span>
                      <span className="text-sm font-medium text-slate-900">{modalData.fieldDispatcherPhone}</span>
                    </div>
                  )}
                </div>
                {modalData.description && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-sm text-slate-500 block mb-2">任务描述</span>
                    <p className="text-sm text-slate-700">{modalData.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 资源分配 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h4 className="font-bold text-slate-700 text-sm">资源分配</h4>
              </div>
              <div className="p-5 space-y-4">
                  {(() => {
                    // 兼容多车辆分配与旧数据（仅 vehicleId/driverId）
                    const list = (modalData.assignments && modalData.assignments.length > 0)
                      ? modalData.assignments
                      : (modalData.vehicleId ? [{ vehicleId: modalData.vehicleId, driverId: modalData.driverId }] : []);
                    if (list.length === 0) {
                      return <p className="text-slate-400 text-sm">未分配车辆与司机</p>;
                    }
                    return list.map((a: TaskAssignment, idx: number) => {
                      const v = vehicles.find(vv => vv.id === a.vehicleId);
                      const d = a.driverId ? drivers.find(dd => dd.id === a.driverId) : null;
                      return (
                        <div key={idx} className="space-y-2">
                          {list.length > 1 && (
                            <p className="text-xs font-semibold text-slate-500">车辆 {idx + 1}</p>
                          )}
                          <div>
                            <p className="text-xs text-slate-500 mb-2">分配车辆</p>
                            {v ? (
                              <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg">
                                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                                  <Car size={18} className="text-brand-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{v.plateNumber}</p>
                                  <p className="text-xs text-slate-500">{v.brand} · {v.type} · {v.capacity}座</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-400 text-sm">车辆信息不存在</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-2">分配司机</p>
                            {d ? (
                              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users size={18} className="text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{d.name}</p>
                                  <p className="text-xs text-slate-500">{d.phone} · {d.licenseType}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-400 text-sm">未分配司机</p>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
              </div>
            </div>

            {/* 异常信息 */}
            {(modalData.rejectReason || modalData.cancelReason) && (
              <div className={cn(
                "rounded-xl p-4",
                modalData.rejectReason ? "bg-orange-50 border border-orange-200" : "bg-red-50 border border-red-200"
              )}>
                <h4 className={cn(
                  "font-bold text-sm mb-2 flex items-center gap-2",
                  modalData.rejectReason ? "text-orange-700" : "text-red-700"
                )}>
                  <AlertCircle size={16} />
                  {modalData.rejectReason ? '拒绝原因' : '取消原因'}
                </h4>
                <p className={cn(
                  "text-sm",
                  modalData.rejectReason ? "text-orange-800" : "text-red-800"
                )}>
                  {modalData.rejectReason || modalData.cancelReason}
                </p>
              </div>
            )}

            {/* 轨迹区域 */}
            {['执行中', '已完成'].includes(modalData.status || '') && (
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <MapIcon size={16} className="text-brand-600" />
                    任务轨迹
                  </h4>
                  <div className="flex items-center gap-2">
                    {modalData.status === '已完成' && (
                      <HelpIcon helpData={trackHelpData['H.9.2']} />
                    )}
                    {modalData.status === '执行中' && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <Navigation size={12} />
                        定位中
                      </span>
                    )}
                  </div>
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
                        <MapIcon size={32} className="mx-auto mb-2 opacity-50" />
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
                <p className="text-xs text-slate-500 mb-3 font-medium">状态变更记录</p>
                <div className="flex flex-col gap-3">
                  {[...modalData.history]
                    .reverse()
                    .filter((item, index, arr) => {
                      if (index === 0) {
                        return item.status !== modalData.status;
                      }
                      return item.status !== arr[index - 1].status;
                    })
                    .map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            index === 0 ? "bg-brand-500" : "bg-slate-300"
                          )} />
                          {index !== modalData.history.length - 1 && (
                            <div className="w-px h-6 bg-slate-300" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium whitespace-nowrap",
                            item.status === '执行中' ? "bg-green-100 text-green-700" :
                            item.status === '待接收' ? "bg-blue-100 text-blue-700" :
                            item.status === '已接收' ? "bg-purple-100 text-purple-700" :
                            item.status === '待派发' ? "bg-yellow-100 text-yellow-700" :
                            item.status === '已取消' ? "bg-red-100 text-red-700" :
                            item.status === '已拒绝' ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-700"
                          )}>{item.status}</span>
                          <span className="text-xs text-slate-500">{item.operator}</span>
                          <span className="text-xs text-slate-400">{new Date(item.time).toLocaleString('zh-CN')}</span>
                          {item.remark && (
                            <span className="text-xs text-slate-600">{item.remark}</span>
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

              {modalData.status === '待审批' && (
                <>
                  {!modalData.vehicleId || !modalData.driverId ? (
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
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          dispatch({ type: 'SET_TASK_STATUS', payload: { id: modalData.id, status: '待派发', reason: '审批通过' } });
                          handleClose();
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        审批通过
                      </button>
                      <button 
                        onClick={() => {
                          dispatch({ type: 'SET_TASK_STATUS', payload: { id: modalData.id, status: '已拒绝', reason: '审批拒绝' } });
                          handleClose();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        审批拒绝
                      </button>
                    </>
                  )}
                </>
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
          </div>
        )}
      </Modal>

      <Modal isOpen={activeModal === 'ASSIGN_RESOURCE'} onClose={handleClose} title="分配资源" helpData={taskHelpData['H.6.5']}>
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

      <Modal isOpen={activeModal === 'REASSIGN_TASK'} onClose={handleClose} title="改派任务" helpData={taskHelpData['H.6.6']}>
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

      <Modal isOpen={activeModal === 'CANCEL_TASK'} onClose={handleClose} title="取消任务" helpData={taskHelpData['H.6.7']}>
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

      <Modal isOpen={activeModal === 'SET_VEHICLE_UNAVAILABLE'} onClose={handleClose} title="设为不可用" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-800">确定要将此车辆设为不可用吗？</p>
                <p className="text-sm text-red-600 mt-1">车辆：{modalData?.plateNumber}</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">不可用原因 <span className="text-red-500">*</span></label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
              placeholder="请填写不可用原因"
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
              确认
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'DELETE_VEHICLE'} onClose={handleClose} title="删除车辆" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-800">确定要删除此车辆吗？</p>
                <p className="text-sm text-red-600 mt-1">车牌号：{modalData?.plateNumber}，此操作无法撤销。</p>
              </div>
            </div>
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
              确认删除
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'SET_DRIVER_UNAVAILABLE'} onClose={handleClose} title="设为不可用" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-800">确定要将此司机设为不可用吗？</p>
                <p className="text-sm text-red-600 mt-1">司机：{modalData?.name}</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">不可用原因 <span className="text-red-500">*</span></label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
              placeholder="请填写不可用原因"
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
              确认
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'DELETE_DRIVER'} onClose={handleClose} title="删除司机" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-800">确定要删除此司机吗？</p>
                <p className="text-sm text-red-600 mt-1">姓名：{modalData?.name}，此操作无法撤销。</p>
              </div>
            </div>
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
              确认删除
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= 调度员：新增 / 编辑 弹窗 ================= */}
      <Modal
        isOpen={activeModal === 'NEW_DISPATCHER' || activeModal === 'EDIT_DISPATCHER'}
        onClose={handleClose}
        title={activeModal === 'NEW_DISPATCHER' ? '新增调度员' : '编辑调度员'}
        size="lg"
        helpData={dispatcherHelpData['H.10.2']}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                单位名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_DISPATCHER' ? modalData?.unitName : ''}
                onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                required
                placeholder="如：政府办、接待办"
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                调度员姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_DISPATCHER' ? modalData?.name : ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="请输入调度员姓名"
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                defaultValue={activeModal === 'EDIT_DISPATCHER' ? modalData?.phone : ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                maxLength={11}
                placeholder="11 位手机号"
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                职务 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_DISPATCHER' ? modalData?.position : ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
                placeholder="如：现场调度员、调度科科长"
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                所属活动 <span className="text-red-500">*</span>
              </label>
              {activeModal === 'EDIT_DISPATCHER' ? (
                <div className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                  {activities.find((a) => a.id === modalData?.activityId)?.name ?? '-'}
                  <span className="ml-2 text-xs text-slate-400">（编辑时不可修改）</span>
                </div>
              ) : (
                <select
                  required
                  value={formData.activityId as string | undefined ?? ''}
                  onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                >
                  <option value="">请选择所属活动</option>
                  {activities
                    .filter((a) => a.period !== '结束期')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}（{a.period}）
                      </option>
                    ))}
                </select>
              )}
              {activeModal === 'NEW_DISPATCHER' &&
                activities.filter((a) => a.period !== '结束期').length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">暂无可用的活动，请先创建活动</p>
                )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">身份证号（选填）</label>
              <input
                type="text"
                defaultValue={activeModal === 'EDIT_DISPATCHER' ? modalData?.idCardNumber : ''}
                onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                placeholder="18 位身份证号（可选）"
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {activeModal === 'EDIT_DISPATCHER' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
              <select
                defaultValue={modalData?.status ?? '可用'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as DispatcherStatus })
                }
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              >
                <option value="可用">可用</option>
                <option value="禁用">禁用</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              保存
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= 调度员：删除 确认弹窗 ================= */}
      <Modal isOpen={activeModal === 'DELETE_DISPATCHER'} onClose={handleClose} title="删除调度员" size="sm" helpData={dispatcherHelpData['H.10.4']}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-800">确定要删除此调度员吗？</p>
                <p className="text-sm text-red-600 mt-1">姓名：{modalData?.name}（{modalData?.phone}），此操作无法撤销。</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              确认删除
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= 调度员：业务校验 提示弹窗（只读） ================= */}
      <Modal
        isOpen={activeModal === 'DISPATCHER_ALERT'}
        onClose={handleClose}
        title="操作无法继续"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={22} />
              <p className="text-sm text-red-800 whitespace-pre-line leading-relaxed">
                {modalData?.message ?? ''}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-all"
            >
              知道了
            </button>
          </div>
        </div>
      </Modal>

      {/* ================= 调度员：批量导入 弹窗 ================= */}
      <Modal
        isOpen={activeModal === 'IMPORT_DISPATCHERS'}
        onClose={handleClose}
        title="批量导入调度员"
        size="xl"
        helpData={dispatcherHelpData['H.10.3']}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              请先下载模板，按模板填写数据后上传。单次导入最多 500 条。
            </p>
            <button
              type="button"
              onClick={() =>
                downloadTextAsFile('调度员导入模板.csv', buildDispatcherTemplateCSV())
              }
              className="text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center gap-1"
            >
              <Download size={16} /> 下载模板
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择 CSV 文件</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-6 cursor-pointer transition-colors bg-slate-50 hover:bg-brand-50/40">
              <UploadCloud size={32} className="text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">点击选择 CSV 文件（仅 .csv）</p>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // H.10.3: 文件格式校验
                  const fileName = file.name || '';
                  const lowerName = fileName.toLowerCase();
                  const isCsvByName = lowerName.endsWith('.csv');
                  const isCsvByType = file.type === 'text/csv' || file.type === 'application/csv' || file.type === '';
                  if (!isCsvByName && !isCsvByType) {
                    alert('请上传正确格式的CSV文件');
                    e.target.value = '';
                    return;
                  }
                  try {
                    const text = await file.text();
                    const parsed = parseCSV(text, 500);
                    setImportTruncated(parsed.truncated);
                    const activityNameSet = new Set(
                      (activities.map((a) => a.name) as string[]),
                    );
                    // 预览：先统一建一个可变数组类型
                    type ImportRow = { data: Record<string, string>; ok: boolean; reason?: string };
                    const preview: ImportRow[] = [];
                    // 为了防批次内冲突，维护一个"按手机号聚合姓名"的小集合
                    const batchByPhone = new Map();
                    // 第一遍：每条校验，但不做批次内 姓名+手机+活动 重复
                    for (const r of parsed.rows) {
                      const unit = (r['单位名称'] || '').trim();
                      const name = (r['调度员姓名'] || '').trim();
                      const phone = (r['手机号'] || '').trim();
                      const actName = (r['所属活动名称'] || '').trim();
                      const position = (r['职务'] || '').trim();

                      let ok = true;
                      let reason: string | undefined;
                      if (!unit || !name || !phone || !actName || !position) {
                        ok = false;
                        reason = '存在必填字段为空（单位/姓名/手机/活动/职务）';
                      } else if (!isValidChineseMobile(phone)) {
                        ok = false;
                        reason = '手机号格式错误';
                      } else if (!activityNameSet.has(actName)) {
                        ok = false;
                        reason = `活动名称"${actName}"不存在（结束期活动不在可选范围）`;
                      } else {
                        const dbCheck = validateDispatcherNamePhone(dispatchers, name, phone, undefined, 'batch');
                        if (!dbCheck.ok) {
                          ok = false;
                          reason = dbCheck.message;
                        } else {
                          // 批次内同手机号姓名一致性
                          const names = batchByPhone.get(phone) as Set<string> | undefined;
                          if (!names) {
                            const s = new Set();
                            s.add(name);
                            batchByPhone.set(phone, s);
                          } else if (names.size > 0 && !names.has(name)) {
                            ok = false;
                            reason = '该手机号在导入文件内已被不同姓名使用，存在冲突';
                          } else {
                            names.add(name);
                          }
                        }
                      }
                      preview.push({ data: r, ok, reason });
                    }
                    // 第二遍：批次内 姓名+手机+活动 重复 标记
                    const seenBatch = new Set();
                    for (const item of preview) {
                      if (!item.ok) continue;
                      const key = `${item.data['调度员姓名']}|${item.data['手机号']}|${item.data['所属活动名称']}`;
                      if (seenBatch.has(key)) {
                        item.ok = false;
                        item.reason = '重复';
                      } else {
                        seenBatch.add(key);
                      }
                    }
                    setImportPreview(preview);
                  } catch (err) {
                    alert('读取文件失败，请检查文件格式后重试');
                    setImportPreview([]);
                    setImportTruncated(false);
                  } finally {
                    e.target.value = ''; // 允许再次选同一文件
                  }
                }}
              />
            </label>
          </div>

          {importPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  成功{' '}
                  <span className="font-semibold text-green-700">
                    {importPreview.filter((r) => r.ok).length}
                  </span>{' '}
                  条，失败{' '}
                  <span className="font-semibold text-red-700">
                    {importPreview.filter((r) => !r.ok).length}
                  </span>{' '}
                  条
                </span>
                {importTruncated && (
                  <span className="text-amber-600 text-xs">
                    超过 500 行，仅预览前 500 行
                  </span>
                )}
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {DISPATCHER_IMPORT_HEADERS.map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b border-slate-200"
                        >
                          {h}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 w-40">
                        校验结果
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-b-0">
                        {DISPATCHER_IMPORT_HEADERS.map((h) => (
                          <td
                            key={h}
                            className="px-3 py-2 text-slate-700 align-top whitespace-nowrap max-w-[160px] truncate"
                            title={row.data[h]}
                          >
                            {row.data[h] || '-'}
                          </td>
                        ))}
                        <td className="px-3 py-2 align-top whitespace-nowrap">
                          {row.ok ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              校验通过
                            </span>
                          ) : (
                            <span
                              className="inline-block max-w-[240px] px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 align-top"
                              title={row.reason}
                            >
                              {row.reason ?? '校验失败'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
              disabled={importPreview.length === 0}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2',
                importPreview.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-brand-600 text-white hover:bg-brand-700',
              )}
            >
              <UploadCloud size={18} />
              确认导入
            </button>
          </div>
        </div>
      </Modal>

      {activeModal === 'VEHICLE_DETAIL' && modalData && (
        <VehicleDetail 
          vehicle={modalData as Vehicle} 
          onClose={handleClose} 
        />
      )}

      {activeModal === 'DRIVER_DETAIL' && modalData && (
        <DriverDetail 
          driver={modalData as Driver} 
          onClose={handleClose} 
        />
      )}

      <Modal isOpen={activeModal === 'EDIT_SUPPLIER'} onClose={handleClose} title="编辑供应商" size="xl" helpData={supplierHelpData['H.2.2']}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                供应商名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue={modalData?.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入供应商名称"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                供应商类型 <span className="text-red-500">*</span>
              </label>
              <select
                defaultValue={modalData?.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                required
              >
                <option value="">请选择类型</option>
                <option value="租车公司">租车公司</option>
                <option value="客运公司">客运公司</option>
                <option value="个人车主">个人车主</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                联系人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue={modalData?.contactName || ''}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入联系人姓名"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                联系电话 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                defaultValue={modalData?.contactPhone || ''}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入联系电话"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">备用电话</label>
              <input
                type="tel"
                defaultValue={modalData?.backupPhone || ''}
                onChange={(e) => setFormData({ ...formData, backupPhone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入备用电话"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">信用代码</label>
              <input
                type="text"
                defaultValue={modalData?.creditCode || ''}
                onChange={(e) => setFormData({ ...formData, creditCode: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入统一社会信用代码"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">公司地址</label>
            <input
              type="text"
              defaultValue={modalData?.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
              placeholder="请输入公司地址"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">合作开始日期 <span className="text-red-500">*</span></label>
              <input
                type="date"
                defaultValue={modalData?.contractStartDate || ''}
                onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">合作结束日期</label>
              <input
                type="date"
                defaultValue={modalData?.contractEndDate || ''}
                onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">合同编号</label>
              <input
                type="text"
                defaultValue={modalData?.contractNumber || ''}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="请输入合同编号"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea
              defaultValue={modalData?.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none transition-all"
              placeholder="请输入备注信息"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">附件</label>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-1">合同文件</label>
              <div className="flex gap-2 flex-wrap">
                {contractFiles.map((file, index) => (
                  <div
                    key={file.id || index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <FileText size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...contractFiles];
                        newFiles.splice(index, 1);
                        setContractFiles(newFiles);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setContractFiles([...contractFiles, { id: `cf-${Date.now()}`, fileName: `合同文件${contractFiles.length + 1}.pdf`, filePath: '', fileSize: 0, uploadTime: new Date().toLocaleString(), fileType: 'pdf' }])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-1">资质文件</label>
              <div className="flex gap-2 flex-wrap">
                {qualificationFiles.map((file, index) => (
                  <div
                    key={file.id || index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <FileText size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...qualificationFiles];
                        newFiles.splice(index, 1);
                        setQualificationFiles(newFiles);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setQualificationFiles([...qualificationFiles, { id: `qf-${Date.now()}`, fileName: `资质文件${qualificationFiles.length + 1}.png`, filePath: '', fileSize: 0, uploadTime: new Date().toLocaleString(), fileType: 'png' }])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">其他文件</label>
              <div className="flex gap-2 flex-wrap">
                {otherSupplierFiles.map((file, index) => (
                  <div
                    key={file.id || index}
                    className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <FileText size={24} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...otherSupplierFiles];
                        newFiles.splice(index, 1);
                        setOtherSupplierFiles(newFiles);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOtherSupplierFiles([...otherSupplierFiles, { id: `of-${Date.now()}`, fileName: `其他文件${otherSupplierFiles.length + 1}.pdf`, filePath: '', fileSize: 0, uploadTime: new Date().toLocaleString(), fileType: 'pdf' }])}
                  className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-all">
            保存供应商
          </button>
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
