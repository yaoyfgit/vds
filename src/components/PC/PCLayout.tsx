import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  ClipboardList, 
  Bell, 
  Search,
  Plus,
  ChevronRight,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Building,
  Eye,
  FileCheck,
  Map
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import ActivityDetail from './ActivityDetail';
import { SuppliersView } from './SupplierDetail';
import VehicleDetail from './VehicleDetail';
import DriverDetail from './DriverDetail';
import AuditManagementView from './AuditManagementView';
import TrackScreen from './TrackScreen';
import type { Activity, Vehicle, Driver } from '../../types';

const PCLayout: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNavigateToAudit?: () => void;
  onNavigateToTasks?: (filterStatus?: string) => void;
}> = ({ activeTab, onTabChange, onNavigateToAudit, onNavigateToTasks }) => {
  const { dispatch } = useApp();

  const navItems = [
    { id: 'activities', label: '活动管理', icon: LayoutDashboard },
    { id: 'tasks', label: '任务调度', icon: ClipboardList },
    { id: 'track', label: '轨迹大屏', icon: Map },
    { id: 'audit', label: '资源审核', icon: FileCheck },
    { id: 'vehicles', label: '车辆管理', icon: Car },
    { id: 'drivers', label: '司机管理', icon: Users },
    { id: 'suppliers', label: '供应商管理', icon: Building },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 text-brand-600">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold">V</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">车辆调度系统</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                activeTab === item.id 
                  ? "bg-brand-50 text-brand-600 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
            <div>
              <p className="text-sm font-semibold text-slate-700">调度员-陈某</p>
              <p className="text-xs text-slate-500">管理员权限</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 text-slate-400">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="搜索活动、任务、车牌..." 
              className="bg-transparent border-none outline-none text-slate-600 w-64 text-sm"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-brand-600 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">3</span>
            </button>
            {activeTab !== 'audit' && activeTab !== 'vehicles' && activeTab !== 'drivers' && (
              <button 
                onClick={() => {
                  if (activeTab === 'activities') {
                    dispatch({ type: 'OPEN_MODAL', payload: { type: 'NEW_ACTIVITY' } });
                  } else if (activeTab === 'tasks') {
                    dispatch({ type: 'OPEN_MODAL', payload: { type: 'NEW_TASK' } });
                  } else if (activeTab === 'suppliers') {
                    dispatch({ type: 'OPEN_MODAL', payload: { type: 'NEW_SUPPLIER' } });
                  }
                }}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-md shadow-brand-100 transition-all"
              >
                <Plus size={18} />
                {activeTab === 'activities' ? '新建活动' : 
                 activeTab === 'tasks' ? '新建任务' : 
                 '新增供应商'}
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className={cn(
          "flex-1 overflow-hidden",
          activeTab === 'track' ? "p-0" : "p-8 overflow-y-auto"
        )}>
          {activeTab === 'activities' && <ActivitiesView 
            onNavigateToAudit={onNavigateToAudit}
            onNavigateToTasks={onNavigateToTasks}
          />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'track' && <TrackScreen />}
          {activeTab === 'audit' && <AuditManagementView />}
          {activeTab === 'vehicles' && <VehiclesView />}
          {activeTab === 'drivers' && <DriversView />}
          {activeTab === 'suppliers' && <SuppliersView />}
        </main>
      </div>
    </div>
  );
};

const ActivitiesView: React.FC<{
  onNavigateToAudit?: () => void;
  onNavigateToTasks?: (filterStatus?: string) => void;
}> = ({ onNavigateToAudit, onNavigateToTasks }) => {
  const { activities } = useApp();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">活动管理</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors">
              <Filter size={16} />
              筛选
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map(activity => (
            <div key={activity.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer"
                 onClick={() => setSelectedActivity(activity)}>
              <div className="flex justify-between items-start mb-4">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold",
                  activity.period === '结束期' ? "bg-slate-100 text-slate-600" :
                  activity.period === '执行期' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                )}>
                  {activity.period}
                </span>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">{activity.name}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{activity.description}</p>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-400">活动时间:</span>
                  <span>{activity.startTime} ~ {activity.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-400">活动地点:</span>
                  <span>{activity.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-slate-400">负责人:</span>
                  <span>{activity.managers.join('、')}</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                <div className="flex -space-x-2">
                  {activity.managers.slice(0, 3).map((manager, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-brand-100 border-2 border-white flex items-center justify-center text-[10px] text-brand-600 font-medium">
                      {manager.charAt(0)}
                    </div>
                  ))}
                  {activity.managers.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] text-slate-400">
                      +{activity.managers.length - 3}
                    </div>
                  )}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedActivity(activity);
                  }}
                  className="text-brand-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  查看详情 <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedActivity && (
        <ActivityDetail 
          activity={selectedActivity} 
          onClose={() => setSelectedActivity(null)}
          onNavigateToAudit={onNavigateToAudit}
          onNavigateToTasks={onNavigateToTasks}
        />
      )}
    </>
  );
};

