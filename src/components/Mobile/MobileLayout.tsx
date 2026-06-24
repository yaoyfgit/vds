import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  User,
  ChevronRight,
  CheckCircle2,
  Play,
  XCircle,
  Users,
  History,
  ArrowLeft,
  Clock,
  Phone,
  MapPin,
  AlertCircle,
  Pause,
  AlertTriangle,
  Bell,
  Check,
  Flag
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import DispatcherView from './DispatcherView';
import type { Task } from '../../types';

const MobileLayout: React.FC = () => {
  const [role, setRole] = useState<'driver' | 'dispatcher'>('driver');
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      {/* Role Switcher (Simulator only) */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 pt-12 pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">
            {role === 'driver' ? '司机端' : '调度看板'}
          </h1>
          <button 
            onClick={() => setRole(r => r === 'driver' ? 'dispatcher' : 'driver')}
            className="text-xs bg-white/20 px-3 py-1 rounded-full text-white font-medium hover:bg-white/30 transition-colors"
          >
            切换为{role === 'driver' ? '调度员' : '司机'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {role === 'driver' ? <DriverView activeTab={activeTab} /> : <DispatcherView activeTab={activeTab} />}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-lg border-t border-slate-100 flex items-center justify-around px-6 z-40">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'tasks' ? "text-brand-600" : "text-slate-400")}
        >
          <ClipboardList size={22} />
          <span className="text-[10px] font-medium">任务</span>
        </button>
        <button 
          onClick={() => setActiveTab('me')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'me' ? "text-brand-600" : "text-slate-400")}
        >
          <User size={22} />
          <span className="text-[10px] font-medium">我的</span>
        </button>
      </nav>
    </div>
  );
};

