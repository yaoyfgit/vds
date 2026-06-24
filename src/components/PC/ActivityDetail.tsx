import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Car,
  ClipboardList,
  LayoutDashboard,
  AlertTriangle,
  Clock,
  Play,
  Square,
  UserPlus,
  FileText,
  Eye,
  Building2,
  Phone,
  Plus,
  Maximize2,
  Navigation,
  Map,
  User,
  Edit2,
  Trash2,
  Bell,
  Briefcase
} from 'lucide-react';
import { cn, getTaskAbnormalRules } from '../../lib/utils';
import { useApp, generateId } from '../../context/AppContext';
import type { Activity, Vehicle, Driver, Task, ActivityPeriod, Supplier, WorkGroup } from '../../types';

interface ActivityDetailProps {
  activity: Activity;
  onClose: () => void;
  onNavigateToAudit?: () => void;
  onNavigateToTasks?: (filterStatus?: string) => void;
}

const ActivityDetail: React.FC<ActivityDetailProps> = ({ 
  activity, 
  onClose, 
  onNavigateToAudit,
  onNavigateToTasks
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'suppliers' | 'vehicles' | 'drivers' | 'workgroups' | 'tasks' | 'track'>('info');
  const { tasks, vehicles, drivers, suppliers, workGroups, dispatch } = useApp();

  // 获取活动相关的数据
  const activityTasks = tasks.filter(t => t.activityId === activity.id);
  const activityVehicles = vehicles.filter(v => activity.vehicleIds.includes(v.id));
  const activityDrivers = drivers.filter(d => activity.driverIds.includes(d.id));
  const activityWorkGroups = workGroups.filter(wg => wg.activityId === activity.id);

  // 打开任务详情
  const handleOpenTaskDetail = (task: Task) => {
    dispatch({ type: 'OPEN_MODAL', payload: { type: 'TASK_DETAIL', data: task } });
  };

  // 打开新建任务
  const handleOpenNewTask = () => {
    dispatch({ type: 'OPEN_MODAL', payload: { type: 'NEW_TASK', data: { id: activity.id } } });
  };

  // 任务统计
  const taskStats = {
    total: activityTasks.length,
    pending: activityTasks.filter(t => t.status === '待派发').length,
    inProgress: activityTasks.filter(t => ['待接收', '已接收', '执行中'].includes(t.status)).length,
    completed: activityTasks.filter(t => t.status === '已完成').length,
    cancelled: activityTasks.filter(t => t.status === '已取消').length,
    abnormal: activityTasks.filter(t => t.status === '已拒绝').length,
  };

  // 资源审核统计
  const auditStats = {
    pendingVehicles: activityVehicles.filter(v => v.auditStatus === '待审核').length,
    pendingDrivers: activityDrivers.filter(d => d.auditStatus === '待审核').length,
  };

  // 异常任务列表
  const abnormalTasks = activityTasks.filter(t => t.status === '已拒绝');

  // 时期标签样式
  const periodStyles: Record<ActivityPeriod, string> = {
    '筹备期': 'bg-blue-100 text-blue-700',
    '执行期': 'bg-green-100 text-green-700',
    '结束期': 'bg-slate-100 text-slate-600',
  };

  // 时期提示语
  const periodTips: Record<ActivityPeriod, string> = {
    '筹备期': '活动筹备中，可管理资源与创建任务，暂不可派发',
    '执行期': '活动执行中，可派发任务与实时调度',
    '结束期': '活动已结束',
  };

  // 开始活动
  const handleStartActivity = () => {
    // 校验是否有审核通过的车辆和司机
    const approvedVehicles = activityVehicles.filter(v => v.auditStatus === '审核通过');
    const approvedDrivers = activityDrivers.filter(d => d.auditStatus === '审核通过');
    
    if (approvedVehicles.length === 0 || approvedDrivers.length === 0) {
      alert('活动尚未关联足够的可用资源，请先关联并审核通过至少1辆车和1名司机');
      return;
    }
    
    if (confirm('确认开始活动？进入执行期后可派发任务')) {
      dispatch({
        type: 'UPDATE_ACTIVITY',
        payload: { id: activity.id, data: { period: '执行期', status: '进行中' } }
      });
    }
  };

  // 结束活动
  const handleEndActivity = () => {
    const unfinishedTasks = activityTasks.filter(t => ['待派发', '待接收', '已接收', '执行中'].includes(t.status));
    if (unfinishedTasks.length > 0) {
      alert(`还有 ${unfinishedTasks.length} 个未完成任务，请先处理`);
      return;
    }
    
    if (confirm('确认结束活动？')) {
      dispatch({
        type: 'UPDATE_ACTIVITY',
        payload: { id: activity.id, data: { period: '结束期', status: '已结束' } }
      });
    }
  };

  // Tab配置
  const tabs = [
    { id: 'info', label: '活动信息', icon: FileText },
    { id: 'suppliers', label: '关联供应商', icon: Building2 },
    { id: 'vehicles', label: '关联车辆', icon: Car },
    { id: 'drivers', label: '关联司机', icon: Users },
    { id: 'workgroups', label: '工作小组', icon: Briefcase },
    { id: 'tasks', label: '任务列表', icon: ClipboardList },
    { id: 'track', label: '轨迹大屏', icon: LayoutDashboard },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[90vw] max-w-[1200px] h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">{activity.name}</h2>
            <span className={cn('px-3 py-1 rounded-full text-sm font-semibold', periodStyles[activity.period])}>
              {activity.period}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Period Tip */}
        <div className={cn(
          'px-6 py-3 text-sm font-medium',
          activity.period === '筹备期' ? 'bg-blue-50 text-blue-700' :
          activity.period === '执行期' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600'
        )}>
          {periodTips[activity.period]}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <ActivityInfoTab
              activity={activity}
              taskStats={taskStats}
              auditStats={auditStats}
              abnormalTasks={abnormalTasks}
              onStartActivity={handleStartActivity}
              onEndActivity={handleEndActivity}
              onNavigateToAudit={() => {
                onClose();
                onNavigateToAudit && onNavigateToAudit();
              }}
              onNavigateToTasks={(filterStatus) => {
                onClose();
                onNavigateToTasks && onNavigateToTasks(filterStatus);
              }}
            />
          )}
          {activeTab === 'suppliers' && (
            <ActivitySuppliersTab
              allSuppliers={suppliers}
              activity={activity}
            />
          )}
          {activeTab === 'vehicles' && (
            <ActivityVehiclesTab
              vehicles={activityVehicles}
              activity={activity}
            />
          )}
          {activeTab === 'drivers' && (
            <ActivityDriversTab
              drivers={activityDrivers}
              activity={activity}
            />
          )}
          {activeTab === 'workgroups' && (
            <ActivityWorkGroupsTab
              workGroups={activityWorkGroups}
              activity={activity}
            />
          )}
          {activeTab === 'tasks' && (
            <ActivityTasksTab
              tasks={activityTasks}
              vehicles={vehicles}
              drivers={drivers}
              activity={activity}
              onOpenTaskDetail={handleOpenTaskDetail}
              onOpenNewTask={handleOpenNewTask}
            />
          )}
          {activeTab === 'track' && (
            <ActivityTrackTab activity={activity} />
          )}
        </div>
      </div>
    </div>
  );
};