const TasksView = () => {
  const { tasks, vehicles, drivers, activities, dispatch } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterActivity, setFilterActivity] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterDispatcher, setFilterDispatcher] = useState<string>('');
  const [filterAbnormal, setFilterAbnormal] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const uniqueDispatchers = [...new Set(tasks.map(t => t.fieldDispatcher).filter(Boolean))];

  const filteredTasks = tasks.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterActivity && task.activityId !== filterActivity) return false;
    if (filterDate && task.date !== filterDate) return false;
    if (filterDispatcher && task.fieldDispatcher !== filterDispatcher) return false;
    if (filterAbnormal === 'abnormal') {
      return task.status === '已拒绝' || task.status === '已取消';
    }
    if (filterAbnormal === 'normal') {
      return task.status !== '已拒绝' && task.status !== '已取消';
    }
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      const vehicle = vehicles.find(v => v.id === task.vehicleId);
      const driver = drivers.find(d => d.id === task.driverId);
      const matchName = task.name.toLowerCase().includes(keyword);
      const matchVehicle = vehicle?.plateNumber?.toLowerCase().includes(keyword) || 
                           vehicle?.brand?.toLowerCase().includes(keyword);
      const matchDriver = driver?.name?.toLowerCase().includes(keyword) || 
                          driver?.phone?.toLowerCase().includes(keyword);
      return matchName || matchVehicle || matchDriver;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">任务调度</h2>

      <div className="flex gap-4 flex-wrap">
        <div className="w-64">
          <label className="block text-sm font-medium text-slate-700 mb-1">搜索</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="任务名称、车辆、司机"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
            />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-slate-700 mb-1">状态筛选</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
          >
            <option value="">全部状态</option>
            <option value="待派发">待派发</option>
            <option value="待接收">待接收</option>
            <option value="已接收">已接收</option>
            <option value="执行中">执行中</option>
            <option value="已完成">已完成</option>
            <option value="已取消">已取消</option>
            <option value="已拒绝">已拒绝</option>
          </select>
        </div>
        <div className="w-56">
          <label className="block text-sm font-medium text-slate-700 mb-1">所属活动</label>
          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
          >
            <option value="">全部活动</option>
            {activities.map(act => (
              <option key={act.id} value={act.id}>{act.name}</option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-slate-700 mb-1">任务日期</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
          />
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-slate-700 mb-1">现场调度员</label>
          <select
            value={filterDispatcher}
            onChange={(e) => setFilterDispatcher(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
          >
            <option value="">全部调度员</option>
            {uniqueDispatchers.map(dispatcher => (
              <option key={dispatcher} value={dispatcher}>{dispatcher}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium text-slate-700 mb-1">异常状态</label>
          <select
            value={filterAbnormal}
            onChange={(e) => setFilterAbnormal(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
          >
            <option value="">全部</option>
            <option value="abnormal">仅异常</option>
            <option value="normal">仅正常</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">任务名称</th>
              <th className="px-6 py-4">任务类型</th>
              <th className="px-6 py-4">时间/地点</th>
              <th className="px-6 py-4">乘车人</th>
              <th className="px-6 py-4">车辆/司机</th>
              <th className="px-6 py-4">现场调度员</th>
              <th className="px-6 py-4">状态</th>
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => {
                const vehicle = vehicles.find(v => v.id === task.vehicleId);
                const driver = drivers.find(d => d.id === task.driverId);
                const activity = activities.find(a => a.id === task.activityId);
                return (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{task.name}</div>
                      <div className="text-xs text-slate-400">{activity?.name || '未关联活动'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{task.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{task.date} {task.startTime}-{task.endTime}</div>
                      <div className="text-xs text-slate-400">{task.from} → {task.to}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{task.passenger || '未填写'}</div>
                      {task.passengerPhone && (
                        <div className="text-xs text-slate-400">{task.passengerPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">{vehicle?.plateNumber || '未分配'}</div>
                      <div className="text-xs text-slate-400">{driver?.name || '未分配'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{task.fieldDispatcher || '未指定'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight",
                        task.status === '执行中' ? "bg-green-100 text-green-700" : 
                        task.status === '待接收' ? "bg-blue-100 text-blue-700" :
                        task.status === '已接收' ? "bg-purple-100 text-purple-700" :
                        task.status === '已完成' ? "bg-slate-200 text-slate-700" :
                        task.status === '已取消' ? "bg-red-100 text-red-700" :
                        task.status === '已拒绝' ? "bg-orange-100 text-orange-700" :
                        "bg-yellow-100 text-yellow-700"
                      )}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'TASK_DETAIL', data: task } })}
                        className="text-brand-600 hover:text-brand-700 text-sm font-bold"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  暂无任务数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const VehiclesView = () => {
  const { vehicles, activities, dispatch } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSupplier, setFilterSupplier] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterAuditStatus, setFilterAuditStatus] = useState<string>('');
  const [filterActivity, setFilterActivity] = useState<string>('');
  const [filterPlateNumber, setFilterPlateNumber] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const filteredVehicles = vehicles.filter(v => {
    if (filterStatus && v.status !== filterStatus) return false;
    if (filterSupplier && v.supplier !== filterSupplier) return false;
    if (filterType && v.type !== filterType) return false;
    if (filterAuditStatus && v.auditStatus !== filterAuditStatus) return false;
    if (filterActivity && v.activityId !== filterActivity) return false;
    if (filterPlateNumber && !v.plateNumber.toLowerCase().includes(filterPlateNumber.toLowerCase())) return false;
    return true;
  });

  const auditStatusStyles = {
    '待审核': 'bg-amber-100 text-amber-700',
    '审核通过': 'bg-green-100 text-green-700',
    '审核不通过': 'bg-red-100 text-red-700',
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">车辆管理</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'NEW_VEHICLE' } })}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              新增车辆
            </button>
            <button className="text-slate-600 hover:text-slate-800 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium flex items-center gap-2">
              批量导入
            </button>
            <button className="text-slate-600 hover:text-slate-800 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium flex items-center gap-2">
              下载模板
            </button>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">车牌号搜索</label>
            <input
              type="text"
              value={filterPlateNumber}
              onChange={(e) => setFilterPlateNumber(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
              placeholder="输入车牌号"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">状态筛选</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">全部状态</option>
              <option value="可调配">可调配</option>
              <option value="已调度">已调度</option>
              <option value="执行中">执行中</option>
              <option value="不可用">不可用</option>
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">审核状态</label>
            <select
              value={filterAuditStatus}
              onChange={(e) => setFilterAuditStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">全部审核状态</option>
              <option value="待审核">待审核</option>
              <option value="审核通过">审核通过</option>
              <option value="审核不通过">审核不通过</option>
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">所属活动</label>
            <select
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">全部活动</option>
              {activities.filter(a => a.period !== '结束期').map(activity => (
                <option key={activity.id} value={activity.id}>{activity.name}</option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">供应商筛选</label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">全部供应商</option>
              {[...new Set(vehicles.map(v => v.supplier))].map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">车型筛选</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">全部车型</option>
              <option value="轿车">轿车</option>
              <option value="SUV">SUV</option>
              <option value="商务车">商务车</option>
              <option value="中巴">中巴</option>
              <option value="大巴">大巴</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">车牌号</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">车型</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">品牌</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">座位</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">驾照</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">供应商</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">审核状态</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredVehicles.map(vehicle => (
                  <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{vehicle.plateNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {vehicle.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{vehicle.brand}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{vehicle.capacity}座</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{vehicle.licenseRequired}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{vehicle.supplier}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        auditStatusStyles[vehicle.auditStatus]
                      )}>
                        {vehicle.auditStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        vehicle.status === '可调配' ? "bg-green-100 text-green-800" :
                        vehicle.status === '已调度' ? "bg-blue-100 text-blue-800" :
                        vehicle.status === '执行中' ? "bg-blue-100 text-blue-800" : 
                        "bg-red-100 text-red-800"
                      )}>
                        {vehicle.status}
                      </span>
                      {vehicle.unavailableReason && vehicle.status === '不可用' && (
                        <div className="text-xs text-red-600 mt-1">{vehicle.unavailableReason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="text-brand-600 hover:text-brand-800 flex items-center gap-1"
                        >
                          <Eye size={14} />
                          详情
                        </button>
                        {(vehicle.auditStatus === '待审核' || vehicle.auditStatus === '审核不通过') && (
                          <button
                            onClick={() => {
                              dispatch({ type: 'OPEN_MODAL', payload: { type: 'EDIT_VEHICLE', data: vehicle } });
                            }}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Edit2 size={14} />
                            编辑
                          </button>
                        )}
                        {vehicle.status === '可调配' && (
                          <button
                            onClick={() => {
                              dispatch({ type: 'OPEN_MODAL', payload: { type: 'SET_VEHICLE_UNAVAILABLE', data: vehicle } });
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            设为不可用
                          </button>
                        )}
                        {vehicle.status === '不可用' && (
                          <button
                            onClick={() => {
                              dispatch({ type: 'SET_VEHICLE_AVAILABLE', payload: { id: vehicle.id } });
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            恢复可用
                          </button>
                        )}
                        <button
                          onClick={() => {
                            dispatch({ type: 'OPEN_MODAL', payload: { type: 'DELETE_VEHICLE', data: vehicle } });
                          }}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVehicles.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              暂无车辆数据
            </div>
          )}
        </div>
      </div>

      {selectedVehicle && (
        <VehicleDetail
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </>
  );
};

const DriversView = () => {
  const { drivers, activities, dispatch } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>('');
  const [activityFilter, setActivityFilter] = useState<string>('');
  const [nameFilter, setNameFilter] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const uniqueSuppliers = [...new Set(drivers.map(d => d.supplier).filter(Boolean))];

  const filteredDrivers = drivers.filter(driver => {
    if (statusFilter && driver.status !== statusFilter) return false;
    if (supplierFilter && driver.supplier !== supplierFilter) return false;
    if (auditStatusFilter && driver.auditStatus !== auditStatusFilter) return false;
    if (activityFilter && driver.activityId !== activityFilter) return false;
    if (nameFilter && !driver.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    return true;
  });

  const auditStatusStyles = {
    '待审核': 'bg-amber-100 text-amber-700',
    '审核通过': 'bg-green-100 text-green-700',
    '审核不通过': 'bg-red-100 text-red-700',
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">司机管理</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'NEW_DRIVER' } })}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              新增司机
            </button>
            <button className="text-slate-600 hover:text-slate-800 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium flex items-center gap-2">
              批量导入
            </button>
            <button className="text-slate-600 hover:text-slate-800 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium flex items-center gap-2">
              下载模板
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">司机名称搜索</label>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
              placeholder="输入司机名称"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">状态筛选</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">全部状态</option>
              <option value="可调配">可调配</option>
              <option value="已调度">已调度</option>
              <option value="执行中">执行中</option>
              <option value="不可用">不可用</option>
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">审核状态</label>
            <select
              value={auditStatusFilter}
              onChange={(e) => setAuditStatusFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">全部审核状态</option>
              <option value="待审核">待审核</option>
              <option value="审核通过">审核通过</option>
              <option value="审核不通过">审核不通过</option>
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">所属活动</label>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
            >
              <option value="">全部活动</option>
              {activities.filter(a => a.period !== '结束期').map(activity => (
                <option key={activity.id} value={activity.id}>{activity.name}</option>
              ))}
            </select>
          </div>
          {uniqueSuppliers.length > 0 && (
            <div className="w-48">
              <label className="block text-sm font-medium text-slate-700 mb-1">供应商筛选</label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
              >
                <option value="">全部供应商</option>
                {uniqueSuppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">司机</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">电话</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">驾照</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">供应商</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">审核状态</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredDrivers.map(driver => (
                  <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 font-bold text-sm">
                          {driver.name.charAt(0)}
                        </div>
                        <div className="text-sm font-medium text-slate-900">{driver.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{driver.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{driver.licenseType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{driver.supplier}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        auditStatusStyles[driver.auditStatus]
                      )}>
                        {driver.auditStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        driver.status === '可调配' ? "bg-green-100 text-green-800" :
                        driver.status === '已调度' ? "bg-blue-100 text-blue-800" :
                        driver.status === '执行中' ? "bg-blue-100 text-blue-800" : 
                        "bg-red-100 text-red-800"
                      )}>
                        {driver.status}
                      </span>
                      {driver.unavailableReason && driver.status === '不可用' && (
                        <div className="text-xs text-red-600 mt-1">{driver.unavailableReason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDriver(driver)}
                          className="text-brand-600 hover:text-brand-800 flex items-center gap-1"
                        >
                          <Eye size={14} />
                          详情
                        </button>
                        {(driver.auditStatus === '待审核' || driver.auditStatus === '审核不通过') && (
                          <button
                            onClick={() => {
                              dispatch({ type: 'OPEN_MODAL', payload: { type: 'EDIT_DRIVER', data: driver } });
                            }}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Edit2 size={14} />
                            编辑
                          </button>
                        )}
                        {driver.status === '可调配' && (
                          <button
                            onClick={() => {
                              dispatch({ type: 'OPEN_MODAL', payload: { type: 'SET_DRIVER_UNAVAILABLE', data: driver } });
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            设为不可用
                          </button>
                        )}
                        {driver.status === '不可用' && (
                          <button
                            onClick={() => {
                              dispatch({ type: 'SET_DRIVER_AVAILABLE', payload: { id: driver.id } });
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            恢复可用
                          </button>
                        )}
                        <button
                          onClick={() => {
                            dispatch({ type: 'OPEN_MODAL', payload: { type: 'DELETE_DRIVER', data: driver } });
                          }}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredDrivers.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              暂无司机数据
            </div>
          )}
        </div>
      </div>

      {selectedDriver && (
        <DriverDetail
          driver={selectedDriver}
          onClose={() => setSelectedDriver(null)}
        />
      )}
    </>
  );
};

export default PCLayout;
