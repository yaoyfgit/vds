import React, { useState, useEffect } from 'react';
import { Map, Users, Phone, Navigation, AlertTriangle, Maximize2, X, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import type { Activity, Driver, Task } from '../../types';

const TrackScreen: React.FC = () => {
  const { activities, tasks, drivers, dispatch } = useApp();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAllFutureTasks, setShowAllFutureTasks] = useState(false);
  const [driverFilter, setDriverFilter] = useState('');

  // 默认选择第一个活动
  useEffect(() => {
    if (activities.length > 0 && !selectedActivity) {
      setSelectedActivity(activities[0]);
    }
  }, [activities, selectedActivity]);

  // 获取当前活动的执行中任务
  const inProgressTasks = selectedActivity
    ? tasks.filter(t => t.activityId === selectedActivity.id && t.status === '执行中')
    : [];

  // 获取在线司机（有执行中任务的司机）
  const onlineDrivers = drivers.filter(d => 
    inProgressTasks.some(t => t.driverId === d.id)
  );

  // 获取异常任务司机（已拒绝任务的司机）
  const abnormalTasks = selectedActivity
    ? tasks.filter(t => t.activityId === selectedActivity.id && t.status === '已拒绝')
    : [];
  const abnormalDrivers = drivers.filter(d =>
    abnormalTasks.some(t => t.driverId === d.id)
  );

  // 获取离线司机（无执行中任务且关联到活动的司机）
  const offlineDrivers = selectedActivity
    ? drivers.filter(d => 
        selectedActivity.driverIds.includes(d.id) && 
        !inProgressTasks.some(t => t.driverId === d.id) &&
        !abnormalTasks.some(t => t.driverId === d.id)
      )
    : [];

  // 获取司机的未来任务（按开始时间升序）
  const getDriverFutureTasks = (driver: Driver): Task[] => {
    return tasks
      .filter(t => 
        t.driverId === driver.id && 
        t.activityId === selectedActivity?.id && 
        t.status !== '已完成' &&
        t.status !== '已取消'
      )
      .sort((a, b) => {
        const timeA = a.date + ' ' + a.startTime;
        const timeB = b.date + ' ' + b.startTime;
        return timeA.localeCompare(timeB);
      });
  };

  // 点击司机图标时显示司机信息卡片
  const handleDriverClick = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  // 获取司机的当前任务
  const getDriverCurrentTask = (driver: Driver): Task | undefined => {
    return inProgressTasks.find(t => t.driverId === driver.id);
  };

  // 生成随机位置（模拟地图位置）
  const getRandomPosition = (index: number) => {
    const positions = [
      { left: '20%', top: '30%' },
      { left: '60%', top: '25%' },
      { left: '40%', top: '60%' },
      { left: '75%', top: '50%' },
      { left: '30%', top: '75%' },
      { left: '80%', top: '70%' },
      { left: '15%', top: '55%' },
      { left: '55%', top: '75%' },
    ];
    return positions[index % positions.length];
  };

  if (!selectedActivity) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">活动：</span>
              <select
                value=""
                disabled
                className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-sm text-slate-400"
              >
                <option value="">暂无活动</option>
              </select>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Map size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">暂无活动数据</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full flex flex-col bg-slate-50",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* 顶部栏 */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          {/* 活动选择器 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">活动：</span>
            <select
              value={selectedActivity.id}
              onChange={(e) => {
                const activity = activities.find(a => a.id === e.target.value);
                if (activity) {
                  setSelectedActivity(activity);
                  setSelectedDriver(null);
                }
              }}
              className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:border-brand-500 outline-none text-sm"
            >
              {activities.map(activity => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </div>

          {/* 活动名称 */}
          <h2 className="text-lg font-bold text-slate-900">{selectedActivity.name}</h2>

          {/* 统计数据 */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-600">{inProgressTasks.length}</p>
              <p className="text-xs text-slate-500">执行中任务</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{onlineDrivers.length}</p>
              <p className="text-xs text-slate-500">在线司机</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{abnormalTasks.length}</p>
              <p className="text-xs text-slate-500">异常任务</p>
            </div>
          </div>
        </div>

        {/* 全屏按钮 */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isFullscreen ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          {isFullscreen ? <X size={20} /> : <Maximize2 size={20} />}
        </button>
      </header>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 地图区域 */}
        <div className="flex-1 relative bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
          {selectedActivity.period === '筹备期' ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Map size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">活动尚未开始，暂无轨迹数据</p>
              </div>
            </div>
          ) : inProgressTasks.length === 0 && abnormalTasks.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Map size={48} className="text-brand-300 mx-auto mb-4" />
                <p className="text-slate-500">当前活动暂无执行中任务</p>
              </div>
            </div>
          ) : (
            <>
          <div className="absolute inset-6 opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(90deg, #cbd5e1 1px, transparent 1px),
                linear-gradient(#cbd5e1 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }} />
          </div>

          {/* 司机位置标记 */}
          <div className="relative w-full h-full">
            {/* 在线司机 */}
            {onlineDrivers.map((driver, index) => {
              const position = getRandomPosition(index);
              return (
                <button
                  key={driver.id}
                  onClick={() => handleDriverClick(driver)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: position.left, top: position.top }}
                >
                  <div className="relative">
                    {/* 脉冲动画 */}
                    <div className="w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-50" />
                    {/* 司机图标 */}
                    <div className="absolute inset-0 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-blue-500 flex items-center justify-center">
                      <Users size={16} className="text-blue-600" />
                    </div>
                    {/* 司机姓名 */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-white rounded-md shadow text-xs font-medium text-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {driver.name}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* 异常司机 */}
            {abnormalDrivers.map((driver, index) => {
              const position = getRandomPosition(index + onlineDrivers.length);
              return (
                <button
                  key={driver.id}
                  onClick={() => handleDriverClick(driver)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: position.left, top: position.top }}
                >
                  <div className="relative">
                    {/* 脉冲动画 */}
                    <div className="w-8 h-8 bg-red-500 rounded-full animate-ping opacity-50" />
                    {/* 司机图标 */}
                    <div className="absolute inset-0 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-red-500 flex items-center justify-center">
                      <AlertTriangle size={14} className="text-red-600" />
                    </div>
                    {/* 司机姓名 */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-white rounded-md shadow text-xs font-medium text-red-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {driver.name} (异常)
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
            </>
        )}
        </div>

        {/* 右侧司机列表面板 */}
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">司机列表</h3>
            <input
              type="text"
              placeholder="搜索司机姓名"
              className="mt-3 w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:border-brand-500 outline-none"
              onChange={(e) => setDriverFilter(e.target.value)}
            />
          </div>

          {/* 在线司机 */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-slate-700">在线 ({onlineDrivers.filter(d => d.name.includes(driverFilter)).length})</span>
            </div>
            <div className="space-y-2">
              {onlineDrivers.filter(d => d.name.includes(driverFilter)).map(driver => {
                const task = getDriverCurrentTask(driver);
                return (
                  <button
                    key={driver.id}
                    onClick={() => handleDriverClick(driver)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-colors",
                      selectedDriver?.id === driver.id 
                        ? "bg-brand-50 border border-brand-200" 
                        : "bg-slate-50 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-900">{driver.name}</span>
                      <div className="flex items-center gap-2">
                        {task && task.status === '执行中' && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">执行中</span>
                        )}
                        <Navigation size={14} className="text-green-500" />
                      </div>
                    </div>
                    {task && (
                      <p className="text-xs text-slate-500 truncate">{task.name}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 异常司机 */}
          {abnormalDrivers.filter(d => d.name.includes(driverFilter)).length > 0 && (
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-600">异常 ({abnormalDrivers.filter(d => d.name.includes(driverFilter)).length})</span>
              </div>
              <div className="space-y-2">
                {abnormalDrivers.filter(d => d.name.includes(driverFilter)).map(driver => {
                  const task = abnormalTasks.find(t => t.driverId === driver.id);
                  return (
                    <button
                      key={driver.id}
                      onClick={() => handleDriverClick(driver)}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-colors",
                        selectedDriver?.id === driver.id 
                          ? "bg-red-50 border border-red-200" 
                          : "bg-red-50/50 hover:bg-red-50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-red-700">{driver.name}</span>
                        <AlertTriangle size={14} className="text-red-500" />
                      </div>
                      {task && (
                        <p className="text-xs text-red-500 truncate">{task.rejectReason || '任务被拒绝'}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 离线司机 */}
          {offlineDrivers.filter(d => d.name.includes(driverFilter)).length > 0 && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-slate-300 rounded-full" />
                <span className="text-sm font-medium text-slate-500">离线 ({offlineDrivers.filter(d => d.name.includes(driverFilter)).length})</span>
              </div>
              <div className="space-y-2">
                {offlineDrivers.filter(d => d.name.includes(driverFilter)).map(driver => (
                  <button
                    key={driver.id}
                    onClick={() => handleDriverClick(driver)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-colors opacity-60",
                      selectedDriver?.id === driver.id 
                        ? "bg-slate-100 border border-slate-200" 
                        : "bg-slate-50 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-600">{driver.name}</span>
                      <Clock size={14} className="text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400">暂无任务</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* 司机信息卡片 */}
      {selectedDriver && (
        <div 
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setSelectedDriver(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-[400px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 卡片头部 */}
            <div className="bg-gradient-to-r from-brand-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedDriver.name}</h3>
                    <p className="text-sm opacity-80">{selectedDriver.licenseType}驾照</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDriver(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 卡片内容 */}
            <div className="p-6 space-y-4">
              {/* 当前任务 */}
              {getDriverCurrentTask(selectedDriver) && (
                <div 
                  className="bg-slate-50 rounded-xl p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => {
                    const task = getDriverCurrentTask(selectedDriver);
                    if (task) {
                      dispatch({ type: 'OPEN_MODAL', payload: { type: 'TASK_DETAIL', data: task } });
                      setSelectedDriver(null);
                    }
                  }}
                >
                  <p className="text-xs text-slate-500 mb-2">当前任务</p>
                  <div className="space-y-2">
                    <p className="font-bold text-slate-900">
                      {getDriverCurrentTask(selectedDriver)?.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Map size={14} />
                      <span>{getDriverCurrentTask(selectedDriver)?.from} → {getDriverCurrentTask(selectedDriver)?.to}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock size={14} />
                      <span>{getDriverCurrentTask(selectedDriver)?.date} {getDriverCurrentTask(selectedDriver)?.startTime}-{getDriverCurrentTask(selectedDriver)?.endTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 司机信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">联系电话</p>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span className="font-medium">{selectedDriver.phone}</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">所属供应商</p>
                  <span className="font-medium">{selectedDriver.supplier || '未指定'}</span>
                </div>
              </div>

              {/* 统计数据 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">
                    {tasks.filter(t => t.driverId === selectedDriver.id && t.status === '已完成').length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">今日完成</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">
                    {tasks.filter(t => t.driverId === selectedDriver.id && selectedActivity?.id === t.activityId).length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">本次活动</p>
                </div>
              </div>

              {/* 即将执行 */}
              {(() => {
                const futureTasks = getDriverFutureTasks(selectedDriver);
                if (futureTasks.length === 0) return null;
                return (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-4">即将执行</p>
                    <div className="space-y-10">
                      {(showAllFutureTasks ? futureTasks : futureTasks.slice(0, 2)).map((task, index) => (
                        <div 
                          key={task.id} 
                          className="flex items-center gap-3 p-6 bg-white rounded-lg cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                          onClick={() => {
                            dispatch({ type: 'OPEN_MODAL', payload: { type: 'TASK_DETAIL', data: task } });
                            setSelectedDriver(null);
                          }}
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">{task.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-3">
                              <Map size={12} className="text-slate-400" />
                              {task.from} → {task.to}
                            </p>
                            <p className="text-xs text-slate-500 mt-3">{task.date} {task.startTime}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {futureTasks.length > 2 && (
                      <button 
                        onClick={() => setShowAllFutureTasks(!showAllFutureTasks)}
                        className="w-full mt-6 py-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
                      >
                        {showAllFutureTasks ? '收起' : `展开更多 (${futureTasks.length - 2}个)`}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackScreen;
