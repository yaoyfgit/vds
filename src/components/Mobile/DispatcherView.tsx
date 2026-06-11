import React, { useState } from 'react';
import { 
  Calendar,
  ClipboardList,
  Plus,
  XCircle,
  CheckCircle2,
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  User,
  Users,
  Car,
  AlertCircle,
  Filter
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import type { Task } from '../../types';

interface DispatcherViewProps {
  activeTab?: string;
}

const DispatcherView: React.FC<DispatcherViewProps> = ({ activeTab: externalTab }) => {
  const { tasks, activities, vehicles, drivers, dispatch } = useApp();
  const activeTab = externalTab === 'board' ? 'board' : 'list';
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
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // 当前活动的任务
  const activityTasks = tasks.filter(t => t.activityId === selectedActivity);

  // 按状态分组
  const tasksByStatus = {
    '待派发': activityTasks.filter(t => t.status === '待派发'),
    '待接收': activityTasks.filter(t => t.status === '待接收'),
    '已接收': activityTasks.filter(t => t.status === '已接收'),
    '执行中': activityTasks.filter(t => t.status === '执行中'),
    '异常': activityTasks.filter(t => t.status === '已拒绝' || t.status === '已取消'),
    '已完成': activityTasks.filter(t => t.status === '已完成')
  };

  // 筛选后的列表
  const filteredTasks = activityTasks.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterDate && task.date !== filterDate) return false;
    return true;
  }).sort((a, b) => {
    const statusPriority: Record<string, number> = {
      '执行中': 0,
      '已接收': 1,
      '待接收': 2,
      '已拒绝': 3,
      '已完成': 4,
      '待派发': 5,
      '已取消': 6
    };
    
    const priorityA = statusPriority[a.status] ?? 10;
    const priorityB = statusPriority[b.status] ?? 10;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
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
      </div>
    </div>
  );

  // 任务看板视图
  const BoardView = () => (
    <div className="p-4 space-y-4">
      {/* 待派发 */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="font-bold text-slate-900">待派发</h3>
          </div>
          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
            {tasksByStatus.待派发.length}
          </span>
        </div>
        {tasksByStatus.待派发.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">暂无待派发任务</p>
        ) : (
          <div className="space-y-2">
            {tasksByStatus.待派发.map(task => (
              <div 
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-slate-900">{task.name}</h4>
                  <span className="text-xs text-slate-400">{task.startTime}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin size={12} />
                  <span>{task.from} → {task.to}</span>
                </div>
                {!task.vehicleId || !task.driverId ? (
                  <div className="mt-2 flex items-center gap-1">
                    <AlertCircle size={12} className="text-red-500" />
                    <span className="text-xs text-red-600 font-medium">
                      {!task.vehicleId ? '未分配车辆' : ''}
                      {!task.vehicleId && !task.driverId ? '、' : ''}
                      {!task.driverId ? '未分配司机' : ''}
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-green-500" />
                    <span className="text-xs text-green-600 font-medium">已分配车辆和司机</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 待接收 */}
      <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <h3 className="font-bold text-slate-900">待接收</h3>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
            {tasksByStatus.待接收.length}
          </span>
        </div>
        {tasksByStatus.待接收.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">暂无待接收任务</p>
        ) : (
          <div className="space-y-2">
            {tasksByStatus.待接收.map(task => {
              const driver = drivers.find(d => d.id === task.driverId);
              const vehicle = vehicles.find(v => v.id === task.vehicleId);
              return (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-slate-900">{task.name}</h4>
                    <span className="text-xs text-slate-400">{task.startTime}</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <User size={12} />
                      <span>{driver?.name || '未分配'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car size={12} />
                      <span>{vehicle?.plateNumber || '未分配'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 已接收 */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="font-bold text-slate-900">已接收</h3>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            {tasksByStatus.已接收.length}
          </span>
        </div>
        {tasksByStatus.已接收.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">暂无已接收任务</p>
        ) : (
          <div className="space-y-2">
            {tasksByStatus.已接收.map(task => {
              const driver = drivers.find(d => d.id === task.driverId);
              const vehicle = vehicles.find(v => v.id === task.vehicleId);
              return (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-slate-900">{task.name}</h4>
                    <span className="text-xs text-slate-400">{task.startTime}</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <User size={12} />
                      <span>{driver?.name || '未分配'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car size={12} />
                      <span>{vehicle?.plateNumber || '未分配'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 执行中 */}
      <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h3 className="font-bold text-slate-900">执行中</h3>
          </div>
          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
            {tasksByStatus.执行中.length}
          </span>
        </div>
        {tasksByStatus.执行中.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">暂无执行中任务</p>
        ) : (
          <div className="space-y-2">
            {tasksByStatus.执行中.map(task => {
              const driver = drivers.find(d => d.id === task.driverId);
              const vehicle = vehicles.find(v => v.id === task.vehicleId);
              return (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-slate-900">{task.name}</h4>
                    <span className="text-xs text-slate-400">{task.startTime}</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <User size={12} />
                      <span>{driver?.name || '未分配'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car size={12} />
                      <span>{vehicle?.plateNumber || '未分配'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 异常 */}
      <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h3 className="font-bold text-slate-900">异常</h3>
          </div>
          <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
            {tasksByStatus.异常.length}
          </span>
        </div>
        {tasksByStatus.异常.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">无异常任务</p>
        ) : (
          <div className="space-y-2">
            {tasksByStatus.异常.map(task => (
              <div 
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-md transition-all border-l-4 border-red-500"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-slate-900">{task.name}</h4>
                  <span className="text-xs text-slate-400">{task.startTime}</span>
                </div>
                <div className="mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                    {task.status}
                  </span>
                </div>
                {(task.rejectReason || task.cancelReason) && (
                  <p className="text-xs text-red-600 mt-2 line-clamp-2">
                    {task.rejectReason || task.cancelReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 已完成 */}
      <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h3 className="font-bold text-slate-900">已完成</h3>
          </div>
          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
            {tasksByStatus.已完成.length}
          </span>
        </div>
        <p className="text-sm text-slate-500 text-center py-2">
          今日已完成 {tasksByStatus.已完成.length} 个任务
        </p>
      </div>
    </div>
  );

  // 任务列表视图
  const ListView = () => (
    <div className="p-4 space-y-4">
      {/* 筛选栏 */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-700">筛选</span>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 text-sm p-2 rounded-lg border border-slate-200 bg-slate-50"
          >
            <option value="">全部状态</option>
            <option value="待派发">待派发</option>
            <option value="待接收">待接收</option>
            <option value="已接收">已接收</option>
            <option value="执行中">执行中</option>
            <option value="已完成">已完成</option>
            <option value="已拒绝">已拒绝</option>
            <option value="已取消">已取消</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="flex-1 text-sm p-2 rounded-lg border border-slate-200 bg-slate-50"
          />
        </div>
      </div>

      {/* 任务列表 */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">暂无任务</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const driver = drivers.find(d => d.id === task.driverId);
            const vehicle = vehicles.find(v => v.id === task.vehicleId);
            return (
              <div 
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold",
                      task.status === '执行中' ? "bg-green-100 text-green-700" :
                      task.status === '已接收' ? "bg-blue-100 text-blue-700" :
                      task.status === '待派发' ? "bg-amber-100 text-amber-700" :
                      task.status === '待接收' ? "bg-indigo-100 text-indigo-700" :
                      task.status === '已拒绝' ? "bg-red-100 text-red-700" :
                      task.status === '已取消' ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-600"
                    )}>{task.status}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{task.date}</span>
                </div>
                
                <h4 className="text-lg font-bold text-slate-900 mb-3">{task.name}</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                    <Clock size={14} className="text-brand-500" />
                    <span className="text-sm font-medium text-slate-700">{task.startTime} - {task.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                    <MapPin size={14} className="text-brand-500" />
                    <span className="text-sm font-medium text-slate-700">{task.from} → {task.to}</span>
                  </div>
                  {driver && (
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                      <User size={14} className="text-brand-500" />
                      <span className="text-sm font-medium text-slate-700">{driver.name}</span>
                    </div>
                  )}
                  {vehicle && (
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                      <Car size={14} className="text-brand-500" />
                      <span className="text-sm font-medium text-slate-700">{vehicle.plateNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
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
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">任务详情</h2>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full",
                selectedTask.status === '执行中' ? "bg-green-500" : 
                selectedTask.status === '已接收' ? "bg-blue-500" :
                selectedTask.status === '待接收' ? "bg-amber-500" :
                selectedTask.status === '已拒绝' ? "bg-red-500" :
                selectedTask.status === '已取消' ? "bg-slate-400" : "bg-slate-400"
              )} />
              <span className="text-sm font-bold text-slate-700">{selectedTask.status}</span>
            </div>
            <span className="text-xs text-slate-400">{selectedTask.date}</span>
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-6">{selectedTask.name}</h3>
          
          <div className="space-y-6 mb-6">
            <div className="flex gap-3">
              <div className="flex flex-col items-center py-1">
                <div className="w-2 h-2 rounded-full border-2 border-brand-500" />
                <div className="w-0.5 flex-1 bg-slate-100 my-1" />
                <div className="w-2 h-2 rounded-full bg-slate-300" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">出发地</p>
                  <p className="text-sm text-slate-700 font-medium">{selectedTask.from}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">目的地</p>
                  <p className="text-sm text-slate-700 font-medium">{selectedTask.to}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">开始时间</p>
                <p className="text-sm font-bold text-slate-900">{selectedTask.startTime}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">结束时间</p>
                <p className="text-sm font-bold text-slate-900">{selectedTask.endTime}</p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedTask.passenger && (
                <div className="flex items-center gap-3 text-slate-600">
                  <User size={16} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">乘客</p>
                    <p className="text-sm font-medium">{selectedTask.passenger}</p>
                  </div>
                </div>
              )}
              {selectedTask.passengerPhone && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone size={16} className="text-slate-400" />
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
                  <Users size={16} className="text-slate-400" />
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
                    <Car size={16} className="text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400">车辆</p>
                      <p className="text-sm font-medium">{vehicle.plateNumber} · {vehicle.brand}</p>
                    </div>
                  </div>
                )}
                {driver && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <User size={16} className="text-slate-400" />
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

          {/* 操作按钮 */}
          <div className="flex gap-3 flex-wrap">
            {canAssign && (
              <button 
                onClick={() => handleOpenAssign(selectedTask)}
                className="flex-1 min-w-[120px] bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                分配并下发
              </button>
            )}
            {canSend && (
              <button 
                onClick={() => {
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
                className="flex-1 min-w-[120px] bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                派发任务
              </button>
            )}
            {selectedTask.status === '待接收' && !selectedTask.vehicleId && (
              <button 
                onClick={() => handleOpenAssign(selectedTask)}
                className="flex-1 min-w-[120px] bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
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
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4">任务轨迹</h4>
            <div className="space-y-3">
              {selectedTask.history.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">{h.status}</p>
                      <p className="text-xs text-slate-400">{new Date(h.time).toLocaleString('zh-CN')}</p>
                    </div>
                    {h.operator && (
                      <p className="text-xs text-slate-500 mt-1">操作人：{h.operator}</p>
                    )}
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
      <div className="bg-white rounded-t-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
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
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
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
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
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
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-all"
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
      <div className="bg-white rounded-t-2xl w-full max-w-md p-6">
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
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 resize-none"
            />
          </div>

          <button
            onClick={handleCancelTask}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
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
      <div className="bg-white rounded-t-2xl w-full max-w-md p-6">
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
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
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
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-all"
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
      driverId: ''
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
        <div className="bg-white rounded-t-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
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
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
                placeholder="请输入任务名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">任务类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">任务日期 *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">类型</label>
                <div className="text-sm text-slate-500 pt-3">{formData.type}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">开始时间 *</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">结束时间 *</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">出发地 *</label>
              <input
                type="text"
                value={formData.from}
                onChange={(e) => setFormData({...formData, from: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
                placeholder="请输入出发地"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">目的地 *</label>
              <input
                type="text"
                value={formData.to}
                onChange={(e) => setFormData({...formData, to: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
                placeholder="请输入目的地"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">乘车人</label>
              <input
                type="text"
                value={formData.passenger}
                onChange={(e) => setFormData({...formData, passenger: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
                placeholder="请输入乘车人"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">联系电话</label>
                <input
                  type="tel"
                  value={formData.passengerPhone}
                  onChange={(e) => setFormData({...formData, passengerPhone: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
                  placeholder="请输入电话"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">人数</label>
                <input
                  type="number"
                  value={formData.passengerCount}
                  onChange={(e) => setFormData({...formData, passengerCount: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
                  placeholder="请输入人数"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">任务描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 resize-none"
                rows={3}
                placeholder="请输入任务描述"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">分配车辆</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
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
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
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
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-all"
            >
              创建任务
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (selectedTask) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ActivitySelector />
        <TaskDetailView />
        {showAssignModal && <AssignModal />}
        {showCancelModal && <CancelModal />}
        {showReassignModal && <ReassignModal />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ActivitySelector />
      
      {/* 内容区域 */}
      <div className="pb-20">
        {activeTab === 'board' ? <BoardView /> : <ListView />}
      </div>

      {/* 创建任务按钮 */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-700 transition-all active:scale-95"
      >
        <Plus size={28} />
      </button>

      {/* 弹窗 */}
      {showCreateModal && <CreateTaskModal />}
      {showAssignModal && <AssignModal />}
      {showCancelModal && <CancelModal />}
      {showReassignModal && <ReassignModal />}
    </div>
  );
};

export default DispatcherView;
