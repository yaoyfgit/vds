import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Task, Dispatcher, Activity } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ---------- 手机号格式校验 ----------
// 中国大陆 11 位手机号（demo 级别正则，覆盖 13x/14x/15x/16x/17x/18x/19x）
export function isValidChineseMobile(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test((phone || '').trim());
}

// ---------- 调度员 姓名+手机号 合规性校验 ----------
// 规则：
//   同一手机号：① 若已存在记录中 所有姓名 == 当前姓名 → 通过（同一人跨活动允许多条）
//             ② 若已存在记录中 所有姓名 != 当前姓名 → 不通过（被他人占用）
//             ③ 混合（既有相等又有不等） → 数据异常
//   excludeId 用于编辑时排除当前自己
//   context: 'add_edit'（默认，用于新增/编辑弹窗） | 'batch'（用于批量导入预览与提交）
// 示例：
//   validateDispatcherNamePhone(
//     [{id:'1',name:'陈某',phone:'138...'},{id:'2',name:'陈某',phone:'138...'}],
//     '陈某', '138...', '1') -> {ok:true}   // 只排除自己后剩下的那个人也是陈某
export function validateDispatcherNamePhone(
  dispatchers: Dispatcher[],
  currentName: string,
  currentPhone: string,
  excludeId?: string,
  context: 'add_edit' | 'batch' = 'add_edit',
): { ok: true } | { ok: false; message: string } {
  const name = (currentName || '').trim();
  const phone = (currentPhone || '').trim();

  const others = dispatchers.filter((d) => {
    if (excludeId && d.id === excludeId) return false;
    return d.phone === phone;
  });

  if (others.length === 0) return { ok: true };

  const allSameName = others.every((d) => d.name.trim() === name);
  const allDiffName = others.every((d) => d.name.trim() !== name);

  if (allSameName) return { ok: true };
  if (allDiffName) {
    // H.10.2 (add/edit) 与 H.10.3 (batch) 文案不同
    const msg =
      context === 'batch'
        ? '该手机号已被其他姓名的调度员占用'
        : '该手机号已被其他调度员使用，请使用其他手机号';
    return { ok: false, message: msg };
  }
  return {
    ok: false,
    message: '该手机号已被不同姓名的调度员使用，数据异常，请先联系管理员处理',
  };
}

export interface UnfinishedDispatcherTask {
  activityId: string;
  activityName: string;
  taskId: string;
  taskName: string;
}

// ---------- 按调度员姓名+手机号查找未结束任务 ----------
// 匹配条件：task.fieldDispatcher == name 且 task.fieldDispatcherPhone == phone
// "未结束"定义：status ∉ {已完成, 已取消}
export function findUnfinishedTasksForDispatcher(
  tasks: Task[],
  activities: Activity[],
  dispatcherName: string,
  dispatcherPhone: string,
): UnfinishedDispatcherTask[] {
  const name = (dispatcherName || '').trim();
  const phone = (dispatcherPhone || '').trim();
  if (!name && !phone) return [];

  const finishedStatuses: Task['status'][] = ['已完成', '已取消'];
  const activityById = new Map(activities.map((a) => [a.id, a]));

  return tasks
    .filter((t) => {
      const nameMatch = !name || t.fieldDispatcher?.trim() === name;
      const phoneMatch = !phone || t.fieldDispatcherPhone?.trim() === phone;
      if (!(nameMatch && phoneMatch)) return false;
      return !finishedStatuses.includes(t.status);
    })
    .map((t) => ({
      activityId: t.activityId,
      activityName: activityById.get(t.activityId)?.name || '未知活动',
      taskId: t.id,
      taskName: t.name,
    }));
}

