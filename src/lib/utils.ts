import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Task } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
