import React, { useState } from 'react';
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
  AlertCircle
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
  const { tasks, dispatch } = useApp();
  const [activeFilter, setActiveFilter] = useState('待接收');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [completeRemark, setCompleteRemark] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleStatusChange = (taskId: string, newStatus: any, reason?: string, operator?: string) => {
    dispatch({ type: 'SET_TASK_STATUS', payload: { id: taskId, status: newStatus, reason, operator } });
  };

  const filteredTasks = tasks.filter(task => {
    // 司机不显示已取消和待派发的任务
    if (['已取消', '待派发'].includes(task.status)) return false;
    if (activeFilter === '待接收') return task.status === '待接收';
    if (activeFilter === '执行中') return ['已接收', '执行中'].includes(task.status);
    if (activeFilter === '已完成') return ['已完成', '已拒绝'].includes(task.status);
    return task.status === '待接收';
  }).sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.startTime}`);
    const dateB = new Date(`${b.date} ${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });

  const stats = {
    pending: tasks.filter(t => t.status === '待接收').length,
    inProgress: tasks.filter(t => t.status === '执行中').length,
    completed: tasks.filter(t => t.status === '已完成').length
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

  if (selectedTask) {
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
                selectedTask.status === '待接收' ? "bg-amber-100 text-amber-700" : 
                selectedTask.status === '已完成' ? "bg-slate-100 text-slate-600" :
                "bg-orange-100 text-orange-700"
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
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">目的地</p>
                  <p className="text-sm text-slate-800 font-medium">{selectedTask.to}</p>
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
              <button 
                onClick={() => setShowCompleteModal(true)}
                className="w-full bg-gradient-to-r from-brand-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:from-brand-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-200"
              >
                <CheckCircle2 size={18} />
                完成任务
              </button>
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
    );
  }

  return (
    <div>
      {activeTab === 'tasks' && (
        <div className="p-4 space-y-4">
          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button 
              onClick={() => setActiveFilter('待接收')}
              className={cn(
                "bg-white rounded-xl p-3 shadow-sm border transition-all",
                activeFilter === '待接收' ? "border-brand-500 shadow-md shadow-brand-100" : "border-slate-100"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">待接收</span>
                {stats.pending > 0 && (
                  <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {stats.pending}
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-slate-900">{stats.pending}</div>
            </button>
            <button 
              onClick={() => setActiveFilter('执行中')}
              className={cn(
                "bg-white rounded-xl p-3 shadow-sm border transition-all",
                activeFilter === '执行中' ? "border-brand-500 shadow-md shadow-brand-100" : "border-slate-100"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">执行中</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{stats.inProgress}</div>
            </button>
            <button 
              onClick={() => setActiveFilter('已完成')}
              className={cn(
                "bg-white rounded-xl p-3 shadow-sm border transition-all",
                activeFilter === '已完成' ? "border-brand-500 shadow-md shadow-brand-100" : "border-slate-100"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">已完成</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{stats.completed}</div>
            </button>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">{activeFilter === '待接收' ? '待接收任务' : activeFilter === '执行中' ? '进行中任务' : '已完成任务'}</h3>
            <button 
              onClick={() => setShowHistory(true)}
              className="text-xs text-brand-600 font-bold flex items-center gap-1"
            >
              历史任务
              <ChevronRight size={14} />
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-brand-50 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList size={40} className="text-brand-500" />
              </div>
              <p className="text-slate-500 text-sm">暂无{activeFilter}任务</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => setSelectedTask(task)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold",
                      task.status === '执行中' ? "bg-green-100 text-green-700" : 
                      task.status === '已接收' ? "bg-blue-100 text-blue-700" :
                      task.status === '待接收' ? "bg-amber-100 text-amber-700" : 
                      task.status === '已完成' ? "bg-slate-100 text-slate-600" :
                      "bg-orange-100 text-orange-700"
                    )}>{task.status}</span>
                    <span className="text-xs text-slate-400 font-medium">{task.date}</span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 mb-2 truncate">{task.name}</h3>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{task.startTime}开始</span>
                    </div>
                    <div className="flex items-center gap-1 flex-1 truncate">
                      <MapPin size={12} />
                      <span className="truncate">{task.from}→{task.to}</span>
                    </div>
                  </div>

                  {task.status === '待接收' && (
                    <div className="mt-3 flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                          setShowRejectModal(true);
                        }}
                        className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                      >
                        拒绝
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReceiveTask(task);
                        }}
                        className="flex-[2] bg-brand-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-brand-700 transition-colors"
                      >
                        接收
                      </button>
                    </div>
                  )}

                  {task.status === '已接收' && (
                    <div className="mt-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTask(task);
                        }}
                        className="w-full bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                      >
                        开始执行
                      </button>
                    </div>
                  )}

                  {task.status === '执行中' && (
                    <div className="mt-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                          setShowCompleteModal(true);
                        }}
                        className="w-full bg-brand-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-brand-700 transition-colors"
                      >
                        完成任务
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
};

export default MobileLayout;