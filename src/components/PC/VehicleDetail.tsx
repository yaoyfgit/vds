import React, { useState } from 'react';
import {
  X,
  Car,
  FileText,
  Image,
  CheckCircle2,
  XCircle,
  Download,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import type { Vehicle } from '../../types';

interface VehicleDetailProps {
  vehicle: Vehicle;
  onClose: () => void;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, onClose }) => {
  const { activities, vehicles, dispatch } = useApp();
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [auditRemark, setAuditRemark] = useState('');

  const currentVehicle = vehicles.find((v: Vehicle) => v.id === vehicle.id) || vehicle;
  const activity = activities.find(a => a.id === currentVehicle.activityId);
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
                  <span className="text-slate-500 w-24">联系电话：</span>
                  <span className="text-slate-900 font-medium">{currentVehicle.contactPhone || '-'}</span>
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
    </>
  );
};

export default VehicleDetail;