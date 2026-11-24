/**
 * 用车需求文本识别：从粘贴的文本（微信消息、通知邮件等）中提取任务字段。
 * 支持：出发地/目的地、用车日期时间、乘车人、联系电话、乘车人数、任务类型推断。
 * 提取失败的字段返回 undefined，由调用方判断填入哪些字段。
 */

export interface ParsedTaskFields {
  name?: string;
  type?: string;
  date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  from?: string;
  to?: string;
  passenger?: string;
  passengerPhone?: string;
  passengerCount?: number;
  /** 已成功识别的字段名称列表，用于界面反馈 */
  recognized: string[];
}

// 分句停顿字符（用于正则字符类，注意不含方括号）
const CN_FIELD_STOP = '\\n，,。；;！!？?';

// 两位补零
const pad = (n: number) => String(n).padStart(2, '0');

const isValidYMD = (y: number, m: number, d: number) =>
  y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31;

const isValidHM = (h: number, m: number) => h >= 0 && h <= 23 && m >= 0 && m <= 59;

export function parseTaskText(raw: string): ParsedTaskFields {
  const text = (raw || '').trim();
  const result: ParsedTaskFields = { recognized: [] };
  if (!text) return result;

  // ---- 联系电话（先提取，后续解析用去电话后的文本，避免干扰人数/日期识别）----
  const phoneMatch = text.match(/1[3-9]\d{9}/);
  if (phoneMatch) {
    result.passengerPhone = phoneMatch[0];
    result.recognized.push('联系电话');
  }
  const textNoPhone = phoneMatch ? text.replace(phoneMatch[0], '') : text;

  // ---- 乘车人数 ----
  let countMatch = textNoPhone.match(/(?:乘车|乘坐|乘客)(?:人)?(?:数)?[：:为]?\s*(\d{1,2})\s*人?/);
  if (!countMatch) {
    countMatch = textNoPhone.match(/(?<![0-9:])(\d{1,2})\s*人/);
  }
  if (countMatch) {
    const n = parseInt(countMatch[1], 10);
    if (n > 0 && n <= 99) {
      result.passengerCount = n;
      result.recognized.push('乘车人数');
    }
  }

  // ---- 日期（支持 2026-06-12 / 2026年6月12日 / 6月12日）----
  const dates: string[] = [];
  const now = new Date();
  const fullDateRe = /(\d{4})[年\-/.](\d{1,2})[月\-/.](\d{1,2})[日号]?/g;
  let m: RegExpExecArray | null;
  while ((m = fullDateRe.exec(textNoPhone))) {
    const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (isValidYMD(y, mo, d)) dates.push(`${y}-${pad(mo)}-${pad(d)}`);
  }
  const shortDateRe = /(?<!\d)(\d{1,2})月(\d{1,2})[日号]/g;
  while ((m = shortDateRe.exec(textNoPhone))) {
    const mo = parseInt(m[1], 10), d = parseInt(m[2], 10);
    const y = now.getFullYear();
    if (isValidYMD(y, mo, d)) dates.push(`${y}-${pad(mo)}-${pad(d)}`);
  }
  // 去重保序
  const uniqDates = [...new Set(dates)];
  if (uniqDates[0]) {
    result.date = uniqDates[0];
    result.endDate = uniqDates[1] || uniqDates[0];
    result.recognized.push(uniqDates[1] ? '起止日期' : '用车日期');
  }

  // ---- 时间（支持 14:30 / 14点30 / 下午2点半 / 上午9时）----
  const times: string[] = [];
  const timeRe = /(上午|早上|凌晨|中午|下午|傍晚|晚上|今晚|明晚)?\s*(\d{1,2})[点时:：]\s*(?:(\d{1,2})分?|(半))?/g;
  while ((m = timeRe.exec(textNoPhone))) {
    let h = parseInt(m[2], 10);
    let min = m[3] ? parseInt(m[3], 10) : (m[4] === '半' ? 30 : 0);
    const meridiem = m[1] || '';
    if (/下午|傍晚|晚上|今晚|明晚/.test(meridiem) && h < 12) h += 12;
    if (/中午/.test(meridiem) && h === 12) h = 12;
    if (/上午|早上|凌晨/.test(meridiem) && h === 12) h = 0;
    if (isValidHM(h, min)) times.push(`${pad(h)}:${pad(min)}`);
  }
  const uniqTimes = [...new Set(times)];
  if (uniqTimes[0]) {
    result.startTime = uniqTimes[0];
    result.endTime = uniqTimes[1] || uniqTimes[0];
    result.recognized.push(uniqTimes[1] ? '起止时间' : '用车时间');
  }

  // ---- 出发地/目的地 ----
  const stop = CN_FIELD_STOP;
  // 标注式：出发地：xx / 目的地：xx
  const fromLabeled = text.match(new RegExp(`出发[地点]{1,2}\\s*[：:]\\s*([^${stop}]+)`));
  const toLabeled = text.match(new RegExp(`(?:目的[地站]?|到达)\\s*[：:]?\\s*([^${stop}]+)`));
  if (fromLabeled && toLabeled) {
    result.from = fromLabeled[1].trim();
    result.to = toLabeled[1].trim();
  } else {
    // 句式：从/由 X 到/至/去/前往 Y
    const journey = text.match(
      new RegExp(`[从由]\\s*([^${stop}到至去前]{2,30}?)\\s*(?:到|至|去(?:往)?|前往)\\s*([^${stop}]+)`)
    );
    if (journey) {
      result.from = journey[1].trim().replace(/出发$/, '');
      result.to = journey[2].trim();
    } else {
      // 箭头式：X → Y（不限行首，常用于消息式文本）
      const arrow = text.match(new RegExp(`([^\\s${stop}\\n→]{2,20})\\s*→\\s*([^\\s${stop}\\n→]{2,20})`));
      if (arrow) {
        result.from = arrow[1].trim();
        result.to = arrow[2].trim();
      }
    }
  }
  // 目的地截断：去掉"参加项目评审会"这类活动描述尾巴
  if (result.to) {
    result.to = result.to.replace(/(?:参加|举行|召开|进行|出席).*/, '').trim() || result.to;
  }
  if (result.from && result.to) {
    result.recognized.push('出发地', '目的地');
  }

  // ---- 乘车人 ----
  let passenger = text.match(/(?:乘车人|乘客|用车人|联系人)[姓名]?[：:为]?\s*([\u4e00-\u9fa5A-Za-z·]{2,6})/);
  if (!passenger) {
    // 句式：张局长一行4人 / 李主任等3人
    passenger = text.match(/([\u4e00-\u9fa5·A-Za-z]{2,6})(?:一行|等)\s*\d+\s*人/);
  }
  if (passenger) {
    result.passenger = passenger[1].trim();
    result.recognized.push('乘车人');
  }

  // ---- 任务类型推断 ----
  if (/接机|送机|航班|机场/.test(text)) result.type = '接送机';
  else if (/会议/.test(text)) result.type = '会议通勤';
  else if (/考察|调研/.test(text)) result.type = '考察调研';
  else if (/办事|办理|公务/.test(text)) result.type = '办事出行';
  if (result.type) result.recognized.push('任务类型');

  // ---- 任务名称：已识别到其他字段时，取较短首行或按出发地至目的地生成 ----
  if (result.recognized.length > 0) {
    const firstLine = text.split('\n').map(l => l.trim()).find(l => l.length > 0) || '';
    if (firstLine && firstLine.length <= 25 && !/[：:]/.test(firstLine)) {
      result.name = firstLine;
      result.recognized.push('任务名称');
    } else if (result.from && result.to) {
      result.name = `${result.from}至${result.to}`;
      result.recognized.push('任务名称');
    }
  }

  return result;
}