// ---------- 将查找结果格式化为弹窗文案 ----------
// 示例：
//   该调度员绑定活动【2026年夏季调研】，尚有未结束任务【VIP接机-李强】、【考察点转场A】。请对相关任务进行处置，待任务办结后再进行删除。
// 若按活动聚合后任务>5条：最多展示 5 个【任务名】，追加"等 N 个任务"
export function formatUnfinishedTaskPrompt(
  results: UnfinishedDispatcherTask[],
  verb: '修改' | '删除',
): string {
  if (results.length === 0) return '';
  // 按 activityId 聚合取第一个活动（需求要求"绑定活动【XXXX】"，若跨多活动则以第一个为主，若有其他活动不额外展开）
  const mainActivity = results[0].activityName;

  const taskNames = results.map((r) => r.taskName);
  const MAX = 5;
  const shown = taskNames.slice(0, MAX).map((n) => `【${n}】`).join('、');
  const tail = taskNames.length > MAX ? ` 等 ${taskNames.length} 个任务` : '';
  return `该调度员绑定活动【${mainActivity}】，尚有未结束任务${shown}${tail}。请对相关任务进行处置，待任务办结后再进行${verb}。`;
}

// ---------- 轻量 CSV 解析 ----------
// 符合 RFC 4180 的核心子集：
//   - 单元格可用双引号包裹，包裹内容允许逗号、双引号（以 "" 转义为一个 "）与换行（\r / \n / \r\n）
//   - 行结束符支持 \r\n、\r、\n 三种
//   - 自动去掉 UTF-8 BOM
// 返回 {headers, rows, truncated}，rows 长度最多 maxRows
export function parseCSV(
  text: string,
  maxRows: number = 500,
): { headers: string[]; rows: Record<string, string>[]; truncated: boolean } {
  const cleaned = (text || '').replace(/^\uFEFF/, '');
  if (!cleaned.trim()) return { headers: [], rows: [], truncated: false };

  // 全量逐字符扫描状态机
  const cellsByLine: string[][] = [];
  let curLine: string[] = [];
  let curCell = '';
  let inQ = false;
  let i = 0;
  while (i < cleaned.length) {
    const c = cleaned[i];
    if (inQ) {
      if (c === '"') {
        // 看下一位是否也是 " —— 标准 CSV 转义
        if (cleaned[i + 1] === '"') {
          curCell += '"';
          i += 2;
          continue;
        } else {
          // 结束引号态
          inQ = false;
          i += 1;
          continue;
        }
      } else {
        // 引号内一切字符原样保留（含逗号、换行、\r）
        curCell += c;
        i += 1;
        continue;
      }
    } else {
      if (c === '"') {
        inQ = true;
        i += 1;
        continue;
      }
      if (c === ',') {
        curLine.push(curCell);
        curCell = '';
        i += 1;
        continue;
      }
      if (c === '\r') {
        if (cleaned[i + 1] === '\n') i += 1; // \r\n 折叠为一次换行
        curLine.push(curCell);
        cellsByLine.push(curLine);
        curLine = [];
        curCell = '';
        i += 1;
        continue;
      }
      if (c === '\n') {
        curLine.push(curCell);
        cellsByLine.push(curLine);
        curLine = [];
        curCell = '';
        i += 1;
        continue;
      }
      curCell += c;
      i += 1;
    }
  }
  // 文件结束：如果还有未 flush 的内容
  if (curCell.length > 0 || curLine.length > 0) {
    curLine.push(curCell);
    cellsByLine.push(curLine);
  }
  // 若引号未闭合（文件结尾），把 inQ 中内容视为最后一个单元格 —— 已自动包含

  // 过滤掉完全空的行（所有单元格均为空字符串且长度为1的）
  const nonEmptyLines = cellsByLine.filter((ln) =>
    !(ln.length === 1 && ln[0] === ''),
  );
  if (nonEmptyLines.length === 0) return { headers: [], rows: [], truncated: false };

  const headers = nonEmptyLines[0].map((s) => s.trim());
  const rawRows = nonEmptyLines.slice(1);
  const truncated = rawRows.length > maxRows;
  const rowsSlice = rawRows.slice(0, maxRows).filter((ln) =>
    !(ln.length === 1 && ln[0].trim() === ''),
  );
  const rows = rowsSlice.map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      // trim 包裹空白（Excel 导出常见 BOM / 空格），保留引号内内容 trim
      const raw = cells[idx] ?? '';
      obj[h] = raw.trim();
    });
    return obj;
  });

  return { headers, rows, truncated };
}

// ---------- 调度员导入 CSV 模板 ----------
export const DISPATCHER_IMPORT_HEADERS = [
  '单位名称',
  '调度员姓名',
  '手机号',
  '所属活动名称',
  '职务',
  '身份证号',
] as const;

export function buildDispatcherTemplateCSV(): string {
  const BOM = '\uFEFF';
  const header = DISPATCHER_IMPORT_HEADERS.join(',');
  const sampleRows = [
    '"政府办","陈某","13800001111","2026年夏季调研活动","现场调度员","110101199001011234"',
    '"接待办","李某","13800002222","2026年夏季调研活动","调度科科长",""',
  ].join('\n');
  return `${BOM}${header}\n${sampleRows}\n`;
}

// 触发浏览器下载文本文件
export function downloadTextAsFile(filename: string, content: string, mime = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// 异常类型定义
export interface AbnormalRule {
  code: string;
  name: string;
  description: string;
}

// 判断任务异常类型
export function getTaskAbnormalRules(task: Task): AbnormalRule[] {
  const now = new Date();
  const rules: AbnormalRule[] = [];
  
  // E1 派发超时：待接收超过30分钟
  if (task.status === '待接收' && task.history) {
    const receiveHistory = task.history.find(h => h.status === '待接收');
    if (receiveHistory) {
      const receiveTime = new Date(receiveHistory.time);
      const diffMinutes = (now.getTime() - receiveTime.getTime()) / (1000 * 60);
      if (diffMinutes > 30) {
        rules.push({
          code: 'E1',
          name: '派发超时',
          description: `已超时 ${Math.floor(diffMinutes)} 分钟`
        });
      }
    }
  }
  
  // E2 拒绝未改派：已拒绝超过10分钟
  if (task.status === '已拒绝' && task.history) {
    const rejectHistory = task.history.find(h => h.status === '已拒绝');
    if (rejectHistory) {
      const rejectTime = new Date(rejectHistory.time);
      const diffMinutes = (now.getTime() - rejectTime.getTime()) / (1000 * 60);
      if (diffMinutes > 10) {
        rules.push({
          code: 'E2',
          name: '拒绝未改派',
          description: `已拒绝 ${Math.floor(diffMinutes)} 分钟`
        });
      }
    }
  }
  
  // E3 到时未执行：已过计划开始时间仍未执行
  if (['待派发', '待接收', '已接收'].includes(task.status)) {
    const taskStartTime = new Date(`${task.date}T${task.startTime}`);
    if (now > taskStartTime) {
      const diffMinutes = (now.getTime() - taskStartTime.getTime()) / (1000 * 60);
      rules.push({
        code: 'E3',
        name: '到时未执行',
        description: `已超时 ${Math.floor(diffMinutes)} 分钟`
      });
    }
  }
  
  // E4 执行超时：已过计划结束时间仍在执行
  if (task.status === '执行中') {
    const taskEndTime = new Date(`${task.date}T${task.endTime}`);
    if (now > taskEndTime) {
      const diffMinutes = (now.getTime() - taskEndTime.getTime()) / (1000 * 60);
      rules.push({
        code: 'E4',
        name: '执行超时',
        description: `已超时 ${Math.floor(diffMinutes)} 分钟`
      });
    }
  }
  
  return rules;
}

// 判断任务是否异常
export function isTaskAbnormal(task: Task): boolean {
  return getTaskAbnormalRules(task).length > 0;
}

// 获取异常类型对应的颜色
export function getAbnormalColor(code: string): { bg: string; border: string; text: string; labelBg: string; labelText: string } {
  const redColors = ['E1', 'E2', 'E6'];
  const yellowColors = ['E3', 'E4', 'E5'];
  
  if (redColors.includes(code)) {
    return {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-700',
      labelBg: 'bg-red-100',
      labelText: 'text-red-600'
    };
  } else if (yellowColors.includes(code)) {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-500',
      text: 'text-amber-700',
      labelBg: 'bg-amber-100',
      labelText: 'text-amber-600'
    };
  }
  return {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-700',
    labelBg: 'bg-slate-100',
    labelText: 'text-slate-600'
  };
}
