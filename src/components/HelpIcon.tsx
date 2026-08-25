import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { HelpData } from '../constants/helpData';

interface HelpIconProps {
  helpData: HelpData;
  /** 自定义按钮样式（用于适配深色背景等场景） */
  className?: string;
}

const HelpIcon: React.FC<HelpIconProps> = ({ helpData, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className || "p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"}
        title="帮助"
      >
        <HelpCircle size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{helpData.title}</h3>
                {helpData.description && (
                  <p className="text-sm text-slate-500 mt-1">{helpData.description}</p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 rounded-l-lg">触发对象</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">触发动作</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">响应条件</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">响应对象</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">响应动作</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 rounded-r-lg">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {helpData.table.map((item, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      >
                        <td className="px-4 py-3 border-b border-slate-100">{item.triggerObject}</td>
                        <td className="px-4 py-3 border-b border-slate-100">{item.triggerAction}</td>
                        <td className="px-4 py-3 border-b border-slate-100">{item.responseCondition}</td>
                        <td className="px-4 py-3 border-b border-slate-100">{item.responseObject}</td>
                        <td className="px-4 py-3 border-b border-slate-100">{item.responseAction}</td>
                        <td className="px-4 py-3 border-b border-slate-100">{item.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpIcon;