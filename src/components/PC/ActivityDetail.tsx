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
  Eye
} from 'lucide-react';
import { cn, getTaskAbnormalRules } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import type { Activity, Vehicle, Driver, Task, ActivityPeriod } from '../../types';

interface ActivityDetailProps {
  activity: Activity;
  onClose: () => void;
}

const ActivityDetail: React.FC<ActivityDetailProps> = ({ activity, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'vehicles' | 'drivers' | 'tasks' | 'track'>('info');
  const { tasks, vehicles, drivers, dispatch } = useApp();

  // 获取活动相关的数据
  const activityTasks = tasks.filter(t => t.activityId === activity.id);
  const activityVehicles = vehicles.filter(v => activity.vehicleIds.includes(v.id));
  const activityDrivers = drivers.filter(d => activity.driverIds.includes(d.id));

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
    { id: 'vehicles', label: '关联车辆', icon: Car },
    { id: 'drivers', label: '关联司机', icon: Users },
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
          {activeTab === 'tasks' && (
            <ActivityTasksTab
              tasks={activityTasks}
              vehicles={vehicles}
              drivers={drivers}
              activity={activity}
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
}> = ({ activity, taskStats, auditStats, abnormalTasks, onStartActivity, onEndActivity }) => {
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
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <Play size={18} />
          开始活动
        </button>
      )}
      {activity.period === '执行期' && (
        <button
          onClick={onEndActivity}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <Square size={18} />
          结束活动
        </button>
      )}

      {/* 任务数据统计 */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">任务统计</h3>
        <div className="grid grid-cols-6 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{taskStats.total}</p>
            <p className="text-xs text-slate-500 mt-1">任务总数</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{taskStats.pending}</p>
            <p className="text-xs text-slate-500 mt-1">待派发</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
            <p className="text-xs text-slate-500 mt-1">进行中</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
            <p className="text-xs text-slate-500 mt-1">已完成</p>
          </div>
          <div className="text-center p-4 bg-slate-100 rounded-lg">
            <p className="text-2xl font-bold text-slate-600">{taskStats.cancelled}</p>
            <p className="text-xs text-slate-500 mt-1">已取消</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{taskStats.abnormal}</p>
            <p className="text-xs text-slate-500 mt-1">异常任务</p>
          </div>
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
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm font-bold text-red-600">有新车辆待审核</p>
                <p className="text-2xl font-bold text-red-700 mt-2">{auditStats.pendingVehicles}</p>
                <button className="mt-2 text-sm text-brand-600 font-medium">去审核 →</button>
              </div>
            )}
            {auditStats.pendingDrivers > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
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
}> = ({ vehicles, activity }) => {
  const auditStatusStyles = {
    '待审核': 'bg-amber-100 text-amber-700',
    '审核通过': 'bg-green-100 text-green-700',
    '审核不通过': 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">关联车辆 ({vehicles.length})</h3>
        {activity.period !== '结束期' && (
          <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <UserPlus size={16} />
            关联车辆
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">车牌号</th>
              <th className="px-4 py-3">类型</th>
              <th className="px-4 py-3">品牌</th>
              <th className="px-4 py-3">审核状态</th>
              <th className="px-4 py-3">当前状态</th>
              <th className="px-4 py-3">供应商</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.length > 0 ? vehicles.map(vehicle => (
              <tr key={vehicle.id} className={cn(
                'hover:bg-slate-50/50 transition-colors',
                vehicle.auditStatus === '待审核' && 'bg-amber-50'
              )}>
                <td className="px-4 py-3 font-semibold text-slate-900">{vehicle.plateNumber}</td>
                <td className="px-4 py-3 text-slate-600">{vehicle.type}</td>
                <td className="px-4 py-3 text-slate-600">{vehicle.brand}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', auditStatusStyles[vehicle.auditStatus])}>
                    {vehicle.auditStatus}
                  </span>
                </td>
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
                <td className="px-4 py-3">
                  {vehicle.auditStatus === '待审核' && (
                    <button className="text-brand-600 text-sm font-medium hover:text-brand-700">
                      审核
                    </button>
                  )}
                  {vehicle.auditStatus !== '待审核' && (
                    <button className="text-slate-400 text-sm hover:text-slate-600">
                      取消关联
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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
}> = ({ drivers, activity }) => {
  const auditStatusStyles = {
    '待审核': 'bg-amber-100 text-amber-700',
    '审核通过': 'bg-green-100 text-green-700',
    '审核不通过': 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">关联司机 ({drivers.length})</h3>
        {activity.period !== '结束期' && (
          <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <UserPlus size={16} />
            关联司机
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">手机号</th>
              <th className="px-4 py-3">驾照类型</th>
              <th className="px-4 py-3">审核状态</th>
              <th className="px-4 py-3">当前状态</th>
              <th className="px-4 py-3">供应商</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drivers.length > 0 ? drivers.map(driver => (
              <tr key={driver.id} className={cn(
                'hover:bg-slate-50/50 transition-colors',
                driver.auditStatus === '待审核' && 'bg-amber-50'
              )}>
                <td className="px-4 py-3 font-semibold text-slate-900">{driver.name}</td>
                <td className="px-4 py-3 text-slate-600">{driver.phone}</td>
                <td className="px-4 py-3 text-slate-600">{driver.licenseType}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', auditStatusStyles[driver.auditStatus])}>
                    {driver.auditStatus}
                  </span>
                </td>
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
                <td className="px-4 py-3">
                  {driver.auditStatus === '待审核' && (
                    <button className="text-brand-600 text-sm font-medium hover:text-brand-700">
                      审核
                    </button>
                  )}
                  {driver.auditStatus !== '待审核' && (
                    <button className="text-slate-400 text-sm hover:text-slate-600">
                      取消关联
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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

// 任务列表Tab
const ActivityTasksTab: React.FC<{
  tasks: Task[];
  vehicles: Vehicle[];
  drivers: Driver[];
  activity: Activity;
}> = ({ tasks, vehicles, drivers, activity }) => {
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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">任务列表 ({tasks.length})</h3>
        {activity.period !== '结束期' && (
          <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
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
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filterStatus === '' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          全部
        </button>
        {['待派发', '待接收', '已接收', '执行中', '已完成', '已取消', '已拒绝'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filterStatus === status ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {status}
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
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusStyles[task.status])}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-brand-600 text-sm font-medium hover:text-brand-700">
                        详情
                      </button>
                      {activity.period === '执行期' && task.status === '待派发' && task.vehicleId && task.driverId && (
                        <button className="text-green-600 text-sm font-medium hover:text-green-700">
                          派发
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

// 轨迹大屏Tab
const ActivityTrackTab: React.FC<{
  activity: Activity;
}> = ({ activity }) => {
  return (
    <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl">
      {activity.period === '筹备期' ? (
        <div className="text-center">
          <LayoutDashboard size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">活动尚未开始，暂无轨迹数据</p>
        </div>
      ) : (
        <div className="text-center">
          <LayoutDashboard size={48} className="text-brand-300 mx-auto mb-4" />
          <p className="text-slate-500">轨迹大屏功能开发中...</p>
        </div>
      )}
    </div>
  );
};

export default ActivityDetail;