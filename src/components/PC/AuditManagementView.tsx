import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import VehicleDetail from './VehicleDetail';
import DriverDetail from './DriverDetail';
import type { Vehicle, Driver } from '../../types';

const AuditManagementView = () => {
  const { vehicles, drivers, activities, auditRecords, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activityFilter, setActivityFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<'approve' | 'reject'>('approve');
  const [batchRemark, setBatchRemark] = useState('');

  const pendingVehicles = vehicles.filter(v => v.auditStatus === '待审核');
  const pendingDrivers = drivers.filter(d => d.auditStatus === '待审核');

  const pendingResources = [
    ...pendingVehicles.map(v => ({ ...v, resourceType: 'vehicle' as const })),
    ...pendingDrivers.map(d => ({ ...d, resourceType: 'driver' as const }))
  ];

  const filteredPendingResources = pendingResources.filter(item => {
    if (typeFilter && item.resourceType !== typeFilter) return false;
    if (activityFilter && item.activityId !== activityFilter) return false;
    if (supplierFilter && item.supplier !== supplierFilter) return false;
    return true;
  });

  const uniqueSuppliers = [...new Set([
    ...pendingVehicles.map(v => v.supplier),
    ...pendingDrivers.map(d => d.supplier)
  ].filter(Boolean))];

  const filteredAuditRecords = auditRecords.filter(record => {
    if (typeFilter && record.resourceType !== typeFilter) return false;
    if (activityFilter && record.activityId !== activityFilter) return false;
    if (supplierFilter && record.supplier !== supplierFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.auditTime).getTime() - new Date(a.auditTime).getTime());

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredPendingResources.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredPendingResources.map(item => item.id));
    }
  };

  const handleBatchAudit = () => {
    selectedItems.forEach(id => {
      const vehicle = vehicles.find(v => v.id === id);
      const driver = drivers.find(d => d.id === id);
      
      if (vehicle) {
        dispatch({
          type: 'UPDATE_VEHICLE',
          payload: {
            id: vehicle.id,
            data: {
              auditStatus: batchAction === 'approve' ? '审核通过' : '审核不通过',
              status: batchAction === 'approve' ? '可调配' : '可调配',
              auditRemark: batchAction === 'reject' ? batchRemark : undefined
            }
          }
        });
        dispatch({
          type: 'ADD_AUDIT_RECORD',
          payload: {
            id: `audit-${Date.now()}`,
            resourceType: 'vehicle',
            resourceId: vehicle.id,
            resourceName: vehicle.plateNumber,
            supplier: vehicle.supplier,
            activityId: vehicle.activityId,
            activityName: activities.find(a => a.id === vehicle.activityId)?.name,
            submitTime: new Date().toISOString(),
            auditResult: batchAction === 'approve' ? '通过' : '驳回',
            auditRemark: batchAction === 'reject' ? batchRemark : undefined,
            auditor: '王主管',
            auditTime: new Date().toISOString()
          }
        });
      } else if (driver) {
        dispatch({
          type: 'UPDATE_DRIVER',
          payload: {
            id: driver.id,
            data: {
              auditStatus: batchAction === 'approve' ? '审核通过' : '审核不通过',
              status: batchAction === 'approve' ? '可调配' : '可调配',
              auditRemark: batchAction === 'reject' ? batchRemark : undefined
            }
          }
        });
        dispatch({
          type: 'ADD_AUDIT_RECORD',
          payload: {
            id: `audit-${Date.now()}`,
            resourceType: 'driver',
            resourceId: driver.id,
            resourceName: driver.name,
            supplier: driver.supplier,
            activityId: driver.activityId,
            activityName: activities.find(a => a.id === driver.activityId)?.name,
            submitTime: new Date().toISOString(),
            auditResult: batchAction === 'approve' ? '通过' : '驳回',
            auditRemark: batchAction === 'reject' ? batchRemark : undefined,
            auditor: '王主管',
            auditTime: new Date().toISOString()
          }
        });
      }
    });
    setShowBatchModal(false);
    setSelectedItems([]);
    setBatchRemark('');
  };

  const handleAudit = (item: typeof pendingResources[0], action: 'approve' | 'reject', remark?: string) => {
    if (item.resourceType === 'vehicle') {
      dispatch({
        type: 'UPDATE_VEHICLE',
        payload: {
          id: item.id,
          data: {
            auditStatus: action === 'approve' ? '审核通过' : '审核不通过',
            status: action === 'approve' ? '可调配' : '可调配',
            auditRemark: action === 'reject' ? remark : undefined
          }
        }
      });
      dispatch({
        type: 'ADD_AUDIT_RECORD',
        payload: {
          id: `audit-${Date.now()}`,
          resourceType: 'vehicle',
          resourceId: item.id,
          resourceName: item.plateNumber,
          supplier: item.supplier,
          activityId: item.activityId,
          activityName: activities.find(a => a.id === item.activityId)?.name,
          submitTime: new Date().toISOString(),
          auditResult: action === 'approve' ? '通过' : '驳回',
          auditRemark: action === 'reject' ? remark : undefined,
          auditor: '王主管',
          auditTime: new Date().toISOString()
        }
      });
    } else {
      dispatch({
        type: 'UPDATE_DRIVER',
        payload: {
          id: item.id,
          data: {
            auditStatus: action === 'approve' ? '审核通过' : '审核不通过',
            status: action === 'approve' ? '可调配' : '可调配',
            auditRemark: action === 'reject' ? remark : undefined
          }
        }
      });
      dispatch({
        type: 'ADD_AUDIT_RECORD',
        payload: {
          id: `audit-${Date.now()}`,
          resourceType: 'driver',
          resourceId: item.id,
          resourceName: item.name,
          supplier: item.supplier,
          activityId: item.activityId,
          activityName: activities.find(a => a.id === item.activityId)?.name,
          submitTime: new Date().toISOString(),
          auditResult: action === 'approve' ? '通过' : '驳回',
          auditRemark: action === 'reject' ? remark : undefined,
          auditor: '王主管',
          auditTime: new Date().toISOString()
        }
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">资源审核管理</h2>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'pending'
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                )}
              >
                待审核 ({pendingResources.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'history'
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                )}
              >
                审核记录 ({auditRecords.length})
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'pending' && (
          <>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <label className="block text-sm font-medium text-slate-700 mb-1">类型筛选</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
                >
                  <option value="">全部类型</option>
                  <option value="vehicle">车辆</option>
                  <option value="driver">司机</option>
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    {selectedItems.length === filteredPendingResources.length && filteredPendingResources.length > 0 ? (
                      <CheckSquare size={20} />
                    ) : (
                      <Square size={20} />
                    )}
                  </button>
                  <span className="text-sm text-slate-600">全选</span>
                </div>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">已选择 {selectedItems.length} 项</span>
                    <button
                      onClick={() => {
                        setBatchAction('approve');
                        setShowBatchModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      批量通过
                    </button>
                    <button
                      onClick={() => {
                        setBatchAction('reject');
                        setShowBatchModal(true);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      批量驳回
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">选择</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">名称</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">供应商</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">关联活动</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredPendingResources.map(item => {
                      const activity = activities.find(a => a.id === item.activityId);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleSelectItem(item.id)}
                              className="text-slate-500 hover:text-slate-700"
                            >
                              {selectedItems.includes(item.id) ? (
                                <CheckSquare size={18} />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              item.resourceType === 'vehicle'
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            )}>
                              {item.resourceType === 'vehicle' ? '车辆' : '司机'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {item.resourceType === 'vehicle' ? item.plateNumber : item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {item.supplier}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {activity?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (item.resourceType === 'vehicle') {
                                    setSelectedVehicle(item as Vehicle);
                                  } else {
                                    setSelectedDriver(item as Driver);
                                  }
                                }}
                                className="text-brand-600 hover:text-brand-800 flex items-center gap-1"
                              >
                                <Eye size={14} />
                                详情
                              </button>
                              <button
                                onClick={() => handleAudit(item, 'approve')}
                                className="text-green-600 hover:text-green-800 flex items-center gap-1"
                              >
                                <CheckCircle2 size={14} />
                                通过
                              </button>
                              <button
                                onClick={() => {
                                  const remark = prompt('请输入驳回原因：');
                                  if (remark) {
                                    handleAudit(item, 'reject', remark);
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 flex items-center gap-1"
                              >
                                <XCircle size={14} />
                                驳回
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredPendingResources.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-500">
                  暂无待审核资源
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <label className="block text-sm font-medium text-slate-700 mb-1">类型筛选</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none"
                >
                  <option value="">全部类型</option>
                  <option value="vehicle">车辆</option>
                  <option value="driver">司机</option>
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
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">资源名称</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">供应商</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">关联活动</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">审核结果</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">驳回原因</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">审核人</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">审核时间</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredAuditRecords.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            record.resourceType === 'vehicle'
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          )}>
                            {record.resourceType === 'vehicle' ? '车辆' : '司机'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {record.resourceName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {record.supplier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {record.activityName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            record.auditResult === '通过'
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}>
                            {record.auditResult}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {record.auditRemark || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {record.auditor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(record.auditTime).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredAuditRecords.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-500">
                  暂无审核记录
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selectedVehicle && (
        <VehicleDetail
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}

      {selectedDriver && (
        <DriverDetail
          driver={selectedDriver}
          onClose={() => setSelectedDriver(null)}
        />
      )}

      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[480px] p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {batchAction === 'approve' ? '批量通过' : '批量驳回'}
            </h3>
            
            {batchAction === 'reject' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">驳回原因（必填）</label>
                <textarea
                  value={batchRemark}
                  onChange={(e) => setBatchRemark(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:border-brand-500 outline-none resize-none"
                  rows={3}
                  placeholder="请输入驳回原因..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowBatchModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchAudit}
                disabled={batchAction === 'reject' && !batchRemark.trim()}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg font-medium",
                  batchAction === 'approve'
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white",
                  (batchAction === 'reject' && !batchRemark.trim()) && "opacity-50 cursor-not-allowed"
                )}
              >
                确认{batchAction === 'approve' ? '通过' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuditManagementView;