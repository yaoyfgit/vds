import React, { useState } from 'react';
import {
  X,
  Car,
  FileText,
  Image,
  CheckCircle2,
  XCircle,
  Download,
  AlertCircle,
  User,
  MapPin,
  Plus,
  Check,
  Link2,
  Unlink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import type { Vehicle } from '../../types';

interface VehicleDetailProps {
  vehicle: Vehicle;
  onClose: () => void;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, onClose }) => {
  const { activities, vehicles, drivers, dispatch } = useApp();
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [auditRemark, setAuditRemark] = useState('');
  const [showBindDriverModal, setShowBindDriverModal] = useState(false);
  const [showBindLocationModal, setShowBindLocationModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const currentVehicle = vehicles.find((v: Vehicle) => v.id === vehicle.id) || vehicle;
  const activity = activities.find(a => a.id === currentVehicle.activityId);
  const defaultDriver = drivers.find(d => d.id === currentVehicle.defaultDriverId);
  
  const availableDrivers = drivers.filter(d => 
    d.supplier === currentVehicle.supplier && 
    d.licenseType === currentVehicle.licenseRequired &&
    d.auditStatus === '审核通过' &&
    d.status === '可调配'
  );

  const allLocations = [...new Set(activities.map(a => a.location))];

  const statusStyles = {
    '可调配': 'bg-green-100 text-green-700',
    '已调度': 'bg-blue-100 text-blue-700',
    '执行中': 'bg-blue-100 text-blue-700',
    '不可用': 'bg-red-100 text-red-700',
  };

  const auditStatusStyles = {
    '待审核': 'bg-amber-100 text-amber-700',
    '审核通过': 'bg-green-100 text-green-700',
    '审核不通过': 'bg-red-100 text-red-700',
  };

  const handleAudit = () => {
    const newStatus = auditAction === 'approve' ? '审核通过' : '审核不通过';
    dispatch({
      type: 'UPDATE_VEHICLE',
      payload: {
        id: currentVehicle.id,
        data: {
          auditStatus: newStatus,
          status: auditAction === 'approve' ? '可调配' : '不可用',
          auditRemark: auditAction === 'reject' ? auditRemark : undefined
        }
      }
    });
    setShowAuditModal(false);
    setAuditRemark('');
  };

  const handleBindDriver = () => {
    if (selectedDriverId) {
      dispatch({
        type: 'BIND_DEFAULT_DRIVER',
        payload: { vehicleId: currentVehicle.id, driverId: selectedDriverId }
      });
      setShowBindDriverModal(false);
      setSelectedDriverId('');
    }
  };

  const handleUnbindDriver = () => {
    if (confirm('确认解除绑定默认司机？')) {
      dispatch({
        type: 'UNBIND_DEFAULT_DRIVER',
        payload: { vehicleId: currentVehicle.id }
      });
    }
  };

  const handleBindLocations = () => {
    dispatch({
      type: 'BIND_ACTIVITY_LOCATION',
      payload: { vehicleId: currentVehicle.id, locations: selectedLocations }
    });
    setShowBindLocationModal(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-[90vw] max-w-[1000px] h-[85vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                  <Car size={24} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{currentVehicle.plateNumber}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('px-3 py-1 rounded-full text-sm font-semibold', statusStyles[currentVehicle.status])}>
                      {currentVehicle.status}
                    </span>
                    <span className={cn('px-3 py-1 rounded-full text-sm font-semibold', auditStatusStyles[currentVehicle.auditStatus])}>
                      {currentVehicle.auditStatus}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentVehicle.auditStatus === '待审核' && (
                  <button
                    onClick={() => setShowAuditModal(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <FileText size={16} />
                    审核
                  </button>
                )}
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
            </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 基本信息 */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={18} />
                基本信息
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">车辆类型：</span>
                  <span className="text-slate-900 font-medium">{currentVehicle.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">品牌型号：</span>
                  <span className="text-slate-900 font-medium">{currentVehicle.brand}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">核载人数：</span>
                  <span className="text-slate-900 font-medium">{currentVehicle.capacity}人（不含司机）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">车辆颜色：</span>
                  <span className="text-slate-900 font-medium">{currentVehicle.color || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">适用驾照：</span>
                  <span className="text-slate-900 font-medium">{currentVehicle.licenseRequired}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">所属供应商：</span>
                  <span className="text-slate-900 font-medium">{currentVehicle.supplier}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">所属活动：</span>
                  <span className="text-slate-900 font-medium">{activity?.name || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">可用日期：</span>
                  <span className="text-slate-900 font-medium">
                    {currentVehicle.availableRanges.length > 0 
                      ? `${currentVehicle.availableRanges[0].from} 至 ${currentVehicle.availableRanges[0].to}` 
                      : '-'}
                  </span>
                </div>
                {currentVehicle.unavailableReason && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">不可用原因：</span>
                    <span className="text-red-600 font-medium">{currentVehicle.unavailableReason}</span>
                  </div>
                )}
                {currentVehicle.auditRemark && currentVehicle.auditStatus === '审核不通过' && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">驳回原因：</span>
                    <span className="text-red-600 font-medium">{currentVehicle.auditRemark}</span>
                  </div>
                )}
                {currentVehicle.notes && (
                  <div className="col-span-2 flex items-start gap-2">
                    <span className="text-slate-500 w-24">备注：</span>
                    <span className="text-slate-900 font-medium">{currentVehicle.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 绑定信息 */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Link2 size={18} />
                绑定设置
              </h3>
              
              {/* 绑定默认司机 */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">默认司机</h4>
                      <p className="text-sm text-slate-500">优先派车给绑定的司机</p>
                    </div>
                  </div>
                  {currentVehicle.auditStatus === '审核通过' && currentVehicle.status === '可调配' && (
                    <button
                      onClick={() => setShowBindDriverModal(true)}
                      className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      {defaultDriver ? '修改绑定' : '绑定司机'}
                    </button>
                  )}
                </div>
                {defaultDriver ? (
                  <div className="mt-4 flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{defaultDriver.name}</p>
                        <p className="text-xs text-slate-500">{defaultDriver.phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleUnbindDriver}
                      className="text-red-500 hover:text-red-600 p-1"
                      title="解除绑定"
                    >
                      <Unlink size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-dashed border-slate-200 text-center">
                    <User size={24} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">暂无绑定司机</p>
                  </div>
                )}
              </div>

              {/* 绑定活动地点 */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin size={18} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">活动地点</h4>
                      <p className="text-sm text-slate-500">活动地点有权限调用</p>
                    </div>
                  </div>
                  {currentVehicle.auditStatus === '审核通过' && currentVehicle.status === '可调配' && (
                    <button
                      onClick={() => setShowBindLocationModal(true)}
                      className="text-green-600 text-sm font-medium hover:text-green-700 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      {currentVehicle.activityLocations.length > 0 ? '修改绑定' : '绑定地点'}
                    </button>
                  )}
                </div>
                {currentVehicle.activityLocations.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentVehicle.activityLocations.map((location, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1"
                      >
                        <Check size={14} />
                        {location}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-dashed border-slate-200 text-center">
                    <MapPin size={24} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">暂无绑定地点（可调度所有地点）</p>
                  </div>
                )}
              </div>
            </div>

            {/* 审核材料 */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Image size={18} />
                审核材料
              </h3>
              
              {/* 车辆照片 */}
              {currentVehicle.auditMaterials.vehiclePhotos.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">车辆照片</h4>
                  <div className="flex gap-2 flex-wrap">
                    {currentVehicle.auditMaterials.vehiclePhotos.map((_, index) => (
                      <div
                        key={index}
                        className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Image size={24} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 年检合格证 */}
              {currentVehicle.auditMaterials.inspectionCert.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">年检合格证</h4>
                  <div className="flex gap-2">
                    {currentVehicle.auditMaterials.inspectionCert.map((_, index) => (
                      <button
                        key={index}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-sm text-slate-700">年检合格证{index + 1}.pdf</span>
                        <Download size={14} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 保险单 */}
              {currentVehicle.auditMaterials.insurance.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">保险单</h4>
                  <div className="flex gap-2">
                    {currentVehicle.auditMaterials.insurance.map((_, index) => (
                      <button
                        key={index}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <FileText size={16} className="text-green-500" />
                        <span className="text-sm text-slate-700">保险单{index + 1}.pdf</span>
                        <Download size={14} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 其他材料 */}
              {currentVehicle.auditMaterials.other.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">其他材料</h4>
                  <div className="flex gap-2">
                    {currentVehicle.auditMaterials.other.map((_, index) => (
                      <button
                        key={index}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <FileText size={16} className="text-purple-500" />
                        <span className="text-sm text-slate-700">其他材料{index + 1}.pdf</span>
                        <Download size={14} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 材料缺失提示 */}
              {(currentVehicle.auditMaterials.vehiclePhotos.length === 0 || 
               currentVehicle.auditMaterials.inspectionCert.length === 0 || 
               currentVehicle.auditMaterials.insurance.length === 0) && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-semibold">审核材料不完整</p>
                    <p>缺少：{currentVehicle.auditMaterials.vehiclePhotos.length === 0 && '车辆照片 '}
                      {currentVehicle.auditMaterials.inspectionCert.length === 0 && '年检合格证 '}
                      {currentVehicle.auditMaterials.insurance.length === 0 && '保险单'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 审核弹窗 */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[480px] p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">审核车辆</h3>
            
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setAuditAction('approve')}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  auditAction === 'approve'
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200 hover:border-green-300"
                )}
              >
                <CheckCircle2 size={32} className={cn(auditAction === 'approve' ? 'text-green-600' : 'text-slate-400')} />
                <span className={cn("font-semibold", auditAction === 'approve' ? 'text-green-700' : 'text-slate-600')}>审核通过</span>
              </button>
              <button
                onClick={() => setAuditAction('reject')}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  auditAction === 'reject'
                    ? "border-red-500 bg-red-50"
                    : "border-slate-200 hover:border-red-300"
                )}
              >
                <XCircle size={32} className={cn(auditAction === 'reject' ? 'text-red-600' : 'text-slate-400')} />
                <span className={cn("font-semibold", auditAction === 'reject' ? 'text-red-700' : 'text-slate-600')}>驳回</span>
              </button>
            </div>

            {auditAction === 'reject' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">驳回原因（必填）</label>
                <textarea
                  value={auditRemark}
                  onChange={(e) => setAuditRemark(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:border-brand-500 outline-none resize-none"
                  rows={3}
                  placeholder="请输入驳回原因..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowAuditModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleAudit}
                disabled={auditAction === 'reject' && !auditRemark.trim()}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg font-medium",
                  auditAction === 'approve'
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white",
                  (auditAction === 'reject' && !auditRemark.trim()) && "opacity-50 cursor-not-allowed"
                )}
              >
                {auditAction === 'approve' ? '通过' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 绑定司机弹窗 */}
      {showBindDriverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[500px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">绑定默认司机</h3>
              <button onClick={() => setShowBindDriverModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <p className="font-medium">筛选条件：</p>
                <p>供应商：{currentVehicle.supplier} | 驾照类型：{currentVehicle.licenseRequired}</p>
              </div>

              {availableDrivers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <User size={32} className="text-slate-300 mx-auto mb-2" />
                  <p>暂无符合条件的司机</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableDrivers.map(driver => (
                    <label
                      key={driver.id}
                      className={cn(
                        "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                        selectedDriverId === driver.id
                          ? "border-brand-500 bg-brand-50"
                          : "border-slate-200 hover:border-brand-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="driver"
                        checked={selectedDriverId === driver.id}
                        onChange={() => setSelectedDriverId(driver.id)}
                        className="w-4 h-4 text-brand-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{driver.name}</span>
                          <span className="text-xs text-slate-500">{driver.phone}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          驾照类型：{driver.licenseType} | 状态：{driver.status}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowBindDriverModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleBindDriver}
                disabled={!selectedDriverId}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                确认绑定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 绑定活动地点弹窗 */}
      {showBindLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[500px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">绑定活动地点</h3>
              <button onClick={() => setShowBindLocationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                <p className="font-medium">选择活动地点有权限调用（多选）</p>
              </div>

              {allLocations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MapPin size={32} className="text-slate-300 mx-auto mb-2" />
                  <p>暂无活动地点</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allLocations.map(location => (
                    <label
                      key={location}
                      className={cn(
                        "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                        selectedLocations.includes(location)
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 hover:border-green-300"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(location)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLocations([...selectedLocations, location]);
                          } else {
                            setSelectedLocations(selectedLocations.filter(l => l !== location));
                          }
                        }}
                        className="w-4 h-4 text-green-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-slate-900">{location}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowBindLocationModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleBindLocations}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
              >
                确认绑定 ({selectedLocations.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VehicleDetail;