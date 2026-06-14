import React, { useState } from 'react';
import {
  X,
  Users,
  FileText,
  Image,
  CheckCircle2,
  XCircle,
  Edit2,
  Download,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import type { Driver } from '../../types';

interface DriverDetailProps {
  driver: Driver;
  onClose: () => void;
}

const DriverDetail: React.FC<DriverDetailProps> = ({ driver, onClose }) => {
  const { activities, dispatch } = useApp();
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [auditRemark, setAuditRemark] = useState('');

  const activity = activities.find(a => a.id === driver.activityId);
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
      type: 'UPDATE_DRIVER',
      payload: {
        id: driver.id,
        data: {
          auditStatus: newStatus,
          status: auditAction === 'approve' ? '可调配' : '可调配',
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
                <Users size={24} className="text-brand-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{driver.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('px-3 py-1 rounded-full text-sm font-semibold', statusStyles[driver.status])}>
                    {driver.status}
                  </span>
                  <span className={cn('px-3 py-1 rounded-full text-sm font-semibold', auditStatusStyles[driver.auditStatus])}>
                    {driver.auditStatus}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {driver.auditStatus === '待审核' && (
                <button
                  onClick={() => setShowAuditModal(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <FileText size={16} />
                  审核
                </button>
              )}
              <button className="text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2">
                <Edit2 size={16} />
                编辑
              </button>
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
                <Users size={18} />
                基本信息
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">姓名：</span>
                  <span className="text-slate-900 font-medium">{driver.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">手机号：</span>
                  <span className="text-slate-900 font-medium">{driver.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">身份证号：</span>
                  <span className="text-slate-900 font-medium">{driver.idCardNumber || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">驾照类型：</span>
                  <span className="text-slate-900 font-medium">{driver.licenseType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">驾照有效期：</span>
                  <span className="text-slate-900 font-medium">{driver.licenseExpiry || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">所属供应商：</span>
                  <span className="text-slate-900 font-medium">{driver.supplier}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">所属活动：</span>
                  <span className="text-slate-900 font-medium">{activity?.name || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">可用日期：</span>
                  <span className="text-slate-900 font-medium">
                    {driver.availableRanges.length > 0 
                      ? `${driver.availableRanges[0].from} 至 ${driver.availableRanges[0].to}` 
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">紧急联系人：</span>
                  <span className="text-slate-900 font-medium">{driver.emergencyContact || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">紧急联系电话：</span>
                  <span className="text-slate-900 font-medium">{driver.emergencyPhone || '-'}</span>
                </div>
                {driver.unavailableReason && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">不可用原因：</span>
                    <span className="text-red-600 font-medium">{driver.unavailableReason}</span>
                  </div>
                )}
                {driver.auditRemark && driver.auditStatus === '审核不通过' && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-24">驳回原因：</span>
                    <span className="text-red-600 font-medium">{driver.auditRemark}</span>
                  </div>
                )}
                {driver.notes && (
                  <div className="col-span-2 flex items-start gap-2">
                    <span className="text-slate-500 w-24">备注：</span>
                    <span className="text-slate-900 font-medium">{driver.notes}</span>
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
              
              {/* 驾驶证正本 */}
              {driver.auditMaterials.licenseFront.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">驾驶证正本</h4>
                  <div className="flex gap-2 flex-wrap">
                    {driver.auditMaterials.licenseFront.map((_, index) => (
                      <div
                        key={index}
                        className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <CreditCard size={24} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 驾驶证副本 */}
              {driver.auditMaterials.licenseBack.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">驾驶证副本</h4>
                  <div className="flex gap-2 flex-wrap">
                    {driver.auditMaterials.licenseBack.map((_, index) => (
                      <div
                        key={index}
                        className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <CreditCard size={24} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 其他材料 */}
              {driver.auditMaterials.other.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">其他材料</h4>
                  <div className="flex gap-2">
                    {driver.auditMaterials.other.map((_, index) => (
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
              {(driver.auditMaterials.licenseFront.length === 0 || 
               driver.auditMaterials.licenseBack.length === 0) && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-semibold">审核材料不完整</p>
                    <p>缺少：{driver.auditMaterials.licenseFront.length === 0 && '驾驶证正本 '}
                      {driver.auditMaterials.licenseBack.length === 0 && '驾驶证副本'}</p>
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
            <h3 className="text-lg font-bold text-slate-900 mb-4">审核司机</h3>
            
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

export default DriverDetail;