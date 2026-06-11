import React, { useState } from 'react';
import { 
  ClipboardList, 
  LayoutGrid, 
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
  MapPin
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import DispatcherView from './DispatcherView';
import type { Task } from '../../types';

const MobileLayout: React.FC = () => {
  const [role, setRole] = useState<'driver' | 'dispatcher'>('driver');
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div className="flex flex-col h-full">
      {/* Role Switcher (Simulator only) */}
      <div className="bg-white px-6 pt-12 pb-4 flex justify-between items-center border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">
          {role === 'driver' ? '司机端' : '调度看板'}
        </h1>
        <button 
          onClick={() => setRole(r => r === 'driver' ? 'dispatcher' : 'driver')}
          className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-medium hover:bg-slate-200 transition-colors"
        >
          切换为{role === 'driver' ? '调度员' : '司机'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {role === 'driver' ? <DriverView activeTab={activeTab} /> : <DispatcherView activeTab={activeTab} />}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex items-center justify-around px-6 pb-4 z-40">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'tasks' ? "text-brand-600" : "text-slate-400")}
        >
          <ClipboardList size={22} />
          <span className="text-[10px] font-medium">任务</span>
        </button>
        <button 
          onClick={() => setActiveTab('board')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'board' ? "text-brand-600" : "text-slate-400")}
        >
          <LayoutGrid size={22} />
          <span className="text-[10px] font-medium">看板</span>
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
  const [activeFilter, setActiveFilter] = useState('全部');
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
    if (activeFilter === '全部') return true;
    if (activeFilter === '待接收') return task.status === '待接收';
    if (activeFilter === '执行中') return ['已接收', '执行中'].includes(task.status);
    if (activeFilter === '已完成') return ['已完成', '已拒绝'].includes(task.status);
    return true;
  }).sort((a, b) => {
    const statusPriority: Record<string, number> = {
      '执行中': 0,
      '已接收': 1,
      '待接收': 2,
      '已完成': 3,
      '已拒绝': 4,
      '已取消': 5
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

  const handleReceiveTask = (task: Task) => {
    handleStatusChange(task.id, '已接收');
    setSelectedTask(null);
  };

  const handleRejectTask = () => {
    if (!rejectReason.trim()) {
      alert('请填写拒绝原因');
      return;
    }
    handleStatusChange(selectedTask!.id, '已拒绝', rejectReason);
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

    handleStatusChange(task.id, '执行中');
    setSelectedTask(null);
  };

  const handleCompleteTask = () => {
    handleStatusChange(selectedTask!.id, '已完成', completeRemark);
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
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">历史任务</h2>
        </div>

        {tasks.filter(t => ['已完成', '已拒绝'].includes(t.status)).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">暂无历史任务</p>
          </div>
        ) : (
          tasks.filter(t => ['已完成', '已拒绝'].includes(t.status)).map(task => (
            <div key={task.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 opacity-75">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    task.status === '已完成' ? "bg-green-500" : task.status === '已拒绝' ? "bg-red-500" : "bg-slate-400"
                  )} />
                  <span className="text-sm font-bold text-slate-700">{task.status}</span>
                </div>
                <span className="text-xs text-slate-400">{task.date}</span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-4">{task.name}</h3>
              
              <div className="space-y-4 mb-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center py-1">
                    <div className="w-2 h-2 rounded-full border-2 border-slate-400" />
                    <div className="w-0.5 flex-1 bg-slate-100 my-1" />
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">出发地</p>
                      <p className="text-sm text-slate-700 font-medium">{task.from}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">目的地</p>
                      <p className="text-sm text-slate-700 font-medium">{task.to}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span className="text-xs">{task.startTime} 开始</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span className="text-xs">{task.passenger}</span>
                  </div>
                </div>
              </div>

              {task.rejectReason && (
                <div className="bg-red-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-red-700 font-medium">拒绝原因：{task.rejectReason}</p>
                </div>
              )}

              {task.cancelReason && (
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-700 font-medium">取消原因：{task.cancelReason}</p>
                </div>
              )}

              {task.history && task.history.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-2">任务轨迹</p>
                  <div className="space-y-1">
                    {task.history.map((h, i) => (
                      <div key={i} className="text-xs text-slate-600">
                        <span className="font-medium">{h.status}</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span>{new Date(h.time).toLocaleString('zh-CN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
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
                selectedTask.status === '待接收' ? "bg-amber-500" : "bg-slate-400"
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
                    <p className="text-sm font-medium">{selectedTask.passengerPhone}</p>
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
                  className="flex-[2] bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  接收任务
                </button>
              </>
            )}
            {selectedTask.status === '已接收' && (
              <button 
                onClick={() => handleStartTask(selectedTask)}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <Play size={18} />
                开始执行
              </button>
            )}
            {selectedTask.status === '执行中' && (
              <button 
                onClick={() => setShowCompleteModal(true)}
                className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
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
  }

  return (
    <div>
      {activeTab === 'tasks' && (
        <div className="p-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['全部', '待接收', '执行中', '已完成'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveFilter(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-medium transition-all",
                  activeFilter === tab ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">当前任务 ({filteredTasks.length})</h3>
            <button 
              onClick={() => setShowHistory(true)}
              className="text-xs text-brand-600 font-bold flex items-center gap-1"
            >
              历史任务
              <ChevronRight size={14} />
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">暂无任务</p>
            </div>
          ) : filteredTasks.map(task => (
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
                      task.status === '待接收' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                    )}>{task.status}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{task.date}</span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-4">{task.name}</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center py-1">
                      <div className="w-3 h-3 rounded-full bg-brand-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-brand-200 to-slate-200 my-1" />
                      <div className="w-3 h-3 rounded-full bg-slate-300 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">出发地</p>
                        <p className="text-sm text-slate-800 font-medium">{task.from}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">目的地</p>
                        <p className="text-sm text-slate-800 font-medium">{task.to}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                      <Clock size={14} className="text-brand-500" />
                      <span className="text-xs font-medium text-slate-700">{task.startTime} 开始</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                      <User size={14} className="text-brand-500" />
                      <span className="text-xs font-medium text-slate-700">{task.passenger}</span>
                    </div>
                  </div>
                </div>

                {task.rejectReason && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <p className="text-xs text-red-700 font-medium">拒绝原因：{task.rejectReason}</p>
                  </div>
                )}

                {task.cancelReason && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs text-slate-700 font-medium">取消原因：{task.cancelReason}</p>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}

      {activeTab === 'board' && (
        <div className="p-4 space-y-4">
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <h3 className="font-bold text-slate-900">执行中</h3>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === '执行中').length}
              </span>
            </div>
            {tasks.filter(t => t.status === '执行中').length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">暂无执行中任务</p>
            ) : (
              <div className="space-y-2">
                {tasks.filter(t => t.status === '执行中').map(task => (
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
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="font-bold text-slate-900">待接收</h3>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === '待接收').length}
              </span>
            </div>
            {tasks.filter(t => t.status === '待接收').length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">暂无待接收任务</p>
            ) : (
              <div className="space-y-2">
                {tasks.filter(t => t.status === '待接收').map(task => (
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
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="font-bold text-slate-900">已接收</h3>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === '已接收').length}
              </span>
            </div>
            {tasks.filter(t => t.status === '已接收').length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">暂无已接收任务</p>
            ) : (
              <div className="space-y-2">
                {tasks.filter(t => t.status === '已接收').map(task => (
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
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <h3 className="font-bold text-slate-900">已完成</h3>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-full">
                {tasks.filter(t => ['已完成', '已拒绝'].includes(t.status)).length}
              </span>
            </div>
            <p className="text-sm text-slate-500 text-center py-2">
              今日已完成 {tasks.filter(t => t.status === '已完成').length} 个任务
            </p>
          </div>
        </div>
      )}

      {activeTab === 'me' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
                <User size={32} className="text-brand-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">李师傅</h3>
                <p className="text-sm text-slate-500">13812345678</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">驾驶证类型</span>
                <span className="text-sm font-bold text-slate-900">C1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">所属供应商</span>
                <span className="text-sm font-bold text-slate-900">安迅租车</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">当前状态</span>
                <span className="text-sm font-bold text-green-600">可调配</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4">今日统计</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-brand-600">{tasks.filter(t => t.status === '已完成').length}</div>
                <div className="text-xs text-slate-500 mt-1">已完成任务</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{tasks.filter(t => t.status === '待接收').length}</div>
                <div className="text-xs text-slate-500 mt-1">待接收任务</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === '执行中').length}</div>
                <div className="text-xs text-slate-500 mt-1">执行中任务</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === '已接收').length}</div>
                <div className="text-xs text-slate-500 mt-1">已接收任务</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4">个人信息</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">身份证号</span>
                <span className="text-sm font-bold text-slate-900">440101198001011234</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">驾驶证有效期</span>
                <span className="text-sm font-bold text-slate-900">2030-01-01</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">紧急联系人</span>
                <span className="text-sm font-bold text-slate-900">张女士</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">紧急联系电话</span>
                <span className="text-sm font-bold text-slate-900">13987654321</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6">
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
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 resize-none"
                />
              </div>

              <button
                onClick={handleRejectTask}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6">
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
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 resize-none"
                />
              </div>

              <button
                onClick={handleCompleteTask}
                className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-all"
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