// 活动信息Tab
const ActivityInfoTab: React.FC<{
  activity: Activity;
  taskStats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    abnormal: number;
  };
  auditStats: {
    pendingVehicles: number;
    pendingDrivers: number;
  };
  abnormalTasks: Task[];
  onStartActivity: () => void;
  onEndActivity: () => void;
  onNavigateToAudit?: () => void;
  onNavigateToTasks?: (filterStatus?: string) => void;
}> = ({ activity, taskStats, auditStats, abnormalTasks, onStartActivity, onEndActivity, onNavigateToAudit, onNavigateToTasks }) => {
  const taskStatItems = [
    { key: 'total', label: '任务总数', value: taskStats.total, color: 'text-slate-900', bg: 'bg-slate-50', filterStatus: '' },
    { key: 'pending', label: '待派发', value: taskStats.pending, color: 'text-amber-600', bg: 'bg-amber-50', filterStatus: '待派发' },
    { key: 'inProgress', label: '进行中', value: taskStats.inProgress, color: 'text-blue-600', bg: 'bg-blue-50', filterStatus: 'inProgress' },
    { key: 'completed', label: '已完成', value: taskStats.completed, color: 'text-green-600', bg: 'bg-green-50', filterStatus: '已完成' },
    { key: 'cancelled', label: '已取消', value: taskStats.cancelled, color: 'text-slate-600', bg: 'bg-slate-100', filterStatus: '已取消' },
    { key: 'abnormal', label: '异常任务', value: taskStats.abnormal, color: 'text-red-600', bg: 'bg-red-50', filterStatus: '已拒绝' },
  ];

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">基本信息</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-slate-500">活动时间：</span>
            <span className="text-slate-900 font-medium">{activity.startTime} ~ {activity.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-slate-400" />
            <span className="text-slate-500">活动地点：</span>
            <span className="text-slate-900 font-medium">{activity.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <span className="text-slate-500">负责人：</span>
            <span className="text-slate-900 font-medium">{activity.managers.join('、')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Car size={16} className="text-slate-400" />
            <span className="text-slate-500">关联车辆：</span>
            <span className="text-slate-900 font-medium">{activity.vehicleIds.length} 辆</span>
          </div>
        </div>
        {activity.description && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">{activity.description}</p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {activity.period === '筹备期' && (
        <button
          onClick={onStartActivity}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Play size={16} />
          开始活动
        </button>
      )}
      {activity.period === '执行期' && (
        <button
          onClick={onEndActivity}
          className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Square size={16} />
          结束活动
        </button>
      )}

      {/* 任务数据统计 */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">任务统计</h3>
        <div className="grid grid-cols-6 gap-4">
          {taskStatItems.map(item => (
            <div 
              key={item.key}
              onClick={() => onNavigateToTasks && onNavigateToTasks(item.filterStatus)}
              className={cn(
                "text-center p-4 rounded-lg cursor-pointer hover:shadow-md transition-all",
                item.bg
              )}
            >
              <p className={cn("text-2xl font-bold", item.color)}>{item.value}</p>
              <p className="text-xs text-slate-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* 异常任务列表 */}
        {abnormalTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} />
              异常任务列表
            </h4>
            <div className="space-y-2">
              {abnormalTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{task.name}</p>
                    <p className="text-xs text-red-600">{task.rejectReason}</p>
                  </div>
                  <button className="text-brand-600 text-sm font-medium flex items-center gap-1">
                    <Eye size={14} />
                    查看
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 资源审核待办 */}
      {activity.period !== '结束期' && (auditStats.pendingVehicles > 0 || auditStats.pendingDrivers > 0) && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            资源审核待办
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {auditStats.pendingVehicles > 0 && (
              <div 
                onClick={() => onNavigateToAudit && onNavigateToAudit()}
                className="p-4 bg-red-50 rounded-lg border border-red-100 cursor-pointer hover:shadow-md transition-all"
              >
                <p className="text-sm font-bold text-red-600">有新车辆待审核</p>
                <p className="text-2xl font-bold text-red-700 mt-2">{auditStats.pendingVehicles}</p>
                <button className="mt-2 text-sm text-brand-600 font-medium">去审核 →</button>
              </div>
            )}
            {auditStats.pendingDrivers > 0 && (
              <div 
                onClick={() => onNavigateToAudit && onNavigateToAudit()}
                className="p-4 bg-red-50 rounded-lg border border-red-100 cursor-pointer hover:shadow-md transition-all"
              >
                <p className="text-sm font-bold text-red-600">有新司机待审核</p>
                <p className="text-2xl font-bold text-red-700 mt-2">{auditStats.pendingDrivers}</p>
                <button className="mt-2 text-sm text-brand-600 font-medium">去审核 →</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 关联车辆Tab
const ActivityVehiclesTab: React.FC<{
  vehicles: Vehicle[];
  activity: Activity;
}> = ({ vehicles }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">关联车辆 ({vehicles.length})</h3>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">车牌号</th>
              <th className="px-4 py-3">类型</th>
              <th className="px-4 py-3">品牌</th>
              <th className="px-4 py-3">荷载人数</th>
              <th className="px-4 py-3">当前状态</th>
              <th className="px-4 py-3">供应商</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.length > 0 ? vehicles.map(vehicle => (
              <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900">{vehicle.plateNumber}</td>
                <td className="px-4 py-3 text-slate-600">{vehicle.type}</td>
                <td className="px-4 py-3 text-slate-600">{vehicle.brand}</td>
                <td className="px-4 py-3 text-slate-600">{vehicle.capacity || '-'}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    vehicle.status === '可调配' ? 'bg-green-100 text-green-700' :
                    vehicle.status === '执行中' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  )}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{vehicle.supplier}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  暂无关联车辆
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 关联司机Tab
const ActivityDriversTab: React.FC<{
  drivers: Driver[];
  activity: Activity;
}> = ({ drivers }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">关联司机 ({drivers.length})</h3>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">手机号</th>
              <th className="px-4 py-3">驾照类型</th>
              <th className="px-4 py-3">当前状态</th>
              <th className="px-4 py-3">供应商</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drivers.length > 0 ? drivers.map(driver => (
              <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900">{driver.name}</td>
                <td className="px-4 py-3 text-slate-600">{driver.phone}</td>
                <td className="px-4 py-3 text-slate-600">{driver.licenseType}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    driver.status === '可调配' ? 'bg-green-100 text-green-700' :
                    driver.status === '执行中' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  )}>
                    {driver.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{driver.supplier}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  暂无关联司机
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 工作小组Tab
const ActivityWorkGroupsTab: React.FC<{
  workGroups: WorkGroup[];
  activity: Activity;
}> = ({ workGroups, activity }) => {
  const { dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingWorkGroup, setEditingWorkGroup] = useState<WorkGroup | null>(null);
  const [formData, setFormData] = useState({
    location: '',
    fieldManager: '',
    fieldManagerPhone: '',
    fieldDispatcher: [] as string[],
    fieldDispatcherPhone: [] as string[]
  });

  const [searchResults, setSearchResults] = useState<{ name: string; phone: string }[]>([]);
  const [searchType, setSearchType] = useState<'manager' | 'dispatcher' | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { drivers } = useApp();

  const handleOpenModal = (workGroup?: WorkGroup) => {
    if (workGroup) {
      setEditingWorkGroup(workGroup);
      setFormData({
        location: workGroup.location,
        fieldManager: workGroup.fieldManager || '',
        fieldManagerPhone: workGroup.fieldManagerPhone || '',
        fieldDispatcher: workGroup.fieldDispatcher || [],
        fieldDispatcherPhone: workGroup.fieldDispatcherPhone || []
      });
    } else {
      setEditingWorkGroup(null);
      setFormData({
        location: '',
        fieldManager: '',
        fieldManagerPhone: '',
        fieldDispatcher: [],
        fieldDispatcherPhone: []
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.location || formData.fieldDispatcher.length === 0 || formData.fieldDispatcherPhone.length === 0) {
      alert('请填写必填项（地点、现场调度员、调度员电话）');
      return;
    }

    if (editingWorkGroup) {
      dispatch({
        type: 'UPDATE_WORK_GROUP',
        payload: {
          id: editingWorkGroup.id,
          data: {
            location: formData.location,
            fieldManager: formData.fieldManager || undefined,
            fieldManagerPhone: formData.fieldManagerPhone || undefined,
            fieldDispatcher: formData.fieldDispatcher,
            fieldDispatcherPhone: formData.fieldDispatcherPhone
          }
        }
      });
    } else {
      dispatch({
        type: 'ADD_WORK_GROUP',
        payload: {
          id: generateId(),
          activityId: activity.id,
          location: formData.location,
          fieldManager: formData.fieldManager || undefined,
          fieldManagerPhone: formData.fieldManagerPhone || undefined,
          fieldDispatcher: formData.fieldDispatcher,
          fieldDispatcherPhone: formData.fieldDispatcherPhone,
          pendingTaskCount: 0,
          createdAt: new Date().toISOString().split('T')[0]
        }
      });
    }

    setShowModal(false);
  };

  const handleDelete = (workGroup: WorkGroup) => {
    if (workGroup.pendingTaskCount > 0) {
      alert(`该工作小组有 ${workGroup.pendingTaskCount} 个待完成任务，无法删除`);
      return;
    }

    if (confirm('确认删除该工作小组？')) {
      dispatch({
        type: 'DELETE_WORK_GROUP',
        payload: { id: workGroup.id }
      });
    }
  };

  // 搜索系统账号
  const handleSearch = (query: string, type: 'manager' | 'dispatcher') => {
    setSearchQuery(query);
    setSearchType(type);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const results = drivers
      .filter(d => 
        d.name.includes(query) || 
        d.phone.includes(query)
      )
      .map(d => ({ name: d.name, phone: d.phone }))
      .slice(0, 5);

    setSearchResults(results);
    setShowSearchDropdown(results.length > 0);
  };

  // 选择搜索结果
  const handleSelectSearchResult = (result: { name: string; phone: string }) => {
    if (searchType === 'manager') {
      setFormData({ ...formData, fieldManager: result.name, fieldManagerPhone: result.phone });
    } else if (searchType === 'dispatcher') {
      // 检查是否已存在
      if (!formData.fieldDispatcher.includes(result.name)) {
        setFormData({
          ...formData,
          fieldDispatcher: [...formData.fieldDispatcher, result.name],
          fieldDispatcherPhone: [...formData.fieldDispatcherPhone, result.phone]
        });
      }
    }
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // 删除调度员
  const handleRemoveDispatcher = (index: number) => {
    setFormData({
      ...formData,
      fieldDispatcher: formData.fieldDispatcher.filter((_, i) => i !== index),
      fieldDispatcherPhone: formData.fieldDispatcherPhone.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">工作小组 ({workGroups.length})</h3>
        {activity.period !== '结束期' && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            新建工作小组
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">活动地点</th>
              <th className="px-4 py-3">现场负责人</th>
              <th className="px-4 py-3">现场调度员</th>
              <th className="px-4 py-3">待完成任务数</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workGroups.length > 0 ? workGroups.map(wg => (
              <tr key={wg.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900">{wg.location}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{wg.fieldManager || '-'}</div>
                  {wg.fieldManagerPhone && (
                    <div className="text-xs text-slate-400">{wg.fieldManagerPhone}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {wg.fieldDispatcher.map((name, i) => (
                    <div key={i} className="text-xs">
                      {name} <span className="text-slate-400">({wg.fieldDispatcherPhone[i]})</span>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    wg.pendingTaskCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  )}>
                    {wg.pendingTaskCount}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {activity.period !== '结束期' && (
                      <>
                        <button
                          onClick={() => handleOpenModal(wg)}
                          className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
                        >
                          <Edit2 size={14} />
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(wg)}
                          className="text-red-600 text-sm font-medium hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  暂无工作小组
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 新建/编辑工作小组弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[500px] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">
                {editingWorkGroup ? '编辑工作小组' : '新建工作小组'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  活动地点 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="请输入活动地点"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  现场负责人
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.fieldManager}
                    onChange={(e) => {
                      setFormData({ ...formData, fieldManager: e.target.value });
                      handleSearch(e.target.value, 'manager');
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                    placeholder="请输入现场负责人姓名（支持搜索系统账号）"
                  />
                  {showSearchDropdown && searchType === 'manager' && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {searchResults.map((result, i) => (
                        <div
                          key={i}
                          onClick={() => handleSelectSearchResult(result)}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                        >
                          <div className="font-medium">{result.name}</div>
                          <div className="text-xs text-slate-500">{result.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  负责人电话
                </label>
                <input
                  type="text"
                  value={formData.fieldManagerPhone}
                  onChange={(e) => setFormData({ ...formData, fieldManagerPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                  placeholder="请输入负责人电话"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  现场调度员 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value, 'dispatcher')}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                    placeholder="请输入现场调度员姓名（支持搜索系统账号）"
                  />
                  {showSearchDropdown && searchType === 'dispatcher' && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {searchResults.map((result, i) => (
                        <div
                          key={i}
                          onClick={() => handleSelectSearchResult(result)}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                        >
                          <div className="font-medium">{result.name}</div>
                          <div className="text-xs text-slate-500">{result.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.fieldDispatcher.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.fieldDispatcher.map((name, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                        <div>
                          <span className="text-sm font-medium">{name}</span>
                          <span className="text-xs text-slate-500 ml-2">({formData.fieldDispatcherPhone[i]})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDispatcher(i)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 任务列表Tab
const ActivityTasksTab: React.FC<{
  tasks: Task[];
  vehicles: Vehicle[];
  drivers: Driver[];
  activity: Activity;
  onOpenTaskDetail?: (task: Task) => void;
  onOpenNewTask?: () => void;
}> = ({ tasks, vehicles, drivers, activity, onOpenTaskDetail, onOpenNewTask }) => {
  const { dispatch } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('');

  const filteredTasks = tasks.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false;
    return true;
  });

  const statusStyles = {
    '待派发': 'bg-amber-100 text-amber-700',
    '待接收': 'bg-indigo-100 text-indigo-700',
    '已接收': 'bg-blue-100 text-blue-700',
    '执行中': 'bg-green-100 text-green-700',
    '已完成': 'bg-slate-100 text-slate-600',
    '已取消': 'bg-slate-100 text-slate-500',
    '已拒绝': 'bg-red-100 text-red-700',
    '待审批': 'bg-yellow-100 text-yellow-700',
    '已暂停': 'bg-orange-100 text-orange-700',
  };

  const getStatusCount = (status: string) => {
    return tasks.filter(t => t.status === status).length;
  };

  const handleRemindTask = (task: Task) => {
    dispatch({ type: 'REMIND_TASK', payload: { id: task.id } });
    alert('已发送提醒');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">任务列表 ({tasks.length})</h3>
        {activity.period !== '结束期' && (
          <button 
            onClick={() => onOpenNewTask && onOpenNewTask()}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <ClipboardList size={16} />
            新建任务
          </button>
        )}
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterStatus('')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative',
            filterStatus === '' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          全部
          <span className={cn(
            'absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center',
            filterStatus === '' ? 'bg-red-500 text-white' : 'bg-brand-500 text-white'
          )}>
            {tasks.length}
          </span>
        </button>
        {['待派发', '待审批', '待接收', '已接收', '执行中', '已暂停', '已完成', '已取消', '已拒绝'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative',
              filterStatus === status ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {status}
            {getStatusCount(status) > 0 && (
              <span className={cn(
                'absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center',
                filterStatus === status ? 'bg-red-500 text-white' : 'bg-brand-500 text-white'
              )}>
                {getStatusCount(status)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">任务名称</th>
              <th className="px-4 py-3">时间</th>
              <th className="px-4 py-3">司机/车辆</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.length > 0 ? filteredTasks.map(task => {
              const driver = drivers.find(d => d.id === task.driverId);
              const vehicle = vehicles.find(v => v.id === task.vehicleId);
              const abnormalRules = getTaskAbnormalRules(task);
              const isAbnormal = abnormalRules.length > 0;
              
              return (
                <tr key={task.id} className={cn(
                  "hover:bg-slate-50/50 transition-colors",
                  isAbnormal && "bg-red-50/50"
                )}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{task.name}</span>
                      {isAbnormal && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">
                          {abnormalRules[0].code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{task.type}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm">
                    {task.date} {task.startTime}-{task.endTime}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm">
                    <div>{driver?.name || '未分配'}</div>
                    <div className="text-xs text-slate-400">{vehicle?.plateNumber || '未分配'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusStyles[task.status] || 'bg-slate-100 text-slate-600')}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onOpenTaskDetail && onOpenTaskDetail(task)}
                        className="text-brand-600 text-sm font-medium hover:text-brand-700"
                      >
                        详情
                      </button>
                      {activity.period === '执行期' && task.status === '待派发' && task.vehicleId && task.driverId && (
                        <button className="text-green-600 text-sm font-medium hover:text-green-700">
                          派发
                        </button>
                      )}
                      {task.status === '待接收' && (
                        <button
                          onClick={() => handleRemindTask(task)}
                          className="text-amber-600 text-sm font-medium hover:text-amber-700 flex items-center gap-1"
                        >
                          <Bell size={14} />
                          提醒接收
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  暂无任务
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 关联供应商Tab
const ActivitySuppliersTab: React.FC<{
  allSuppliers: Supplier[];
  activity: Activity;
}> = ({ allSuppliers, activity }) => {
  const { dispatch, activities, suppliers: contextSuppliers } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  // 从Context中获取最新的活动数据
  const currentActivity = activities.find(a => a.id === activity.id) || activity;
  const suppliers = contextSuppliers.filter(s => (currentActivity.supplierIds || []).includes(s.id));

  // 获取可关联的供应商（合作中且未关联）
  const availableSuppliers = allSuppliers.filter(s => 
    s.status === '合作中' && !suppliers.find(as => as.id === s.id)
  );

  const handleAddSuppliers = () => {
    if (selectedSupplierIds.length === 0) {
      alert('请选择要关联的供应商');
      return;
    }

    dispatch({
      type: 'UPDATE_ACTIVITY',
      payload: {
        id: activity.id,
        data: {
          supplierIds: [...(activity.supplierIds || []), ...selectedSupplierIds]
        }
      }
    });

    setSelectedSupplierIds([]);
    setShowAddModal(false);
  };

  const handleRemoveSupplier = (supplierId: string) => {
    if (confirm('确认取消关联该供应商？')) {
      dispatch({
        type: 'UPDATE_ACTIVITY',
        payload: {
          id: activity.id,
          data: {
            supplierIds: (activity.supplierIds || []).filter(id => id !== supplierId)
          }
        }
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900">已关联供应商</h3>
        {activity.period !== '结束期' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            <Plus size={18} />
            添加供应商
          </button>
        )}
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Building2 size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">暂无关联供应商</p>
          {activity.period !== '结束期' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-brand-600 hover:text-brand-700 font-medium"
            >
              点击添加供应商
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map(supplier => (
            <div
              key={supplier.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-brand-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-slate-900">{supplier.name}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      supplier.status === '合作中' ? "bg-green-100 text-green-700" :
                      supplier.status === '暂停合作' ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {supplier.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      {supplier.type}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <UserPlus size={14} />
                      <span>联系人：{supplier.contactName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>电话：{supplier.contactPhone}</span>
                    </div>
                  </div>
                </div>
                {activity.period !== '结束期' && (
                  <button
                    onClick={() => handleRemoveSupplier(supplier.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="取消关联"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加供应商弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[600px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">选择供应商</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {availableSuppliers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  没有可关联的供应商
                </div>
              ) : (
                <div className="space-y-2">
                  {availableSuppliers.map(supplier => (
                    <label
                      key={supplier.id}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-brand-300 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSupplierIds.includes(supplier.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSupplierIds([...selectedSupplierIds, supplier.id]);
                          } else {
                            setSelectedSupplierIds(selectedSupplierIds.filter(id => id !== supplier.id));
                          }
                        }}
                        className="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{supplier.name}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {supplier.type}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          {supplier.contactName} - {supplier.contactPhone}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleAddSuppliers}
                disabled={selectedSupplierIds.length === 0}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                确定 ({selectedSupplierIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ActivityTrackTab: React.FC<{
  activity: Activity;
}> = ({ activity }) => {
  const { tasks, drivers, vehicles } = useApp();
  const [selectedActivityId, setSelectedActivityId] = useState(activity.id);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  
  // 获取当前活动的执行中任务
  const activeTasks = tasks.filter(t => 
    t.activityId === selectedActivityId && t.status === '执行中'
  );
  
  // 获取在线司机（执行中任务的司机）
  const onlineDrivers = activeTasks.map(task => {
    const driver = drivers.find(d => d.id === task.driverId);
    const vehicle = vehicles.find(v => v.id === task.vehicleId);
    return {
      driver,
      vehicle,
      task,
      isOnline: true
    };
  }).filter(item => item.driver);
  
  // 异常任务数
  const abnormalTasks = activeTasks.filter(t => {
    const now = new Date();
    const taskEndTime = new Date(`${t.date}T${t.endTime}`);
    return now > taskEndTime;
  }).length;

  // 计算最近待办任务（按开始时间距离当前时间最近）
  const upcomingTasks = tasks
    .filter(t => t.driverId && t.status !== '已完成' && t.status !== '已取消' && t.status !== '执行中')
    .map(t => {
      const taskDateTime = new Date(`${t.date}T${t.startTime}`);
      return { task: t, timeDiff: Math.abs(taskDateTime.getTime() - Date.now()) };
    })
    .sort((a, b) => a.timeDiff - b.timeDiff)
    .map(item => item.task);

  // 司机最近待办任务（与该司机相关的）
  const getDriverUpcomingTasks = (driverId: string) => {
    return upcomingTasks.filter(t => t.driverId === driverId);
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* 顶部控制栏 */}
      <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">选择活动</label>
            <select 
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-brand-500"
            >
              {[activity].map(act => (
                <option key={act.id} value={act.id}>{act.name}</option>
              ))}
            </select>
          </div>
          
          <div className="h-8 w-px bg-slate-200"></div>
          
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">执行中任务</p>
              <p className="text-lg font-bold text-brand-600">{activeTasks.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">在线司机</p>
              <p className="text-lg font-bold text-green-600">{onlineDrivers.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">异常任务</p>
              <p className="text-lg font-bold text-red-600">{abnormalTasks}</p>
            </div>
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
          <Maximize2 size={18} />
          全屏模式
        </button>
      </div>
      
      {/* 主体内容 */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* 地图区域 */}
        <div className="flex-1 bg-slate-50 rounded-xl relative overflow-hidden">
          {activity.period === '筹备期' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <LayoutDashboard size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">活动尚未开始，暂无轨迹数据</p>
              </div>
            </div>
          ) : onlineDrivers.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Map size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">暂无执行中的任务</p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 p-4">
              {/* 模拟地图 */}
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-slate-200 relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center opacity-20">
                    <Map size={96} className="text-blue-400 mx-auto mb-4" />
                    <p className="text-slate-500 font-semibold text-lg">轨迹地图</p>
                    <p className="text-slate-400 text-sm mt-2">显示 {onlineDrivers.length} 个执行中司机位置</p>
                  </div>
                </div>
                
                {/* 模拟司机标记 */}
                {onlineDrivers.map((item, index) => {
                  const isAbnormal = item.task.endTime && new Date() > new Date(`${item.task.date}T${item.task.endTime}`);
                  const pos = { 
                    x: 15 + (index % 4) * 25, 
                    y: 15 + Math.floor(index / 4) * 25 
                  };
                  return (
                    <div
                      key={item.driver!.id}
                      onClick={() => {
                        setSelectedDriver(item.driver!);
                      }}
                      className="absolute cursor-pointer transform hover:scale-110 transition-all duration-200 z-10 group"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform transition-transform",
                        isAbnormal ? "bg-red-500 animate-pulse" : "bg-blue-500",
                        selectedDriver?.id === item.driver!.id && "ring-4 ring-white ring-offset-2 scale-110"
                      )}>
                        <Navigation size={22} className="text-white" />
                      </div>
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded-full shadow-sm",
                          selectedDriver?.id === item.driver!.id 
                            ? "bg-brand-600 text-white" 
                            : "bg-white text-slate-700"
                        )}>
                          {item.driver!.name}
                        </span>
                      </div>
                      
                      {/* 状态指示 */}
                      {isAbnormal && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full animate-ping"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* 右侧面板 - 包含司机列表和信息卡片 */}
        <div className="w-96 flex flex-col gap-4">
          {/* 司机列表 */}
          <div className="bg-white rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-brand-600" />
                司机列表
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {onlineDrivers.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">暂无在线司机</p>
                </div>
              ) : (
                onlineDrivers.map((item) => {
                  const isAbnormal = item.task.endTime && new Date() > new Date(`${item.task.date}T${item.task.endTime}`);
                  return (
                    <div
                      key={item.driver!.id}
                      onClick={() => {
                        setSelectedDriver(item.driver!);
                      }}
                      className={cn(
                        "p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                        selectedDriver?.id === item.driver!.id 
                          ? "bg-brand-50 border-brand-200 shadow-sm" 
                          : "bg-slate-50 border-transparent hover:bg-slate-100"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            isAbnormal ? "bg-red-100" : "bg-blue-100"
                          )}>
                            <User size={16} className={cn(
                              isAbnormal ? "text-red-600" : "text-blue-600"
                            )} />
                          </div>
                          <span className="font-medium text-slate-900">{item.driver!.name}</span>
                        </div>
                        {isAbnormal && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                            异常
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-1 font-medium">{item.task.name}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin size={12} />
                        <span className="truncate">{item.task.from} → {item.task.to}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* 司机信息卡片 */}
          {selectedDriver && (
            <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
              {(() => {
                const driverInfo = onlineDrivers.find(d => d.driver?.id === selectedDriver.id);
                if (!driverInfo || !driverInfo.driver) return null;
                
                const { driver, task } = driverInfo;
                const driverUpcomingTasks = getDriverUpcomingTasks(driver!.id);
                const displayTasks = showAllUpcoming ? driverUpcomingTasks : driverUpcomingTasks.slice(0, 2);
                
                return (
                  <>
                    <div className="bg-gradient-to-r from-brand-600 to-blue-600 px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <User size={24} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{driver!.name}</h3>
                          <p className="text-white/70 text-sm">{driver!.phone}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedDriver(null);
                          setShowAllUpcoming(false);
                        }}
                        className="text-white/80 hover:text-white transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {/* 当前任务 */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">当前任务</p>
                        </div>
                        <p className="font-bold text-slate-900 mb-2">{task.name}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-slate-400" />
                            <span>{task.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-slate-400" />
                            <span>{task.startTime} - {task.endTime}</span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                          <MapPin size={14} className="text-brand-500" />
                          <span>{task.from} → {task.to}</span>
                        </div>
                      </div>

                      {/* 最近待办任务 */}
                      {driverUpcomingTasks.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">最近待办任务</p>
                            </div>
                            {driverUpcomingTasks.length > 2 && (
                              <button 
                                onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                                className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                              >
                                {showAllUpcoming ? '收起' : `展开更多`}
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {displayTasks.map((t, idx) => (
                              <div key={t.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-brand-200 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xs font-bold">
                                      {idx + 1}
                                    </span>
                                    <p className="font-medium text-slate-900">{t.name}</p>
                                  </div>
                                  <span className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                    t.status === '待派发' ? "bg-amber-100 text-amber-700" :
                                    t.status === '待接收' ? "bg-blue-100 text-blue-700" :
                                    t.status === '已接收' ? "bg-green-100 text-green-700" :
                                    "bg-slate-100 text-slate-600"
                                  )}>
                                    {t.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {t.date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {t.startTime}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                  <MapPin size={12} />
                                  <span className="truncate">{t.from} → {t.to}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 统计信息 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center border border-green-100">
                          <p className="text-2xl font-bold text-green-600">
                            {tasks.filter(t => t.driverId === driver!.id && t.status === '已完成').length}
                          </p>
                          <p className="text-xs text-green-600 font-medium mt-1">已完成任务</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3 text-center border border-purple-100">
                          <p className="text-2xl font-bold text-purple-600">{driverUpcomingTasks.length}</p>
                          <p className="text-xs text-purple-600 font-medium mt-1">待执行任务</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;