const DriverView = ({ activeTab }: { activeTab: string }) => {
  const { tasks, dispatch, drivers } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [completeRemark, setCompleteRemark] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [longPressTask, setLongPressTask] = useState<Task | null>(null);
  const [longPressLocation, setLongPressLocation] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showFaultModal, setShowFaultModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [showArrivalConfirmModal, setShowArrivalConfirmModal] = useState(false);
  const [arrivalLocation, setArrivalLocation] = useState<string | null>(null);

  useEffect(() => {
    const driver = drivers.find(d => d.status === '可调配');
    if (driver && !driver.privacyAgreementAccepted && !agreedPrivacy) {
      setShowPrivacyModal(true);
    }
  }, [drivers, agreedPrivacy]);

  const handleStatusChange = (taskId: string, newStatus: any, reason?: string, operator?: string) => {
    dispatch({ type: 'SET_TASK_STATUS', payload: { id: taskId, status: newStatus, reason, operator } });
  };

  const handleLocationTouchStart = (task: Task, location: string) => {
    if (!['已接收', '执行中'].includes(task.status)) return;
    if ((task.reachedLocations || []).includes(location)) return;
    
    setLongPressTask(task);
    setLongPressLocation(location);
    setArrivalLocation(location);
    setShowArrivalConfirmModal(true);
  };

  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const stats = {
    pending: tasks.filter(t => t.status === '待接收').length,
    accepted: tasks.filter(t => t.status === '已接收').length,
    inProgress: tasks.filter(t => t.status === '执行中').length
  };

  const handleReceiveTask = (task: Task) => {
    handleStatusChange(task.id, '已接收', '接收任务', '司机');
    setSelectedTask(null);
  };

  const handleRejectTask = () => {
    if (!rejectReason.trim()) {
      alert('请填写拒绝原因');
      return;
    }
    handleStatusChange(selectedTask!.id, '已拒绝', rejectReason, '司机');
    setRejectReason('');
    setShowRejectModal(false);
    setSelectedTask(null);
  };

  const handleStartTask = (task: Task) => {
    const now = new Date();
    const taskTime = new Date(`${task.date} ${task.startTime}`);
    const timeDiff = taskTime.getTime() - now.getTime();
    const thirtyMinutes = 30 * 60 * 1000;

    if (timeDiff > thirtyMinutes) {
      const confirmStart = confirm('尚未到任务执行时间（需提前 30 分钟），是否确认提前开始？');
      if (!confirmStart) return;
    }

    handleStatusChange(task.id, '执行中', '开始执行', '司机');
    setSelectedTask(null);
  };

  const handleCompleteTask = () => {
    handleStatusChange(selectedTask!.id, '已完成', completeRemark || '任务完成', '司机');
    setCompleteRemark('');
    setShowCompleteModal(false);
    setSelectedTask(null);
  };

  const handleAgreePrivacy = () => {
    setAgreedPrivacy(true);
    setShowPrivacyModal(false);
    const driver = drivers.find(d => d.status === '可调配');
    if (driver) {
      dispatch({
        type: 'ACCEPT_PRIVACY_AGREEMENT',
        payload: { driverId: driver.id }
      });
    }
  };

  const handleSuspendTask = () => {
    if (!suspendReason.trim()) {
      alert('请填写暂停原因');
      return;
    }
    dispatch({
      type: 'UPDATE_TASK',
      payload: { id: selectedTask!.id, data: { suspendReason: suspendReason, suspendRequested: true } }
    });
    setSuspendReason('');
    setShowSuspendModal(false);
    setSelectedTask(null);
  };

  const handleResumeTask = () => {
    dispatch({
      type: 'RESUME_TASK',
      payload: { id: selectedTask!.id }
    });
    setShowResumeModal(false);
  };

  const handleReportFault = () => {
    if (!faultDescription.trim()) {
      alert('请填写故障描述');
      return;
    }
    dispatch({
      type: 'REPORT_FAULT',
      payload: { id: selectedTask!.id, reason: faultDescription }
    });
    setFaultDescription('');
    setShowFaultModal(false);
  };

  if (showHistory) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => setShowHistory(false)}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-brand-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">历史任务</h2>
        </div>

        {tasks.filter(t => ['已完成', '已拒绝'].includes(t.status)).length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History size={40} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">暂无历史任务</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.filter(t => ['已完成', '已拒绝'].includes(t.status)).map(task => (
              <div key={task.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      task.status === '已完成' ? "bg-green-500" : "bg-orange-500"
                    )} />
                    <span className="text-xs font-bold text-slate-600">{task.status}</span>
                  </div>
                  <span className="text-xs text-slate-400">{task.date}</span>
                </div>
                
                <h3 className="font-bold text-slate-900 mb-2 truncate">{task.name}</h3>
                
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{task.startTime}-{task.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span className="truncate">{task.from}→{task.to}</span>
                  </div>
                </div>

                {task.rejectReason && (
                  <div className="mt-3 bg-orange-50 rounded-lg p-2">
                    <p className="text-xs text-orange-700">拒绝原因：{task.rejectReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const selectedTaskView = selectedTask && (
    <div className="fixed inset-0 bg-slate-50 z-40 overflow-y-auto">
      <div className="max-w-md mx-auto min-h-full bg-white shadow-xl">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => setSelectedTask(null)}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-slate-900">任务详情</h1>
        <div className="w-8" />
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold",
                selectedTask.status === '执行中' ? "bg-green-100 text-green-700" : 
                selectedTask.status === '已接收' ? "bg-blue-100 text-blue-700" :
                selectedTask.status === '待接收' ? "bg-amber-100 text-amber-700" : 
                selectedTask.status === '已完成' ? "bg-slate-100 text-slate-600" :
                selectedTask.status === '已暂停' ? "bg-orange-100 text-orange-700" :
                "bg-slate-100 text-slate-600"
              )}>
                {selectedTask.suspendRequested && selectedTask.status === '执行中' ? '暂停审核中' : selectedTask.status}
              </span>
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
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLocationTouchStart(selectedTask, selectedTask.from);
                  }}
                  className={cn(
                    "p-2 rounded-lg transition-colors cursor-pointer",
                    (selectedTask.reachedLocations || []).includes(selectedTask.from) ? "bg-slate-100" : "bg-transparent hover:bg-slate-50"
                  )}
                >
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">出发地</p>
                  <p className={cn(
                    "text-sm font-medium",
                    (selectedTask.reachedLocations || []).includes(selectedTask.from) ? "text-slate-400 line-through" : "text-slate-800"
                  )}>{selectedTask.from}</p>
                  {selectedTask.fromTime && <p className="text-xs text-slate-400">{selectedTask.fromTime}</p>}
                </div>
                
                {/* 途经点 */}
                {selectedTask.waypoints && selectedTask.waypoints.length > 0 && (
                  <div className="space-y-2">
                    {selectedTask.waypoints.map((waypoint, index) => (
                      <div
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLocationTouchStart(selectedTask, waypoint.name);
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-colors cursor-pointer",
                          (selectedTask.reachedLocations || []).includes(waypoint.name) ? "bg-slate-100" : "bg-transparent hover:bg-slate-50"
                        )}
                      >
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">途经点 {index + 1}</p>
                        <p className={cn(
                          "text-sm font-medium",
                          (selectedTask.reachedLocations || []).includes(waypoint.name) ? "text-slate-400 line-through" : "text-slate-800"
                        )}>{waypoint.name}</p>
                        {waypoint.time && <p className="text-xs text-slate-400">{waypoint.time}</p>}
                      </div>
                    ))}
                  </div>
                )}
                
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLocationTouchStart(selectedTask, selectedTask.to);
                  }}
                  className={cn(
                    "p-2 rounded-lg transition-colors cursor-pointer",
                    (selectedTask.reachedLocations || []).includes(selectedTask.to) ? "bg-slate-100" : "bg-transparent hover:bg-slate-50"
                  )}
                >
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">目的地</p>
                  <p className={cn(
                    "text-sm font-medium",
                    (selectedTask.reachedLocations || []).includes(selectedTask.to) ? "text-slate-400 line-through" : "text-slate-800"
                  )}>{selectedTask.to}</p>
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
                    <p className="text-sm font-medium">{selectedTask.passengerPhone}</p>
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
              {(selectedTask.fieldDispatcher || selectedTask.fieldDispatcherPhone) && (
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone size={14} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">调度员</p>
                    <p className="text-sm font-medium">{selectedTask.fieldDispatcher || '-'}</p>
                    {selectedTask.fieldDispatcherPhone && (
                      <a 
                        href={`tel:${selectedTask.fieldDispatcherPhone}`} 
                        className="text-xs text-blue-600 flex items-center gap-1 mt-0.5"
                      >
                        <Phone size={12} />
                        {selectedTask.fieldDispatcherPhone}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedTask.description && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">任务描述</p>
                <p className="text-sm text-slate-700">{selectedTask.description}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {selectedTask.status === '待接收' && (
              <>
                <button 
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  拒绝
                </button>
                <button 
                  onClick={() => handleReceiveTask(selectedTask)}
                  className="flex-[2] bg-gradient-to-r from-brand-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:from-brand-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-200"
                >
                  <CheckCircle2 size={18} />
                  接收任务
                </button>
              </>
            )}
            {selectedTask.status === '已接收' && (
              <button 
                onClick={() => handleStartTask(selectedTask)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-green-200"
              >
                <Play size={18} />
                开始执行
              </button>
            )}
            {selectedTask.status === '执行中' && (
              <div className="grid grid-cols-3 gap-2 w-full">
                <button 
                  onClick={() => setShowSuspendModal(true)}
                  className="bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <Pause size={18} />
                  暂停
                </button>
                <button 
                  onClick={() => setShowFaultModal(true)}
                  className="bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <AlertTriangle size={18} />
                  故障
                </button>
                <button 
                  onClick={() => setShowCompleteModal(true)}
                  className="bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <CheckCircle2 size={18} />
                  完成
                </button>
              </div>
            )}
            {selectedTask.status === '已暂停' && (
              <div className="grid grid-cols-2 gap-3 w-full">
                <button 
                  onClick={() => setShowFaultModal(true)}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={18} />
                  故障上报
                </button>
                <button 
                  onClick={() => setShowResumeModal(true)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-green-200"
                >
                  <Play size={18} />
                  继续执行
                </button>
              </div>
            )}
            {['已完成', '已拒绝'].includes(selectedTask.status) && (
              <div className="w-full py-3 text-center text-slate-500 font-medium">
                此任务已结束
              </div>
            )}
          </div>
        </div>

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
                        h.status === '待接收' ? "bg-amber-100 text-amber-700" :
                        h.status === '已完成' ? "bg-slate-100 text-slate-600" :
                        "bg-orange-100 text-orange-700"
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
    </div>
  </div>
  );

  return (
    <div>
      {/* 任务详情视图 */}
      {selectedTaskView}
      
      {activeTab === 'tasks' && (
        <div className="p-4 space-y-4">
          {/* 统计卡片 - 可点击筛选 */}
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => setActiveFilter(activeFilter === '待接收' ? 'all' : '待接收')}
              className={cn(
                "rounded-xl p-3 shadow-sm border transition-all",
                activeFilter === '待接收' 
                  ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-200" 
                  : "bg-white border-slate-100 hover:border-brand-200"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-xs", activeFilter === '待接收' ? "text-white/80" : "text-slate-500")}>待接收</span>
                {stats.pending > 0 && (
                  <span className={cn(
                    "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                    activeFilter === '待接收' ? "bg-white text-brand-600" : "bg-amber-500 text-white"
                  )}>
                    {stats.pending}
                  </span>
                )}
              </div>
              <div className={cn("text-xl font-bold", activeFilter === '待接收' ? "text-white" : "text-slate-900")}>{stats.pending}</div>
            </button>
            <button 
              onClick={() => setActiveFilter(activeFilter === '已接收' ? 'all' : '已接收')}
              className={cn(
                "rounded-xl p-3 shadow-sm border transition-all",
                activeFilter === '已接收' 
                  ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-200" 
                  : "bg-white border-slate-100 hover:border-brand-200"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-xs", activeFilter === '已接收' ? "text-white/80" : "text-slate-500")}>已接收</span>
                {stats.accepted > 0 && (
                  <span className={cn(
                    "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                    activeFilter === '已接收' ? "bg-white text-brand-600" : "bg-blue-500 text-white"
                  )}>
                    {stats.accepted}
                  </span>
                )}
              </div>
              <div className={cn("text-xl font-bold", activeFilter === '已接收' ? "text-white" : "text-slate-900")}>{stats.accepted}</div>
            </button>
            <button 
              onClick={() => setActiveFilter(activeFilter === '执行中' ? 'all' : '执行中')}
              className={cn(
                "rounded-xl p-3 shadow-sm border transition-all",
                activeFilter === '执行中' 
                  ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-200" 
                  : "bg-white border-slate-100 hover:border-brand-200"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-xs", activeFilter === '执行中' ? "text-white/80" : "text-slate-500")}>执行中</span>
                {stats.inProgress > 0 && (
                  <span className={cn(
                    "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                    activeFilter === '执行中' ? "bg-white text-brand-600" : "bg-green-500 text-white"
                  )}>
                    {stats.inProgress}
                  </span>
                )}
              </div>
              <div className={cn("text-xl font-bold", activeFilter === '执行中' ? "text-white" : "text-slate-900")}>{stats.inProgress}</div>
            </button>
          </div>

          {/* 找出当前/下一个最重要的任务 */}
          {(() => {
            // 筛选任务
            let displayTasks = tasks.filter(t => 
              !['已取消', '待派发'].includes(t.status) &&
              ['待接收', '已接收', '执行中'].includes(t.status)
            );
            
            // 应用筛选
            if (activeFilter === '待接收') {
              displayTasks = displayTasks.filter(t => t.status === '待接收');
            } else if (activeFilter === '已接收') {
              displayTasks = displayTasks.filter(t => t.status === '已接收');
            } else if (activeFilter === '执行中') {
              displayTasks = displayTasks.filter(t => t.status === '执行中');
            }
            
            // 按优先级排序
            displayTasks.sort((a, b) => {
              const statusOrder = { '执行中': 0, '已接收': 1, '待接收': 2 };
              const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
              const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
              if (orderA !== orderB) return orderA - orderB;
              return new Date(`${a.date} ${a.startTime}`).getTime() - new Date(`${b.date} ${b.startTime}`).getTime();
            });
            
            const priorityTask = displayTasks[0];
            const otherTasks = displayTasks.slice(1);
            
            return (
              <>
                {/* 首要任务卡片 - 品牌色主题，展示完整行程 */}
                {priorityTask && (
                  <div 
                    onClick={() => setSelectedTask(priorityTask)}
                    className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-5 text-white cursor-pointer hover:scale-[1.02] transition-all shadow-lg shadow-brand-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/20">
                          {priorityTask.status}
                        </span>
                        <span className="text-xs opacity-75">{priorityTask.date}</span>
                      </div>
                      <ChevronRight size={18} className="opacity-50" />
                    </div>
                    
                    <h2 className="text-xl font-bold mb-4">{priorityTask.name}</h2>
                    
                    {/* 横向时间轴行程 */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      {/* 出发地 */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <span className="text-[10px] opacity-60 mb-1">{priorityTask.fromTime || priorityTask.startTime}</span>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          (priorityTask.reachedLocations || []).includes(priorityTask.from) 
                            ? "bg-white/30" : "bg-white"
                        )}>
                          <MapPin size={14} className={cn(
                            (priorityTask.reachedLocations || []).includes(priorityTask.from) 
                              ? "text-white/50" : "text-brand-600"
                          )} />
                        </div>
                        <p className={cn(
                          "text-xs mt-1 max-w-[60px] text-center leading-tight",
                          (priorityTask.reachedLocations || []).includes(priorityTask.from) 
                            ? "line-through opacity-50" : ""
                        )}>{priorityTask.from}</p>
                        <p className="text-[10px] opacity-50">出发</p>
                      </div>
                      
                      {/* 连接线 */}
                      <div className="w-6 h-0.5 bg-white/30 flex-shrink-0" />
                      
                      {/* 途经点 */}
                      {priorityTask.waypoints && priorityTask.waypoints.length > 0 && priorityTask.waypoints.map((wp, index) => (
                        <React.Fragment key={index}>
                          <div className="flex flex-col items-center flex-shrink-0">
                            <span className="text-[10px] opacity-60 mb-1">{wp.time || ''}</span>
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center border-2",
                              (priorityTask.reachedLocations || []).includes(wp.name)
                                ? "bg-white/30 border-white/30" : "bg-white border-white"
                            )}>
                              <span className={cn(
                                "text-xs font-bold",
                                (priorityTask.reachedLocations || []).includes(wp.name)
                                  ? "text-white/50" : "text-brand-600"
                              )}>{index + 1}</span>
                            </div>
                            <p className={cn(
                              "text-xs mt-1 max-w-[60px] text-center leading-tight",
                              (priorityTask.reachedLocations || []).includes(wp.name)
                                ? "line-through opacity-50" : ""
                            )}>{wp.name}</p>
                            <p className="text-[10px] opacity-50">途经</p>
                          </div>
                          <div className="w-6 h-0.5 bg-white/30 flex-shrink-0" />
                        </React.Fragment>
                      ))}
                      
                      {/* 目的地 */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <span className="text-[10px] opacity-60 mb-1">{priorityTask.toTime || priorityTask.endTime}</span>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          (priorityTask.reachedLocations || []).includes(priorityTask.to) 
                            ? "bg-white/30" : "bg-white"
                        )}>
                          <Flag size={14} className={cn(
                            (priorityTask.reachedLocations || []).includes(priorityTask.to) 
                              ? "text-white/50" : "text-brand-600"
                          )} />
                        </div>
                        <p className={cn(
                          "text-xs mt-1 max-w-[60px] text-center leading-tight",
                          (priorityTask.reachedLocations || []).includes(priorityTask.to) 
                            ? "line-through opacity-50" : ""
                        )}>{priorityTask.to}</p>
                        <p className="text-[10px] opacity-50">目的</p>
                      </div>
                    </div>
                    
                    {/* 进度条 */}
                    {priorityTask.status === '执行中' && (
                      <div className="mt-4 bg-white/20 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all"
                          style={{ 
                            width: `${((priorityTask.reachedLocations || []).length / 
                              (1 + (priorityTask.waypoints?.length || 0) + 1) * 100)}%` 
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* 其他任务列表 - 与首要任务卡片样式一致 */}
                {otherTasks.length > 0 && (
                  <div>
                    {activeFilter === 'all' && (
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-900">其他任务</h3>
                        <button 
                          onClick={() => setShowHistory(true)}
                          className="text-xs text-brand-600 font-medium flex items-center gap-1"
                        >
                          历史
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {otherTasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="bg-white rounded-xl p-4 border border-slate-100 cursor-pointer hover:border-brand-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                task.status === '执行中' ? "bg-green-100 text-green-700" :
                                task.status === '已接收' ? "bg-blue-100 text-blue-700" :
                                "bg-amber-100 text-amber-700"
                              )}>
                                {task.status}
                              </span>
                              <span className="text-xs text-slate-400">{task.date}</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
                          </div>
                          
                          <h3 className="font-semibold text-slate-900 mb-2">{task.name}</h3>
                          
                          {/* 简化的横向时间轴 */}
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <MapPin size={12} className="text-green-500" />
                            <span className="truncate max-w-[80px]">{task.from}</span>
                            {task.waypoints && task.waypoints.length > 0 && (
                              <>
                                <span>→</span>
                                <span className="text-brand-500">{task.waypoints.length}个途经</span>
                                <span>→</span>
                              </>
                            )}
                            {!task.waypoints || task.waypoints.length === 0 && <span>→</span>}
                            <MapPin size={12} className="text-red-500" />
                            <span className="truncate max-w-[80px]">{task.to}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 无任务时显示 */}
                {displayTasks.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-50 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClipboardList size={40} className="text-brand-500" />
                    </div>
                    <p className="text-slate-500 text-sm">
                      {activeFilter === 'all' ? '暂无进行中的任务' : `暂无${activeFilter}的任务`}
                    </p>
                  </div>
                )}
              </>
            );
          })()}

        </div>
      )}

      {activeTab === 'me' && (
        <div className="p-4 space-y-4">
          <div className="bg-gradient-to-br from-brand-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">李师傅</h3>
                <p className="text-sm text-white/70">13812345678 · C1驾照</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{tasks.filter(t => t.status === '待接收').length}</div>
                <div className="text-xs text-white/70">待接收</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{tasks.filter(t => t.status === '执行中').length}</div>
                <div className="text-xs text-white/70">执行中</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{tasks.filter(t => t.status === '已完成').length}</div>
                <div className="text-xs text-white/70">已完成</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4">基本信息</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">驾驶证类型</span>
                <span className="text-sm font-bold text-slate-900">C1</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">所属供应商</span>
                <span className="text-sm font-bold text-slate-900">安迅租车</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">当前状态</span>
                <span className="text-sm font-bold text-green-600">可调配</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500">驾驶证有效期</span>
                <span className="text-sm font-bold text-slate-900">2030-01-01</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4">紧急联系人</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">联系人</span>
                <span className="text-sm font-bold text-slate-900">张女士</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500">联系电话</span>
                <span className="text-sm font-bold text-slate-900">13987654321</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">定位权限</p>
                <p className="text-xs text-amber-600 mt-1">执行任务时需要开启定位权限以记录行驶轨迹</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showArrivalConfirmModal && arrivalLocation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">确认到达</h3>
              <button 
                onClick={() => {
                  setShowArrivalConfirmModal(false);
                  setArrivalLocation(null);
                  setLongPressTask(null);
                  setLongPressLocation(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin size={32} className="text-green-600" />
                </div>
                <p className="text-lg font-medium text-slate-900">确认抵达 {arrivalLocation}？</p>
                <p className="text-sm text-slate-500 mt-2">点击确认后将更新您的任务进度</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowArrivalConfirmModal(false);
                    setArrivalLocation(null);
                    setLongPressTask(null);
                    setLongPressLocation(null);
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (longPressTask && longPressLocation) {
                      dispatch({
                        type: 'UPDATE_TASK',
                        payload: {
                          id: longPressTask.id,
                          data: {
                            reachedLocations: [...(longPressTask.reachedLocations || []), longPressLocation]
                          }
                        }
                      });
                      setLongPressTask(null);
                      setLongPressLocation(null);
                      setArrivalLocation(null);
                      setShowArrivalConfirmModal(false);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:from-green-600 hover:to-emerald-700 transition-all shadow-md shadow-green-200"
                >
                  确认抵达
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">拒绝任务</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">拒绝原因</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请填写拒绝原因"
                  rows={4}
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 resize-none focus:border-brand-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleRejectTask}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:from-red-600 hover:to-orange-600 transition-all shadow-md shadow-red-200"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">完成任务</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">完成备注</label>
                <textarea
                  value={completeRemark}
                  onChange={(e) => setCompleteRemark(e.target.value)}
                  placeholder="请填写完成备注（可选）"
                  rows={4}
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 resize-none focus:border-brand-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleCompleteTask}
                className="w-full bg-gradient-to-r from-brand-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:from-brand-700 hover:to-blue-700 transition-all shadow-md shadow-brand-200"
              >
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">服务告知书</h3>
              <p className="text-sm text-slate-600">请仔细阅读以下内容</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto">
              <p className="text-xs text-slate-700 leading-relaxed">
                尊敬的司机：

                感谢您使用本车辆调度系统。为保障您的权益和服务质量，请您知悉以下事项：

                1. 您的位置信息将被实时收集，用于任务调度和轨迹记录。
                2. 请确保在任务执行期间保持手机畅通，以便调度员及时联系。
                3. 请遵守交通规则，安全驾驶，准时到达指定地点。
                4. 如遇突发情况，请及时通过系统上报，以便我们及时处理。

                点击确认即表示您已阅读并同意以上内容。
              </p>
            </div>

            <button
              onClick={handleAgreePrivacy}
              className="w-full bg-gradient-to-r from-brand-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:from-brand-700 hover:to-blue-700 transition-all shadow-md shadow-brand-200"
            >
              <Check size={18} className="inline mr-2" />
              我已阅读并同意
            </button>
          </div>
        </div>
      )}

      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">申请暂停任务</h3>
              <button onClick={() => setShowSuspendModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-700">暂停申请提交后需等待调度员审核，审核通过前任务状态仍为"执行中"</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">暂停原因</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="请填写暂停原因"
                  rows={4}
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 resize-none focus:border-brand-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSuspendTask}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-200"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}

      {showResumeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">继续执行任务</h3>
              <button 
                onClick={() => setShowResumeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm text-green-700 font-medium mb-1">任务信息</p>
                <p className="text-lg font-bold text-green-900">当前任务</p>
              </div>

              <p className="text-sm text-slate-600">确认继续执行此任务？</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResumeModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleResumeTask}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:from-green-600 hover:to-emerald-700 transition-all shadow-md shadow-green-200"
                >
                  继续执行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFaultModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">故障上报</h3>
              <button onClick={() => setShowFaultModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">故障描述</label>
                <textarea
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  placeholder="请详细描述故障情况"
                  rows={4}
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 resize-none focus:border-brand-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleReportFault}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:from-red-600 hover:to-orange-600 transition-all shadow-md shadow-red-200"
              >
                确认上报
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileLayout;