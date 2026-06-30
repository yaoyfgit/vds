import React, { useState } from 'react';
import {
  X,
  Building,
  Phone,
  MapPin,
  Calendar,
  FileText,
  TrendingUp,
  Car,
  Users,
  ChevronRight,
  Eye,
  Edit2,
  Filter,
  Search,
  CalendarDays
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import type { Supplier } from '../../types';

interface SupplierDetailProps {
  supplier: Supplier;
  onClose: () => void;
}

const SupplierDetail: React.FC<SupplierDetailProps> = ({ supplier, onClose }) => {
  const { vehicles, drivers, activities, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'info' | 'vehicles' | 'drivers' | 'activities'>('info');

  // 获取该供应商名下的车辆和司机
  const supplierVehicles = vehicles.filter(v => v.supplier === supplier.name);
  const supplierDrivers = drivers.filter(d => d.supplier === supplier.name);
  
  // 获取该供应商参与的活动
  const supplierActivities = activities.filter(a => a.supplierIds.includes(supplier.id));

  // 统计数据
  const vehicleStats = {
    total: supplierVehicles.length,
    approved: supplierVehicles.filter(v => v.auditStatus === '审核通过').length,
    pending: supplierVehicles.filter(v => v.auditStatus === '待审核').length,
    rejected: supplierVehicles.filter(v => v.auditStatus === '审核不通过').length,
    available: supplierVehicles.filter(v => v.status === '可调配').length,
  };

  const driverStats = {
    total: supplierDrivers.length,
    approved: supplierDrivers.filter(d => d.auditStatus === '审核通过').length,
    pending: supplierDrivers.filter(d => d.auditStatus === '待审核').length,
    rejected: supplierDrivers.filter(d => d.auditStatus === '审核不通过').length,
    available: supplierDrivers.filter(d => d.status === '可调配').length,
  };

  const statusStyles = {
    '合作中': 'bg-green-100 text-green-700',
    '暂停合作': 'bg-amber-100 text-amber-700',
    '已终止': 'bg-red-100 text-red-700',
  };

  const auditStatusStyles = {
    '待审核': 'bg-amber-100 text-amber-700',
    '审核通过': 'bg-green-100 text-green-700',
    '审核不通过': 'bg-red-100 text-red-700',
  };

  const resourceStatusStyles = {
    '可调配': 'bg-green-100 text-green-700',
    '已调度': 'bg-blue-100 text-blue-700',
    '执行中': 'bg-blue-100 text-blue-700',
    '不可用': 'bg-slate-100 text-slate-600',
  };

  const activityPeriodStyles = {
    '筹备期': 'bg-blue-100 text-blue-700',
    '执行期': 'bg-green-100 text-green-700',
    '结束期': 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[90vw] max-w-[1200px] h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
              <Building size={24} className="text-brand-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{supplier.name}</h2>
              <span className={cn('px-3 py-1 rounded-full text-sm font-semibold', statusStyles[supplier.status])}>
                {supplier.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'EDIT_SUPPLIER', data: supplier } })}
              className="text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Edit2 size={16} />
              编辑
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'info'
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            基本信息
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'vehicles'
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <Car size={16} />
            名下车辆
            {supplierVehicles.length > 0 && (
              <span className="bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full text-xs">
                {supplierVehicles.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'drivers'
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <Users size={16} />
            名下司机
            {supplierDrivers.length > 0 && (
              <span className="bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full text-xs">
                {supplierDrivers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'activities'
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            参与活动
            {supplierActivities.length > 0 && (
              <span className="bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full text-xs">
                {supplierActivities.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 基本信息 Tab */}
          {activeTab === 'info' && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">供应商类型：</span>
                    <span className="text-slate-900 font-medium">{supplier.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">信用代码：</span>
                    <span className="text-slate-900 font-medium">{supplier.creditCode || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">联系人：</span>
                    <span className="text-slate-900 font-medium">{supplier.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">联系电话：</span>
                    <span className="text-slate-900 font-medium">{supplier.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">备用电话：</span>
                    <span className="text-slate-900 font-medium">{supplier.backupPhone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">公司地址：</span>
                    <span className="text-slate-900 font-medium">{supplier.address || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">合作开始：</span>
                    <span className="text-slate-900 font-medium">{supplier.contractStartDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">合作结束：</span>
                    <span className="text-slate-900 font-medium">{supplier.contractEndDate || '长期合作'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">合同编号：</span>
                    <span className="text-slate-900 font-medium">{supplier.contractNumber || '-'}</span>
                  </div>
                  {supplier.notes && (
                    <div className="col-span-2 flex items-start gap-2">
                      <span className="text-slate-500 w-24">备注：</span>
                      <span className="text-slate-900 font-medium">{supplier.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 附件展示 */}
              {supplier.attachments && ((supplier.attachments.contractFiles?.length || 0) + (supplier.attachments.qualificationFiles?.length || 0) + (supplier.attachments.otherFiles?.length || 0)) > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText size={18} />
                    附件
                  </h3>
                  <div className="space-y-4">
                    {supplier.attachments.contractFiles?.length && supplier.attachments.contractFiles.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-500 mb-2">合同文件</label>
                        <div className="flex gap-2 flex-wrap">
                          {supplier.attachments.contractFiles.map((_, index) => (
                            <div key={index} className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity">
                              <FileText size={24} className="text-slate-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {supplier.attachments.qualificationFiles?.length && supplier.attachments.qualificationFiles.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-500 mb-2">资质文件</label>
                        <div className="flex gap-2 flex-wrap">
                          {supplier.attachments.qualificationFiles.map((_, index) => (
                            <div key={index} className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity">
                              <FileText size={24} className="text-slate-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {supplier.attachments.otherFiles?.length && supplier.attachments.otherFiles.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-500 mb-2">其他文件</label>
                        <div className="flex gap-2 flex-wrap">
                          {supplier.attachments.otherFiles.map((_, index) => (
                            <div key={index} className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity">
                              <FileText size={24} className="text-slate-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 资源统计 */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} />
                  资源统计
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* 车辆统计 */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Car size={18} className="text-blue-500" />
                      <h4 className="font-semibold text-slate-900">车辆资源</h4>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div>
                        <p className="text-xl font-bold text-slate-900">{vehicleStats.total}</p>
                        <p className="text-xs text-slate-500">总数</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-green-600">{vehicleStats.approved}</p>
                        <p className="text-xs text-slate-500">通过</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-amber-600">{vehicleStats.pending}</p>
                        <p className="text-xs text-slate-500">待审核</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-red-600">{vehicleStats.rejected}</p>
                        <p className="text-xs text-slate-500">不通过</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-blue-600">{vehicleStats.available}</p>
                        <p className="text-xs text-slate-500">可用</p>
                      </div>
                    </div>
                  </div>

                  {/* 司机统计 */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users size={18} className="text-green-500" />
                      <h4 className="font-semibold text-slate-900">司机资源</h4>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div>
                        <p className="text-xl font-bold text-slate-900">{driverStats.total}</p>
                        <p className="text-xs text-slate-500">总数</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-green-600">{driverStats.approved}</p>
                        <p className="text-xs text-slate-500">通过</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-amber-600">{driverStats.pending}</p>
                        <p className="text-xs text-slate-500">待审核</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-red-600">{driverStats.rejected}</p>
                        <p className="text-xs text-slate-500">不通过</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-blue-600">{driverStats.available}</p>
                        <p className="text-xs text-slate-500">可用</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 明细车辆 Tab */}
          {activeTab === 'vehicles' && (
            <div>
              {supplierVehicles.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                        <th className="px-4 py-3">车牌号</th>
                        <th className="px-4 py-3">类型</th>
                        <th className="px-4 py-3">品牌</th>
                        <th className="px-4 py-3">核载人数</th>
                        <th className="px-4 py-3">所属活动</th>
                        <th className="px-4 py-3">审核状态</th>
                        <th className="px-4 py-3">当前状态</th>
                        <th className="px-4 py-3">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierVehicles.map(vehicle => {
                        const vehicleActivity = activities.find(a => a.id === vehicle.activityId);
                        return (
                        <tr key={vehicle.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">{vehicle.plateNumber}</td>
                          <td className="px-4 py-3 text-slate-600">{vehicle.type}</td>
                          <td className="px-4 py-3 text-slate-600">{vehicle.brand || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{vehicle.capacity || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{vehicleActivity?.name || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', auditStatusStyles[vehicle.auditStatus])}>
                              {vehicle.auditStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', resourceStatusStyles[vehicle.status])}>
                              {vehicle.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button 
                              onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'VEHICLE_DETAIL', data: vehicle } })}
                              className="text-brand-600 text-sm font-medium flex items-center gap-1"
                            >
                              <Eye size={14} />
                              详情
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <Car size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">该供应商暂无关联车辆</p>
                </div>
              )}
            </div>
          )}

          {/* 名下司机 Tab */}
          {activeTab === 'drivers' && (
            <div>
              {supplierDrivers.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                        <th className="px-4 py-3">姓名</th>
                        <th className="px-4 py-3">手机号</th>
                        <th className="px-4 py-3">驾照类型</th>
                        <th className="px-4 py-3">所属活动</th>
                        <th className="px-4 py-3">审核状态</th>
                        <th className="px-4 py-3">当前状态</th>
                        <th className="px-4 py-3">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierDrivers.map(driver => {
                        const driverActivity = activities.find(a => a.id === driver.activityId);
                        return (
                        <tr key={driver.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">{driver.name}</td>
                          <td className="px-4 py-3 text-slate-600">{driver.phone}</td>
                          <td className="px-4 py-3 text-slate-600">{driver.licenseType}</td>
                          <td className="px-4 py-3 text-slate-600">{driverActivity?.name || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', auditStatusStyles[driver.auditStatus])}>
                              {driver.auditStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', resourceStatusStyles[driver.status])}>
                              {driver.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button 
                              onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'DRIVER_DETAIL', data: driver } })}
                              className="text-brand-600 text-sm font-medium flex items-center gap-1"
                            >
                              <Eye size={14} />
                              详情
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <Users size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">该供应商暂无关联司机</p>
                </div>
              )}
            </div>
          )}

          {/* 参与活动 Tab */}
          {activeTab === 'activities' && (
            <div>
              {supplierActivities.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                        <th className="px-4 py-3">活动名称</th>
                        <th className="px-4 py-3">活动时期</th>
                        <th className="px-4 py-3">活动时间</th>
                        <th className="px-4 py-3">名下车辆数</th>
                        <th className="px-4 py-3">名下司机数</th>
                        <th className="px-4 py-3">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierActivities.map(activity => {
                        const activityVehicles = vehicles.filter(v => 
                          v.activityId === activity.id && v.supplier === supplier.name
                        );
                        const activityDrivers = drivers.filter(d => 
                          d.activityId === activity.id && d.supplier === supplier.name
                        );
                        return (
                        <tr key={activity.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <button 
                              onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'ACTIVITY_DETAIL_READONLY', data: activity } })}
                              className="font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                            >
                              {activity.name}
                              <ChevronRight size={14} />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', activityPeriodStyles[activity.period])}>
                              {activity.period}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{activity.startTime} ~ {activity.endTime}</td>
                          <td className="px-4 py-3 text-slate-600 font-medium">{activityVehicles.length}</td>
                          <td className="px-4 py-3 text-slate-600 font-medium">{activityDrivers.length}</td>
                          <td className="px-4 py-3">
                            <button 
                              onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'ACTIVITY_DETAIL_READONLY', data: activity } })}
                              className="text-brand-600 text-sm font-medium flex items-center gap-1"
                            >
                              <Eye size={14} />
                              详情
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <CalendarDays size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">该供应商暂无参与活动</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 供应商列表视图
export const SuppliersView: React.FC = () => {
  const { suppliers } = useApp();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [nameFilter, setNameFilter] = useState<string>('');

  const filteredSuppliers = suppliers.filter(supplier => {
    if (filterType && supplier.type !== filterType) return false;
    if (filterStatus && supplier.status !== filterStatus) return false;
    if (nameFilter && !supplier.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    return true;
  });

  const statusStyles = {
    '合作中': 'bg-green-100 text-green-700',
    '暂停合作': 'bg-amber-100 text-amber-700',
    '已终止': 'bg-red-100 text-red-700',
  };

  const typeStyles = {
    '租车公司': 'bg-blue-100 text-blue-700',
    '客运公司': 'bg-purple-100 text-purple-700',
    '个人车主': 'bg-green-100 text-green-700',
    '其他': 'bg-slate-100 text-slate-700',
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">供应商管理</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-500 outline-none"
                placeholder="搜索供应商名称"
              />
            </div>
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-500 outline-none"
              >
                <option value="">全部类型</option>
                <option value="租车公司">租车公司</option>
                <option value="客运公司">客运公司</option>
                <option value="个人车主">个人车主</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-500 outline-none"
              >
                <option value="">全部状态</option>
                <option value="合作中">合作中</option>
                <option value="暂停合作">暂停合作</option>
                <option value="已终止">已终止</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map(supplier => (
            <div
              key={supplier.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer"
              onClick={() => setSelectedSupplier(supplier)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                    <Building size={20} className="text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{supplier.name}</h3>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', typeStyles[supplier.type])}>
                      {supplier.type}
                    </span>
                  </div>
                </div>
                <span className={cn('px-2 py-1 rounded-full text-xs font-semibold', statusStyles[supplier.status])}>
                  {supplier.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <span>{supplier.contactName} {supplier.contactPhone}</span>
                </div>
                {supplier.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span>合作自 {supplier.contractStartDate}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="flex gap-1">
                  {supplier.creditCode && (
                    <span className="px-2 py-1 bg-slate-50 rounded text-xs text-slate-500">有资质</span>
                  )}
                </div>
                <button className="text-brand-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                  查看详情 <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSupplier && (
        <SupplierDetail
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      )}
    </>
  );
};

export default SupplierDetail;