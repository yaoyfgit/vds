import React, { useState } from 'react';
import { 
  Calendar,
  ClipboardList,
  Plus,
  XCircle,
  CheckCircle2,
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Users,
  Car,
  Filter,
  Map,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import type { Task } from '../../types';

interface DispatcherViewProps {
  activeTab?: string;
}

const DispatcherView: React.FC<DispatcherViewProps> = ({ activeTab: externalTab }) => {
  const { tasks, activities, vehicles, drivers, dispatch } = useApp();
  const activeTab = externalTab === 'me' ? 'me' : 'tasks';
  const [selectedActivity, setSelectedActivity] = useState<string>('act-1');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reassignType, setReassignType] = useState<'vehicle' | 'driver'>('vehicle');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('异常');
  const [longPressTask, setLongPressTask] = useState<Task | null>(null);
  let longPressTimer: number | null = null;

  // 当前活动的任务
  const activityTasks = tasks.filter(t => t.activityId === selectedActivity);

  // 统计数据
  const stats = {
    pending: activityTasks.filter(t => t.status === '待派发').length,
    waiting: activityTasks.filter(t => t.status === '待接收').length,
    inProgress: activityTasks.filter(t => t.status === '执行中').length,
    abnormal: activityTasks.filter(t => ['已拒绝', '已取消'].includes(t.status)).length,
    completed: activityTasks.filter(t => t.status === '已完成').length
  };

  // 筛选后的列表
  const filteredTasks = activityTasks.filter(task => {
    if (activeFilter === '异常') return ['已拒绝', '已取消'].includes(task.status);
    if (activeFilter === '待派发') return task.status === '待派发';
    if (activeFilter === '待接收') return task.status === '待接收';
    if (activeFilter === '执行中') return task.status === '执行中';
    if (activeFilter === '已完成') return task.status === '已完成';
    return true;
  }).sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.startTime}`);
    const dateB = new Date(`${b.date} ${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });

  const handleOpenAssign = (task: Task) => {
    setSelectedTask(task);
    setSelectedVehicle(task.vehicleId || '');
    setSelectedDriver(task.driverId || '');
    setShowAssignModal(true);
  };

  const handleAssignAndSend = () => {
    if (!selectedVehicle || !selectedDriver) {
      alert('请选择车辆和司机');
      return;
    }
    const activity = activities.find(a => a.id === selectedTask!.activityId);
    if (activity && activity.period !== '执行期') {
      alert('活动尚未开始，请在执行期派发任务');
      return;
    }
    dispatch({ 
      type: 'ASSIGN_RESOURCE_TO_TASK', 
      payload: { 
        taskId: selectedTask!.id, 
        vehicleId: selectedVehicle, 
        driverId: selectedDriver 
      } 
    });
    dispatch({ 
      type: 'SET_TASK_STATUS', 
      payload: { 
        id: selectedTask!.id, 
        status: '待接收', 
        reason: '任务下发',
        operator: '调度员'
      } 
    });
    setShowAssignModal(false);
    setSelectedTask(null);
  };

  const handleCancelTask = () => {
    if (!cancelReason.trim()) {
      alert('请填写取消原因');
      return;
    }
    dispatch({ 
      type: 'CANCEL_TASK', 
      payload: { id: selectedTask!.id, reason: cancelReason } 
    });
    setCancelReason('');
    setShowCancelModal(false);
    setSelectedTask(null);
  };

  const handleReassign = () => {
    if (reassignType === 'vehicle' && !selectedVehicle) {
      alert('请选择车辆');
      return;
    }
    if (reassignType === 'driver' && !selectedDriver) {
      alert('请选择司机');
      return;
    }
    dispatch({
      type: 'REASSIGN_TASK',
      payload: {
        taskId: selectedTask!.id,
        vehicleId: reassignType === 'vehicle' ? selectedVehicle : undefined,
        driverId: reassignType === 'driver' ? selectedDriver : undefined,
        remark: '调度员改派'
      }
    });
    setShowReassignModal(false);
    setSelectedTask(null);
  };

  // 活动选择器
  const ActivitySelector = () => (
    <div className="bg-white px-4 py-3 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <Calendar size={18} className="text-brand-600" />
        <select
          value={selectedActivity}
          onChange={(e) => setSelectedActivity(e.target.value)}
          className="text-sm font-medium text-slate-900 bg-transparent outline-none cursor-pointer"
        >
          {activities.filter(a => a.status !== '已结束').map(activity => (
            <option key={activity.id} value={activity.id}>
              {activity.name}
            </option>
          ))}
        </select>
        <ChevronRight size={16} className="text-slate-400" />
      </div>
    </div>
  );

  // 任务统计区
  const StatsSection = () => (
    <div className="grid grid-cols-5 gap-2 p-4">
      <button 
        onClick={() => setActiveFilter('待派发')}
        className={cn(
          "bg-white rounded-xl p-3 shadow-sm border transition-all",
          activeFilter === '待派发' ? "border-brand-500 shadow-md shadow-brand-100" : "border-slate-100"
        )}
      >
        <div className="text-xl font-bold text-slate-900">{stats.pending}</div>
        <div className="text-[10px] text-slate-500 mt-1">待派发</div>
      </button>
      <button 
        onClick={() => setActiveFilter('待接收')}
        className={cn(
          "bg-white rounded-xl p-3 shadow-sm border transition-all relative",
          activeFilter === '待接收' ? "border-brand-500 shadow-md shadow-brand-100" : "border-slate-100"
        )}
      >
        <div className="text-xl font-bold text-slate-900">{stats.waiting}</div>
        <div className="text-[10px] text-slate-500 mt-1">待接收</div>
        {stats.waiting > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
            {stats.waiting}
          </span>
        )}
      </button>
      <button 
        onClick={() => setActiveFilter('执行中')}
        className={cn(
          "bg-white rounded-xl p-3 shadow-sm border transition-all",
          activeFilter === '执行中' ? "border-brand-500 shadow-md shadow-brand-100" : "border-slate-100"
        )}
      >
        <div className="text-xl font-bold text-slate-900">{stats.inProgress}</div>
        <div className="text-[10px] text-slate-500 mt-1">执行中</div>
      </button>
      <button 
        onClick={() => setActiveFilter('异常')}
        className={cn(
          "bg-white rounded-xl p-3 shadow-sm border transition-all relative",
          activeFilter === '异常' ? "border-red-500 shadow-md shadow-red-100" : "border-slate-100"
        )}
      >
        <div className="text-xl font-bold text-red-600">{stats.abnormal}</div>
        <div className="text-[10px] text-slate-500 mt-1">异常</div>
        {stats.abnormal > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {stats.abnormal}
          </span>
        )}
      </button>
      <button 
        onClick={() => setActiveFilter('已完成')}
        className={cn(
          "bg-white rounded-xl p-3 shadow-sm border transition-all",
          activeFilter === '已完成' ? "border-brand-500 shadow-md shadow-brand-100" : "border-slate-100"
        )}
      >
        <div className="text-xl font-bold text-green-600">{stats.completed}</div>
        <div className="text-[10px] text-slate-500 mt-1">已完成</div>
      </button>
    </div>
  );

  const handleLongPressStart = (task: Task) => {
    longPressTimer = window.setTimeout(() => {
      setLongPressTask(task);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  const handleQuickAssign = () => {
    if (longPressTask) {
      handleOpenAssign(longPressTask);
      setLongPressTask(null);
    }
  };

  const handleQuickSend = () => {
    if (longPressTask && longPressTask.vehicleId && longPressTask.driverId) {
      const activity = activities.find(a => a.id === longPressTask.activityId);
      if (activity && activity.period !== '执行期') {
        alert('活动尚未开始，请在执行期派发任务');
        return;
      }
      dispatch({ 
        type: 'SET_TASK_STATUS', 
        payload: { 
          id: longPressTask.id, 
          status: '待接收', 
          reason: '任务派发',
          operator: '调度员'
        } 
      });
      setLongPressTask(null);
    }
  };

  const handleQuickCancel = () => {
    if (longPressTask) {
      setSelectedTask(longPressTask);
      setShowCancelModal(true);
      setLongPressTask(null);
    }
  };

  const handleQuickReassign = () => {
    if (longPressTask) {
      setReassignType('vehicle');
      setSelectedVehicle(longPressTask.vehicleId || '');
      setShowReassignModal(true);
      setLongPressTask(null);
    }
  };

  // 任务列表视图
  const TaskListView = () => (
    <div className="px-4 pb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-900">
          {activeFilter === '异常' ? '异常任务' : activeFilter === '待派发' ? '待派发任务' : 
           activeFilter === '待接收' ? '待接收任务' : activeFilter === '执行中' ? '执行中任务' : '已完成任务'}
        </h3>
        <span className="text-xs text-slate-500">{filteredTasks.length}项</span>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-50 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={40} className="text-brand-500" />
          </div>
          <p className="text-slate-500 text-sm">暂无{activeFilter}任务</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => {
            const driver = drivers.find(d => d.id === task.driverId);
            const vehicle = vehicles.find(v => v.id === task.vehicleId);
            const isAbnormal = ['已拒绝', '已取消'].includes(task.status);
            
            return (
              <div 
                key={task.id}
                onClick={() => {
                  handleLongPressEnd();
                  setSelectedTask(task);
                }}
                onTouchStart={() => handleLongPressStart(task)}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
                onMouseDown={() => handleLongPressStart(task)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                className={cn(
                  "bg-white rounded-xl p-3 shadow-sm border cursor-pointer hover:shadow-md transition-all duration-300 min-h-[72px]",
                  isAbnormal ? "border-red-200" : "border-slate-100",
                  isAbnormal && "hover:border-red-400"
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        task.status === '执行中' ? "bg-green-100 text-green-700" :
                        task.status === '已接收' ? "bg-blue-100 text-blue-700" :
                        task.status === '待派发' ? "bg-amber-100 text-amber-700" :
                        task.status === '待接收' ? "bg-indigo-100 text-indigo-700" :
                        task.status === '已拒绝' ? "bg-red-100 text-red-700" :
                        task.status === '已取消' ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-600"
                      )}>{task.status}</span>
                      {isAbnormal && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">
                          {task.status === '已拒绝' ? 'E2' : 'E1'}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-bold text-slate-900 text-sm truncate mb-1">{task.name}</h4>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{task.date === new Date().toISOString().split('T')[0] ? '今日' : task.date}</span>
                      <span>{task.startTime}-{task.endTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      {driver && <span>{driver.name}</span>}
                      {vehicle && <span>· {vehicle.plateNumber}</span>}
                      {!driver && !vehicle && task.status === '待派发' && (
                        <span className="text-red-500 font-medium">未分配</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <MapPin size={14} className="text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // 任务详情
  const TaskDetailView = () => {
    if (!selectedTask) return null;
    
    const driver = drivers.find(d => d.id === selectedTask.driverId);
    const vehicle = vehicles.find(v => v.id === selectedTask.vehicleId);
    const canCancel = ['待派发', '待接收', '已接收'].includes(selectedTask.status);
    const canReassign = ['待接收', '已接收', '已拒绝'].includes(selectedTask.status);
    const canAssign = selectedTask.status === '待派发' && !selectedTask.vehicleId && !selectedTask.driverId;
    const canSend = selectedTask.status === '待派发' && selectedTask.vehicleId && selectedTask.driverId;

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => setSelectedTask(null)}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-brand-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">任务详情</h2>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold",
                selectedTask.status === '执行中' ? "bg-green-100 text-green-700" : 
                selectedTask.status === '已接收' ? "bg-blue-100 text-blue-700" :
                selectedTask.status === '待接收' ? "bg-indigo-100 text-indigo-700" :
                selectedTask.status === '已拒绝' ? "bg-red-100 text-red-700" :
                selectedTask.status === '已取消' ? "bg-slate-100 text-slate-600" : 
                "bg-amber-100 text-amber-700"
              )}>{selectedTask.status}</span>
            </div>
            <span className="text-xs text-slate-400">{selectedTask.date}</span>
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-4">{selectedTask.name}</h3>
          
          <div className="space-y-4 mb-6">
            <div className="flex gap-3">
              <div className="flex flex-col items-center py-1">
                <div className="w-3 h-3 rounded-full bg-brand-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div className="w-0.5 flex-1 bg-gradient-to-b from-brand-300 to-slate-200 my-1" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">出发地</p>
                  <p className="text-sm text-slate-800 font-medium">{selectedTask.from}</p>
                  {selectedTask.fromTime && <p className="text-xs text-slate-400">{selectedTask.fromTime}</p>}
                </div>
                
                {/* 途经点 */}
                {selectedTask.waypoints && selectedTask.waypoints.length > 0 && (
                  <div className="space-y-2">
                    {selectedTask.waypoints.map((waypoint, index) => (
                      <div key={index}>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">途经点 {index + 1}</p>
                        <p className="text-sm text-slate-800 font-medium">{waypoint.name}</p>
                        {waypoint.time && <p className="text-xs text-slate-400">{waypoint.time}</p>}
                      </div>
                    ))}
                  </div>
                )}
                
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">目的地</p>
                  <p className="text-sm text-slate-800 font-medium">{selectedTask.to}</p>
                  {selectedTask.toTime && <p className="text-xs text-slate-400">{selectedTask.toTime}</p>}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-brand-50 to-blue-50 rounded-xl p-3">
                <p className="text-[10px] text-brand-600 uppercase font-bold tracking-wider mb-1">开始时间</p>
                <p className="text-sm font-bold text-slate-900">{selectedTask.startTime}</p>
              </div>
              <div className="bg-gradient-to-br from-brand-50 to-blue-50 rounded-xl p-3">
                <p className="text-[10px] text-brand-600 uppercase font-bold tracking-wider mb-1">结束时间</p>
                <p className="text-sm font-bold text-slate-900">{selectedTask.endTime}</p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedTask.passenger && (
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <Users size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">乘客</p>
                    <p className="text-sm font-medium">{selectedTask.passenger}</p>
                  </div>
                </div>
              )}
              {selectedTask.passengerPhone && (
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <Phone size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">联系电话</p>
                    <a href={`tel:${selectedTask.passengerPhone}`} className="text-sm font-medium text-brand-600 hover:underline">
                      {selectedTask.passengerPhone}
                    </a>
                  </div>
                </div>
              )}
              {selectedTask.passengerCount && (
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <Users size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">人数</p>
                    <p className="text-sm font-medium">{selectedTask.passengerCount}人</p>
                  </div>
                </div>
              )}
            </div>

            {/* 分配信息 */}
            {(vehicle || driver) && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-sm font-bold text-slate-900">分配信息</h4>
                {vehicle && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <Car size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">车辆</p>
                      <p className="text-sm font-medium">{vehicle.plateNumber} · {vehicle.brand}</p>
                    </div>
                  </div>
                )}
                {driver && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <User size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">司机</p>
                      <p className="text-sm font-medium">{driver.name}</p>
                      <a href={`tel:${driver.phone}`} className="text-xs text-brand-600 hover:underline">
                        {driver.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTask.description && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">任务描述</p>
                <p className="text-sm text-slate-700">{selectedTask.description}</p>
              </div>
            )}
          </div>

          {/* 轨迹区域 */}
          {selectedTask.status === '执行中' && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <Map size={16} />
                  实时位置
                </h4>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">定位中</span>
              </div>
              <div className="aspect-video bg-white rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Map size={48} className="text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-green-600">司机实时位置</p>
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 flex-wrap mt-4">
            {canAssign && (
              <button 
                onClick={() => handleOpenAssign(selectedTask)}
                className="flex-1 min-w-[120px] bg-gradient-to-r from-brand-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:from-brand-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-200"
              >
                <CheckCircle2 size={18} />
                分配并下发
              </button>
            )}
            {canSend && (
              <button 
                onClick={() => {
                  const activity = activities.find(a => a.id === selectedTask.activityId);
                  if (activity && activity.period !== '执行期') {
                    alert('活动尚未开始，请在执行期派发任务');
                    return;
                  }
                  dispatch({ 
                    type: 'SET_TASK_STATUS', 
                    payload: { 
                      id: selectedTask.id, 
                      status: '待接收', 
                      reason: '任务派发',
                      operator: '调度员'
                    } 
                  });
                  setSelectedTask({...selectedTask, status: '待接收'});
                }}
                className="flex-1 min-w-[120px] bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-green-200"
              >
                <CheckCircle2 size={18} />
                派发任务
              </button>
            )}
            {selectedTask.status === '待接收' && !selectedTask.vehicleId && (
              <button 
                onClick={() => handleOpenAssign(selectedTask)}
                className="flex-1 min-w-[120px] bg-gradient-to-r from-brand-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:from-brand-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-200"
              >
                <Car size={18} />
                分配车辆
              </button>
            )}
            {canReassign && (
              <button 
                onClick={() => {
                  setReassignType('vehicle');
                  setSelectedVehicle(selectedTask.vehicleId || '');
                  setShowReassignModal(true);
                }}
                className="flex-1 min-w-[120px] bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Car size={18} />
                改派车辆
              </button>
            )}
            {canReassign && (
              <button 
                onClick={() => {
                  setReassignType('driver');
                  setSelectedDriver(selectedTask.driverId || '');
                  setShowReassignModal(true);
                }}
                className="flex-1 min-w-[120px] bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Users size={18} />
                改派司机
              </button>
            )}
            {canCancel && (
              <button 
                onClick={() => setShowCancelModal(true)}
                className="flex-1 min-w-[120px] bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
              >
                <XCircle size={18} />
                取消任务
              </button>
            )}
          </div>
        </div>

        {/* 任务轨迹 */}
        {selectedTask.history && selectedTask.history.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-3">状态变更记录</h4>
            <div className="space-y-3">
              {[...selectedTask.history].reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded",
                        h.status === '执行中' ? "bg-green-100 text-green-700" :
                        h.status === '已接收' ? "bg-blue-100 text-blue-700" :
                        h.status === '待接收' ? "bg-indigo-100 text-indigo-700" :
                        h.status === '待派发' ? "bg-amber-100 text-amber-700" :
                        h.status === '已完成' ? "bg-slate-100 text-slate-600" :
                        "bg-red-100 text-red-700"
                      )}>{h.status}</span>
                      <span className="text-xs text-slate-400">{new Date(h.time).toLocaleString('zh-CN')}</span>
                    </div>
                    {h.remark && (
                      <p className="text-xs text-slate-600 mt-1">{h.remark}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 分配车辆/司机弹窗
  const AssignModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">分配车辆和司机</h3>
          <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
            <XCircle size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择车辆</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
            >
              <option value="">请选择车辆</option>
              {vehicles.filter(v => v.status === '可调配').map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plateNumber} - {vehicle.brand} ({vehicle.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择司机</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
            >
              <option value="">请选择司机</option>
              {drivers.filter(d => d.status === '可调配').map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} - {driver.phone}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAssignAndSend}
            className="w-full bg-gradient-to-r from-brand-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:from-brand-700 hover:to-blue-700 transition-all shadow-md shadow-brand-200"
          >
            确认分配并下发
          </button>
        </div>
      </div>
    </div>
  );

  // 取消任务弹窗
  const CancelModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">取消任务</h3>
          <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600">
            <XCircle size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">取消原因</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="请填写取消原因"
              rows={4}
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 resize-none focus:border-brand-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleCancelTask}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:from-red-600 hover:to-orange-600 transition-all shadow-md shadow-red-200"
          >
            确认取消
          </button>
        </div>
      </div>
    </div>
  );

  // 改派任务弹窗
  const ReassignModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">改派{reassignType === 'vehicle' ? '车辆' : '司机'}</h3>
          <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600">
            <XCircle size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              选择{reassignType === 'vehicle' ? '车辆' : '司机'}
            </label>
            <select
              value={reassignType === 'vehicle' ? selectedVehicle : selectedDriver}
              onChange={(e) => {
                if (reassignType === 'vehicle') {
                  setSelectedVehicle(e.target.value);
                } else {
                  setSelectedDriver(e.target.value);
                }
              }}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
            >
              <option value="">请选择</option>
              {reassignType === 'vehicle' ? (
                vehicles.filter(v => v.status === '可调配').map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber} - {vehicle.brand}
                  </option>
                ))
              ) : (
                drivers.filter(d => d.status === '可调配').map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - {driver.phone}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={handleReassign}
            className="w-full bg-gradient-to-r from-brand-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:from-brand-700 hover:to-blue-700 transition-all shadow-md shadow-brand-200"
          >
            确认改派
          </button>
        </div>
      </div>
    </div>
  );

  // 快速创建任务弹窗
  const CreateTaskModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      type: '接送机',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      from: '',
      to: '',
      passenger: '',
      passengerPhone: '',
      passengerCount: '',
      description: '',
      vehicleId: '',
      driverId: '',
      fieldDispatcher: '当前用户'
    });

    const handleSubmit = () => {
      if (!formData.name || !formData.from || !formData.to) {
        alert('请填写必填项');
        return;
      }

      const isAssigned = formData.vehicleId && formData.driverId;
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        activityId: selectedActivity,
        name: formData.name,
        type: formData.type,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        from: formData.from,
        to: formData.to,
        passenger: formData.passenger,
        passengerPhone: formData.passengerPhone,
        passengerCount: formData.passengerCount ? parseInt(formData.passengerCount) : undefined,
        description: formData.description,
        vehicleId: formData.vehicleId || undefined,
        driverId: formData.driverId || undefined,
        fieldDispatcher: formData.fieldDispatcher,
        status: isAssigned ? '待接收' : '待派发',
        history: [{
          status: isAssigned ? '待接收' : '待派发',
          time: new Date().toISOString(),
          operator: '调度员',
          remark: isAssigned ? '创建任务并分配' : '创建任务'
        }]
      };

      dispatch({ type: 'ADD_TASK', payload: newTask });
      setShowCreateModal(false);
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div className="bg-white rounded-t-3xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">新建任务</h3>
            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
              <XCircle size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">任务名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
                placeholder="请输入任务名称"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">任务类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
                >
                  <option value="接送机">接送机</option>
                  <option value="会议通勤">会议通勤</option>
                  <option value="办事出行">办事出行</option>
                  <option value="考察调研">考察调研</option>
                  <option value="公务用车">公务用车</option>
                  <option value="商务接待">商务接待</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">任务日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">开始时间</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">结束时间</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">出发地 *</label>
              <input
                type="text"
                value={formData.from}
                onChange={(e) => setFormData({...formData, from: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
                placeholder="请输入出发地"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">目的地 *</label>
              <input
                type="text"
                value={formData.to}
                onChange={(e) => setFormData({...formData, to: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
                placeholder="请输入目的地"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">乘车人</label>
                <input
                  type="text"
                  value={formData.passenger}
                  onChange={(e) => setFormData({...formData, passenger: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
                  placeholder="请输入乘车人"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">人数</label>
                <input
                  type="number"
                  value={formData.passengerCount}
                  onChange={(e) => setFormData({...formData, passengerCount: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
                  placeholder="请输入人数"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">分配车辆</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
              >
                <option value="">请选择车辆</option>
                {vehicles.filter(v => v.status === '可调配').map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber} - {vehicle.brand} ({vehicle.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">分配司机</label>
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-brand-500 focus:outline-none"
              >
                <option value="">请选择司机</option>
                {drivers.filter(d => d.status === '可调配').map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - {driver.phone}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-brand-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:from-brand-700 hover:to-blue-700 transition-all shadow-md shadow-brand-200"
            >
              {formData.vehicleId && formData.driverId ? '创建并派发任务' : '创建任务'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 个人页面
  const ProfileView = () => (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-br from-brand-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">陈调度</h3>
            <p className="text-sm text-white/70">现场调度员</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{activityTasks.length}</div>
            <div className="text-xs text-white/70">总任务</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{activityTasks.filter(t => t.status === '执行中').length}</div>
            <div className="text-xs text-white/70">执行中</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{activityTasks.filter(t => t.status === '已完成').length}</div>
            <div className="text-xs text-white/70">已完成</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h4 className="font-bold text-slate-900 mb-4">基本信息</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">所属活动</span>
            <span className="text-sm font-bold text-slate-900">{activities.find(a => a.id === selectedActivity)?.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">联系方式</span>
            <span className="text-sm font-bold text-slate-900">13800001111</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-slate-500">权限级别</span>
            <span className="text-sm font-bold text-green-600">现场调度员</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h4 className="font-bold text-slate-900 mb-4">快捷操作</h4>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-brand-50 text-brand-600 py-3 rounded-xl font-bold text-sm hover:bg-brand-100 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            新建任务
          </button>
          <button className="bg-slate-50 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
            <Filter size={18} />
            任务筛选
          </button>
        </div>
      </div>
    </div>
  );

  // 长按快捷操作菜单
  const QuickActionMenu = () => {
    if (!longPressTask) return null;
    
    const canAssign = longPressTask.status === '待派发' && !longPressTask.vehicleId;
    const canSend = longPressTask.status === '待派发' && longPressTask.vehicleId && longPressTask.driverId;
    const canCancel = ['待派发', '待接收', '已接收'].includes(longPressTask.status);
    const canReassign = ['待接收', '已接收', '已拒绝'].includes(longPressTask.status);
    
    return (
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
        onClick={() => setLongPressTask(null)}
      >
        <div 
          className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-w-[280px]"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-4 py-3 bg-gradient-to-r from-brand-500 to-blue-600">
            <p className="text-white text-sm font-medium text-center">快捷操作</p>
          </div>
          <div className="p-2 space-y-1">
            {canAssign && (
              <button
                onClick={handleQuickAssign}
                className="w-full px-4 py-3 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors flex items-center gap-3"
              >
                <CheckCircle2 size={18} />
                <span className="font-medium">分配车辆/司机</span>
              </button>
            )}
            {canSend && (
              <button
                onClick={handleQuickSend}
                className="w-full px-4 py-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-3"
              >
                <CheckCircle2 size={18} />
                <span className="font-medium">派发任务</span>
              </button>
            )}
            {canReassign && (
              <button
                onClick={handleQuickReassign}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-3"
              >
                <Car size={18} />
                <span className="font-medium">改派</span>
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleQuickCancel}
                className="w-full px-4 py-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-3"
              >
                <XCircle size={18} />
                <span className="font-medium">取消任务</span>
              </button>
            )}
          </div>
          <div className="px-2 pb-2">
            <button
              onClick={() => setLongPressTask(null)}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (selectedTask) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <ActivitySelector />
        <TaskDetailView />
        {showAssignModal && <AssignModal />}
        {showCancelModal && <CancelModal />}
        {showReassignModal && <ReassignModal />}
        <QuickActionMenu />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {activeTab === 'tasks' && (
        <>
          <ActivitySelector />
          <StatsSection />
          <TaskListView />
        </>
      )}
      
      {activeTab === 'me' && (
        <ProfileView />
      )}

      {/* 创建任务按钮 */}
      {activeTab === 'tasks' && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-r from-brand-600 to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:from-brand-700 hover:to-blue-700 transition-all active:scale-95 shadow-brand-200"
        >
          <Plus size={28} />
        </button>
      )}

      {/* 弹窗 */}
      {showCreateModal && <CreateTaskModal />}
      {showAssignModal && <AssignModal />}
      {showCancelModal && <CancelModal />}
      {showReassignModal && <ReassignModal />}
      <QuickActionMenu />
    </div>
  );
};

export default DispatcherView;