import React, { useMemo, useState } from 'react';
import {
  Car,
  Users,
  UserCog,
  UserCheck,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Building,
  FileCheck,
  Route,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import type { Activity, Vehicle, Driver, Task, WorkGroup, VehicleType } from '../../types';

// 状态口径：可调配与已调度合并为"可分配"，故障与维修统一按"不可用"统计
const RESOURCE_STATUS_LABELS: {
  key: string;
  label: string;
  match: (s: string) => boolean;
  dot: string;
}[] = [
  {
    key: 'available',
    label: '可分配',
    match: s => s === '可调配' || s === '已调度',
    dot: 'bg-emerald-500',
  },
  {
    key: 'executing',
    label: '执行中',
    match: s => s === '执行中',
    dot: 'bg-blue-500',
  },
  {
    key: 'unavailable',
    label: '不可用',
    match: s => s === '不可用',
    dot: 'bg-rose-500',
  },
];

const countByStatus = (list: { status: string }[], key: string) => {
  const def = RESOURCE_STATUS_LABELS.find(d => d.key === key)!;
  return list.filter(item => def.match(item.status)).length;
};

// 车辆类型口径：跟数据模型 VehicleType 一致（轿车/SUV/商务车/中巴/大巴）
const VEHICLE_TYPES: VehicleType[] = ['轿车', 'SUV', '商务车', '中巴', '大巴'];

const FEATURE_CARDS = [
  { icon: Building, title: '供应商资源管理', desc: '统一管理合作服务商资源，支持供应商入驻与信息规范化管理，自动生成入驻账号，实现外协资源统一管控', tone: 'bg-blue-50 text-blue-600' },
  { icon: Car, title: '车辆资源管理', desc: '集中维护活动所用车辆档案、资质材料，规范车辆资源入库管理，保障用车资源合规可调', tone: 'bg-emerald-50 text-emerald-600' },
  { icon: Users, title: '司机资源管理', desc: '独立管理司机队伍，维护司机资质与人员档案，完善活动转运司机资源储备体系', tone: 'bg-violet-50 text-violet-600' },
  { icon: FileCheck, title: '资源合规审核管理', desc: '对车辆、司机入驻资料进行线上合规审核，严格把关准入标准，保障活动调度资源合规合法', tone: 'bg-amber-50 text-amber-600' },
  { icon: ClipboardList, title: '活动信息统筹管理', desc: '统一维护各类活动基础信息，归集活动用车与人员转运保障需求，为调度工作提供标准化业务支撑', tone: 'bg-sky-50 text-sky-600' },
  { icon: Route, title: '活动人车调度保障', desc: '根据活动需求创建调度任务，精准匹配车辆与司机资源，完成人员转运任务统筹排布与全程保障', tone: 'bg-rose-50 text-rose-600' },
];

const HomeView: React.FC = () => {
  const { activities, vehicles, drivers, tasks, workGroups } = useApp();
  // 结束期活动不纳入统计看板
  const statActivities = useMemo(() => activities.filter(a => a.period !== '结束期'), [activities]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(statActivities[0]?.id || '');

  const activity: Activity | undefined = statActivities.find(a => a.id === selectedActivityId) || statActivities[0];

  const stats = useMemo(() => {
    if (!activity) return null;
    const id = activity.id;
    const actVehicles: Vehicle[] = vehicles.filter(v => v.activityId === id);
    const actDrivers: Driver[] = drivers.filter(d => d.activityId === id);
    const actTasks: Task[] = tasks.filter(t => t.activityId === id);
    const actWgs: WorkGroup[] = workGroups.filter(wg => wg.activityId === id);

    // 工作小组汇总：每组同时统计车辆数与现场调度员，避免工作小组重复出现
    const wgStats = actWgs.map(wg => {
      const staffNames = new Set<string>([...(wg.fieldDispatcher || [])]);
      if (wg.fieldManager) staffNames.add(wg.fieldManager);
      return {
        name: wg.name || wg.location,
        location: wg.location,
        vehicleCount: actVehicles.filter(v => (v.activityLocations || []).includes(wg.location)).length,
        staffCount: staffNames.size,
        manager: wg.fieldManager,
        dispatchers: wg.fieldDispatcher || [],
      };
    });
    // 未绑定地点的车辆单独列出（无对应工作小组）
    const unboundVehicles = actVehicles.filter(v => !(v.activityLocations || []).length).length;

    const allStaff = new Set<string>();
    wgStats.forEach(wg => {
      if (wg.manager) allStaff.add(wg.manager);
      wg.dispatchers.forEach(d => allStaff.add(d));
    });

    // 随车绑定司机：活动车辆中已绑定司机的司机数量（按司机去重，同一司机绑定多辆车只计一次）
    const boundDriverCount = new Set(
      actVehicles.map(v => v.defaultDriverId).filter(Boolean)
    ).size;

    // 车辆类型数量统计
    const vehicleTypeCounts = VEHICLE_TYPES.map(type => ({
      type,
      count: actVehicles.filter(v => v.type === type).length,
    }));

    // 服务人次 = 任务乘车人数合计；用车数量 = 任务分配车辆数合计
    const passengerTotal = actTasks.reduce((sum, t) => sum + (t.passengerCount || 0), 0);
    const vehicleUsedTotal = actTasks.reduce(
      (sum, t) => sum + (t.assignments && t.assignments.length > 0
        ? t.assignments.length
        : (t.vehicleId ? 1 : 0)),
      0
    );

    return {
      actVehicles,
      actDrivers,
      actWgs,
      wgStats,
      unboundVehicles,
      staffTotal: allStaff.size,
      boundDriverCount,
      vehicleTypeCounts,
      passengerTotal,
      vehicleUsedTotal,
    };
  }, [activity, vehicles, drivers, tasks, workGroups]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-100 px-8 py-8">
        <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full bg-blue-100/50" />
        <div className="absolute right-32 -bottom-28 w-56 h-56 rounded-full bg-indigo-100/40" />
        <div className="relative z-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-blue-500">活动车辆调度系统</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">统筹外租人车资源，保障活动转运</h1>
          <p className="mt-3 text-sm text-slate-500">规范活动转运调度 · 夯实服务保障能力</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['安全合规', '高效调度', '状态可视'].map(tag => (
              <span key={tag} className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/80 text-blue-600 border border-blue-100">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 活动统计看板 */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard size={18} className="text-blue-600" />
            活动统计看板
          </h2>
          <p className="mt-1 text-xs text-slate-400">切换活动，查看车辆、司机与现场人员保障数据</p>
        </div>

        {/* 活动切换：横向可滚动 tab，活动再多也不会挤爆布局 */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 mb-5" style={{ scrollbarWidth: 'thin' }} role="tablist">
          {statActivities.map(a => {
            const active = a.id === activity?.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelectedActivityId(a.id)}
                role="tab"
                aria-selected={active}
                className={cn(
                  'relative whitespace-nowrap px-4 py-2.5 text-sm transition-colors',
                  active ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {a.name}
                <span className={cn('ml-2 text-[11px]', active ? 'text-blue-400' : 'text-slate-400')}>{a.period}</span>
                {active && <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-blue-600" />}
              </button>
            );
          })}
          {statActivities.length === 0 && <span className="py-2.5 text-sm text-slate-400">暂无活动</span>}
        </div>

        {!stats || !activity ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
            暂无活动数据
          </div>
        ) : (
          <>
            {/* 核心指标 */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {[
                { icon: Car, label: '活动车辆', value: stats.actVehicles.length, unit: '辆', tone: 'bg-blue-50 text-blue-600' },
                { icon: Users, label: '活动司机', value: stats.actDrivers.length, unit: '人', tone: 'bg-emerald-50 text-emerald-600' },
                { icon: UserCog, label: '现场调度员', value: stats.staffTotal, unit: '人', tone: 'bg-violet-50 text-violet-600' },
                { icon: UserCheck, label: '服务人次', value: stats.passengerTotal, unit: '人次', tone: 'bg-amber-50 text-amber-600' },
                { icon: ClipboardList, label: '用车数量', value: stats.vehicleUsedTotal, unit: '辆次', tone: 'bg-rose-50 text-rose-600' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', item.tone)}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 truncate">{item.label}</span>
                  </div>
                  <div className="shrink-0 text-right leading-none">
                    <span className="text-[26px] font-bold tracking-tight text-slate-900">{item.value}</span>
                    <span className="ml-1 text-xs font-normal text-slate-400">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 状态分布 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {/* 车辆状态 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Car size={16} className="text-blue-600" />
                  活动车辆状态
                </h3>
                <div className="mt-3 divide-y divide-slate-100">
                  {RESOURCE_STATUS_LABELS.map(st => (
                    <div key={st.key} className="flex items-center justify-between py-2.5">
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <span className={cn('w-2 h-2 rounded-full', st.dot)} />
                        {st.label}
                      </span>
                      <span className="text-lg font-bold text-slate-800">{countByStatus(stats.actVehicles, st.key)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1.5">车辆类型</p>
                  <div className="grid grid-cols-2 gap-x-6">
                    {stats.vehicleTypeCounts.map(item => (
                      <div key={item.type} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-slate-600">{item.type}</span>
                        <span className="text-base font-bold text-slate-800">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 司机状态 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users size={16} className="text-emerald-600" />
                  活动司机状态
                </h3>
                <div className="mt-3 divide-y divide-slate-100">
                  {RESOURCE_STATUS_LABELS.map(st => (
                    <div key={st.key} className="flex items-center justify-between py-2.5">
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <span className={cn('w-2 h-2 rounded-full', st.dot)} />
                        {st.label}
                      </span>
                      <span className="text-lg font-bold text-slate-800">{countByStatus(stats.actDrivers, st.key)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-sm text-slate-600">
                      <Car size={13} className="text-slate-400" />
                      随车绑定司机
                    </span>
                    <span className="text-lg font-bold text-slate-800">{stats.boundDriverCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 工作小组保障：车辆数与现场调度员合并到同一张表，工作小组只出现一次 */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-4">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <MapPin size={16} className="text-violet-600" />
                <h3 className="text-sm font-bold text-slate-800">工作小组保障</h3>
              </div>
              {stats.wgStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs text-slate-500">
                        <th className="text-left font-medium px-5 py-2.5">工作小组</th>
                        <th className="text-right font-medium px-5 py-2.5 w-32">车辆数</th>
                        <th className="text-right font-medium px-5 py-2.5 w-40">现场调度员</th>
                        <th className="text-left font-medium px-5 py-2.5 w-80">人员</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.wgStats.map(wg => (
                        <tr key={wg.name} className="hover:bg-slate-50/60">
                          <td className="px-5 py-3 font-medium text-slate-800">
                            <div className="flex items-center gap-2">
                              <MapPin size={13} className="text-slate-400 shrink-0" />
                              {wg.name}
                            </div>
                            {wg.location && <div className="pl-[21px] text-xs font-normal text-slate-400">{wg.location}</div>}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-slate-800">{wg.vehicleCount}</td>
                          <td className="px-5 py-3 text-right font-semibold text-slate-800">{wg.staffCount}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">
                            {wg.manager ? `负责人 ${wg.manager}` : '无现场负责人'}
                            {wg.dispatchers.length > 0 && ` · 调度员 ${wg.dispatchers.join('、')}`}
                          </td>
                        </tr>
                      ))}
                      {stats.unboundVehicles > 0 && (
                        <tr className="bg-slate-50/40">
                          <td className="px-5 py-3 text-slate-400">未绑定地点</td>
                          <td className="px-5 py-3 text-right font-semibold text-slate-500">{stats.unboundVehicles}</td>
                          <td className="px-5 py-3 text-right text-slate-300">—</td>
                          <td className="px-5 py-3 text-xs text-slate-400">—</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-slate-400">该活动暂无工作小组</p>
              )}
            </div>
          </>
        )}
      </section>

      {/* 功能介绍 */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">系统能力</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {FEATURE_CARDS.map(({ icon: Icon, title, desc, tone }) => (
            <div key={title} className="group flex gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', tone)}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="pt-2 pb-4 text-center text-xs text-slate-400">
        活动车辆调度系统 · 统筹外租人车资源，规范活动转运调度
      </footer>
    </div>
  );
};

export default HomeView;
