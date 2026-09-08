export interface HelpTableItem {
  triggerObject: string;
  triggerAction: string;
  responseCondition: string;
  responseObject: string;
  responseAction: string;
  remark: string;
}

export interface HelpData {
  title: string;
  description?: string;
  table: HelpTableItem[];
}

export const activityHelpData: Record<string, HelpData> = {
  'H.1.1': {
    title: '活动管理列表页',
    table: [
      { triggerObject: '新建活动按钮', triggerAction: '点击', responseCondition: '无', responseObject: '创建活动弹窗', responseAction: '打开', remark: '所有调度员均可操作' },
      { triggerObject: '活动名称链接', triggerAction: '点击', responseCondition: '活动存在', responseObject: '活动详情页', responseAction: '跳转', remark: '按权限控制查看内容' },
      { triggerObject: '状态筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '活动列表', responseAction: '刷新', remark: '展示符合条件的活动' },
      { triggerObject: '时期筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '活动列表', responseAction: '刷新', remark: '展示符合条件的活动' },
      { triggerObject: '时间筛选输入框', triggerAction: '填写', responseCondition: '日期范围有效', responseObject: '活动列表', responseAction: '刷新', remark: '展示符合条件的活动' },
    ],
  },
  'H.1.2': {
    title: '创建/编辑活动弹窗',
    table: [
      { triggerObject: '活动名称输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '活动名称输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入活动名称"' },
      { triggerObject: '活动时间选择器', triggerAction: '选择', responseCondition: '开始时间≤结束时间且不早于当前时间', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '活动时间选择器', triggerAction: '选择', responseCondition: '开始时间>结束时间', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"开始时间不能晚于结束时间"' },
      { triggerObject: '负责人多选框', triggerAction: '选择', responseCondition: '至少选择1位', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，默认第一位为创建者' },
      { triggerObject: '负责人多选框', triggerAction: '选择', responseCondition: '未选择', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请至少选择1位负责人"' },
      { triggerObject: '保存按钮', triggerAction: '点击', responseCondition: '所有必填项校验通过', responseObject: '系统', responseAction: '创建/更新活动记录，关闭弹窗，跳转至活动详情页', remark: '—' },
      { triggerObject: '保存按钮', triggerAction: '点击', responseCondition: '有必填项未通过校验', responseObject: '表单', responseAction: '不提交，高亮显示未通过项', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '创建活动弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
  'H.1.3': {
    title: '活动详情页',
    table: [
      { triggerObject: '开始活动按钮', triggerAction: '点击', responseCondition: '活动处于筹备期；已关联至少1辆车+1名司机且审核通过', responseObject: '开始活动确认弹窗', responseAction: '打开', remark: '仅活动负责人可见' },
      { triggerObject: '开始活动按钮', triggerAction: '点击', responseCondition: '活动处于执行期或结束期', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '开始活动按钮', triggerAction: '点击', responseCondition: '活动处于筹备期但关联资源不足', responseObject: '系统', responseAction: '提示"活动尚未关联足够的可用资源"', remark: '—' },
      { triggerObject: '结束活动按钮', triggerAction: '点击', responseCondition: '活动处于执行期；无未完成任务', responseObject: '结束活动确认弹窗', responseAction: '打开', remark: '仅活动负责人可见' },
      { triggerObject: '结束活动按钮', triggerAction: '点击', responseCondition: '活动处于筹备期或结束期', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '结束活动按钮', triggerAction: '点击', responseCondition: '活动处于执行期但有未完成任务', responseObject: '系统', responseAction: '提示"活动下还有X个未完成任务"', remark: '—' },
      { triggerObject: 'Tab页签（活动信息）', triggerAction: '点击', responseCondition: '无', responseObject: 'Tab内容区域', responseAction: '显示活动信息内容', remark: '7个Tab' },
      { triggerObject: 'Tab页签（工作小组）', triggerAction: '点击', responseCondition: '无', responseObject: 'Tab内容区域', responseAction: '显示工作小组列表', remark: '—' },
      { triggerObject: 'Tab页签（关联供应商）', triggerAction: '点击', responseCondition: '无', responseObject: 'Tab内容区域', responseAction: '显示关联供应商列表', remark: '—' },
      { triggerObject: 'Tab页签（关联车辆）', triggerAction: '点击', responseCondition: '无', responseObject: 'Tab内容区域', responseAction: '显示关联车辆列表', remark: '—' },
      { triggerObject: 'Tab页签（关联司机）', triggerAction: '点击', responseCondition: '无', responseObject: 'Tab内容区域', responseAction: '显示关联司机列表', remark: '—' },
      { triggerObject: 'Tab页签（任务列表）', triggerAction: '点击', responseCondition: '无', responseObject: 'Tab内容区域', responseAction: '显示任务列表', remark: '—' },
      { triggerObject: 'Tab页签（轨迹大屏）', triggerAction: '点击', responseCondition: '活动处于执行期或结束期', responseObject: 'Tab内容区域', responseAction: '显示轨迹大屏', remark: '筹备期显示"活动尚未开始"' },
      { triggerObject: '异常任务列表项', triggerAction: '点击', responseCondition: '异常任务存在', responseObject: '任务详情页', responseAction: '跳转', remark: '—' },
      { triggerObject: '去审核按钮', triggerAction: '点击', responseCondition: '有待审核车辆/司机', responseObject: '资源审核页', responseAction: '跳转', remark: '—' },
      { triggerObject: '去审核按钮', triggerAction: '点击', responseCondition: '无待审核资源', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
    ],
  },
  'H.1.4': {
    title: '开始活动确认弹窗',
    table: [
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '无', responseObject: '系统', responseAction: '活动时期变为"执行期"，关闭弹窗', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '确认弹窗', responseAction: '关闭', remark: '活动保持筹备期' },
    ],
  },
  'H.1.5': {
    title: '结束活动确认弹窗',
    table: [
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '无', responseObject: '系统', responseAction: '活动时期变为"结束期"，关联车辆/司机自动置为不可用，通知关联人员，关闭弹窗', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '确认弹窗', responseAction: '关闭', remark: '活动保持执行期' },
    ],
  },
  'H.1.6': {
    title: '关联供应商弹窗',
    table: [
      { triggerObject: '关联供应商按钮', triggerAction: '点击', responseCondition: '活动处于筹备期或执行期', responseObject: '关联供应商弹窗', responseAction: '打开', remark: '显示供应商池中状态为"合作中"且未关联本活动的供应商列表' },
      { triggerObject: '关联供应商按钮', triggerAction: '点击', responseCondition: '活动处于结束期', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '供应商勾选框', triggerAction: '点击', responseCondition: '供应商状态为"合作中"', responseObject: '勾选框', responseAction: '标记为选中', remark: '支持多选' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '至少勾选1个供应商', responseObject: '系统', responseAction: '完成关联，通知供应商联系人，关闭弹窗', remark: '—' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '未勾选任何供应商', responseObject: '系统', responseAction: '提示"请至少选择1个供应商"', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '关联供应商弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
  'H.1.7': {
    title: '取消关联供应商确认弹窗',
    table: [
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '供应商名下无未完成任务的车辆/司机', responseObject: '系统', responseAction: '取消关联，未分配任务的车辆/司机自动取消与活动的关联，关闭弹窗', remark: '—' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '供应商名下有未完成任务的车辆/司机', responseObject: '系统', responseAction: '提示"该供应商名下有X辆车/X名司机正在执行任务"', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '确认弹窗', responseAction: '关闭', remark: '保持关联' },
    ],
  },
  'H.1.8': {
    title: '新建/编辑工作小组弹窗',
    table: [
      { triggerObject: '新建工作小组按钮', triggerAction: '点击', responseCondition: '活动处于筹备期或执行期', responseObject: '新建工作小组弹窗', responseAction: '打开', remark: '仅活动总调度员可操作' },
      { triggerObject: '新建工作小组按钮', triggerAction: '点击', responseCondition: '活动处于结束期', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '地点输入框', triggerAction: '填写', responseCondition: '非空且同一活动下不重复', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '地点输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入地点"' },
      { triggerObject: '地点输入框', triggerAction: '填写', responseCondition: '同一活动下已存在', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"该地点已存在"' },
      { triggerObject: '现场负责人下拉', triggerAction: '选择', responseCondition: '从系统调度员中选择', responseObject: '表单字段', responseAction: '校验通过', remark: '非必填' },
      { triggerObject: '现场调度员多选框', triggerAction: '选择', responseCondition: '从系统调度员中选择，至少1位', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，支持多选' },
      { triggerObject: '现场调度员多选框', triggerAction: '选择', responseCondition: '未选择', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请至少选择1位现场调度员"' },
      { triggerObject: '保存按钮', triggerAction: '点击', responseCondition: '所有必填项校验通过', responseObject: '系统', responseAction: '创建/更新工作小组，关闭弹窗，刷新列表', remark: '—' },
      { triggerObject: '删除工作小组按钮', triggerAction: '点击', responseCondition: '工作小组无待审批任务', responseObject: '系统', responseAction: '弹出确认框', remark: '有待审批任务时不可删除' },
      { triggerObject: '删除工作小组按钮', triggerAction: '点击', responseCondition: '工作小组有待审批任务', responseObject: '系统', responseAction: '不响应', remark: '按钮置灰' },
    ],
  },
};

export const supplierHelpData: Record<string, HelpData> = {
  'H.2.1': {
    title: '供应商管理列表页',
    table: [
      { triggerObject: '新增供应商按钮', triggerAction: '点击', responseCondition: '无', responseObject: '新增供应商弹窗', responseAction: '打开', remark: '系统管理员和调度员可操作' },
      { triggerObject: '供应商名称链接', triggerAction: '点击', responseCondition: '供应商存在', responseObject: '供应商详情页', responseAction: '跳转', remark: '—' },
      { triggerObject: '类型筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '供应商列表', responseAction: '刷新', remark: '展示符合条件的供应商' },
      { triggerObject: '状态筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '供应商列表', responseAction: '刷新', remark: '展示符合条件的供应商' },
    ],
  },
  'H.2.2': {
    title: '新增/编辑供应商弹窗',
    table: [
      { triggerObject: '供应商名称输入框', triggerAction: '填写', responseCondition: '非空且不重复', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '供应商名称输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入供应商名称"' },
      { triggerObject: '供应商名称输入框', triggerAction: '填写', responseCondition: '已存在', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"供应商名称已存在"，用于供应商账号的昵称' },
      { triggerObject: '供应商类型下拉', triggerAction: '选择', responseCondition: '车辆供应商/司机供应商/综合供应商', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '供应商状态下拉', triggerAction: '选择', responseCondition: '合作中/暂停合作/终止合作', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，用于供应商账号的状态' },
      { triggerObject: '联系人电话输入框', triggerAction: '填写', responseCondition: '有效手机号', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，用于供应商登录账号、手机号' },
      { triggerObject: '联系人电话输入框', triggerAction: '填写', responseCondition: '无效手机号', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入有效手机号"' },
      { triggerObject: '上传附件按钮', triggerAction: '点击', responseCondition: '文件类型为PDF/DOC/DOCX/XLS/XLSX/ZIP/RAR/JPG/JPEG/PNG，单文件≤10MB', responseObject: '系统', responseAction: '上传文件，保存附件记录', remark: '合同文件1~5份，资质文件1~5份，其他文件0~5份' },
      { triggerObject: '上传附件按钮', triggerAction: '点击', responseCondition: '文件类型不支持', responseObject: '系统', responseAction: '提示"不支持该文件类型"', remark: '—' },
      { triggerObject: '上传附件按钮', triggerAction: '点击', responseCondition: '文件超过10MB', responseObject: '系统', responseAction: '提示"文件大小超过限制"', remark: '—' },
      { triggerObject: '删除附件按钮', triggerAction: '点击', responseCondition: '附件存在', responseObject: '系统', responseAction: '弹出确认框', remark: '—' },
      { triggerObject: '保存按钮', triggerAction: '点击', responseCondition: '所有必填项校验通过', responseObject: '系统', responseAction: '创建/更新供应商记录，自动创建供应商联系人账号，关闭弹窗', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '新增供应商弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
  'H.2.3': {
    title: '供应商详情页',
    table: [
      { triggerObject: 'Tab页签（基本信息）', triggerAction: '点击', responseCondition: '无', responseObject: 'Tab内容区域', responseAction: '显示基本信息内容', remark: '4个Tab' },
      { triggerObject: 'Tab页签（参与活动）', triggerAction: '点击', responseCondition: '无', responseObject: 'Tab内容区域', responseAction: '显示参与活动列表', remark: '—' },
      { triggerObject: 'Tab页签（名下车辆）', triggerAction: '点击', responseCondition: '无', responseObject: 'Tab内容区域', responseAction: '显示名下车辆列表', remark: '—' },
      { triggerObject: 'Tab页签（名下司机）', triggerAction: '点击', responseCondition: '无', responseObject: 'Tab内容区域', responseAction: '显示名下司机列表', remark: '—' },
      { triggerObject: '活动名称链接', triggerAction: '点击', responseCondition: '活动存在', responseObject: '活动详情页', responseAction: '跳转', remark: '—' },
      { triggerObject: '车辆名称链接', triggerAction: '点击', responseCondition: '车辆存在', responseObject: '车辆详情页', responseAction: '跳转', remark: '—' },
      { triggerObject: '司机姓名链接', triggerAction: '点击', responseCondition: '司机存在', responseObject: '司机详情页', responseAction: '跳转', remark: '—' },
      { triggerObject: '预览附件按钮', triggerAction: '点击', responseCondition: '附件为图片或PDF', responseObject: '预览弹窗', responseAction: '打开', remark: '图片可放大查看，PDF可在线预览' },
      { triggerObject: '预览附件按钮', triggerAction: '点击', responseCondition: '附件为其他类型', responseObject: '系统', responseAction: '不响应', remark: '隐藏预览按钮' },
      { triggerObject: '下载附件按钮', triggerAction: '点击', responseCondition: '附件存在', responseObject: '系统', responseAction: '触发文件下载', remark: '—' },
    ],
  },
};

export const vehicleHelpData: Record<string, HelpData> = {
  'H.3.1': {
    title: '车辆管理列表页',
    table: [
      { triggerObject: '新增车辆按钮', triggerAction: '点击', responseCondition: '无', responseObject: '新增车辆弹窗', responseAction: '打开', remark: '供应商联系人仅可为本供应商新增' },
      { triggerObject: '批量导入按钮', triggerAction: '点击', responseCondition: '无', responseObject: '批量导入弹窗', responseAction: '打开', remark: '供应商、系统管理员和活动总调度员可操作' },
      { triggerObject: '批量维护驻点按钮', triggerAction: '点击', responseCondition: '所选车辆为同一活动且审核通过', responseObject: '批量维护驻点弹窗', responseAction: '打开', remark: '按钮置灰时提示"请选择同一活动且审核通过的车辆"' },
      { triggerObject: '批量维护驻点按钮', triggerAction: '点击', responseCondition: '所选车辆不满足条件', responseObject: '系统', responseAction: '提示"请选择同一活动且审核通过的车辆"', remark: '按钮置灰' },
      { triggerObject: '车辆勾选框', triggerAction: '点击', responseCondition: '车辆存在', responseObject: '勾选框', responseAction: '标记为选中', remark: '用于批量操作' },
      { triggerObject: '详情链接', triggerAction: '点击', responseCondition: '车辆存在', responseObject: '车辆详情页', responseAction: '跳转', remark: '—' },
      { triggerObject: '设为不可用按钮', triggerAction: '点击', responseCondition: '车辆存在', responseObject: '系统', responseAction: '弹出确认框', remark: '供应商、活动调度员可见' },
      { triggerObject: '设为不可用按钮', triggerAction: '点击', responseCondition: '确认框', responseObject: '系统', responseAction: '确认设置为不可用', remark: '—' },
      { triggerObject: '恢复可用按钮', triggerAction: '点击', responseCondition: '车辆存在', responseObject: '系统', responseAction: '弹出确认框', remark: '供应商、活动调度员可见' },
      { triggerObject: '恢复可用按钮', triggerAction: '点击', responseCondition: '确认框', responseObject: '系统', responseAction: '确认恢复可用', remark: '—' },
      { triggerObject: '编辑按钮', triggerAction: '点击', responseCondition: '车辆存在', responseObject: '编辑车辆弹窗', responseAction: '打开', remark: '供应商、活动调度员可见' },
      { triggerObject: '删除按钮', triggerAction: '点击', responseCondition: '车辆存在', responseObject: '系统', responseAction: '弹出确认框', remark: '供应商、活动调度员可见' },
      { triggerObject: '删除按钮', triggerAction: '点击', responseCondition: '确认框', responseObject: '系统', responseAction: '确认删除', remark: '—' },
      { triggerObject: '绑定司机按钮', triggerAction: '点击', responseCondition: '车辆存在', responseObject: '绑定司机弹窗', responseAction: '打开', remark: '活动调度员可见' },
      { triggerObject: '绑定司机按钮', triggerAction: '点击', responseCondition: '确认框', responseObject: '系统', responseAction: '确认绑定司机', remark: '—' },
      { triggerObject: '绑定地点按钮', triggerAction: '点击', responseCondition: '车辆存在', responseObject: '绑定地点弹窗', responseAction: '打开', remark: '活动调度员可见' },
      { triggerObject: '绑定地点按钮', triggerAction: '点击', responseCondition: '确认框', responseObject: '系统', responseAction: '确认绑定地点', remark: '—' },
      { triggerObject: '审核状态筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '车辆列表', responseAction: '刷新', remark: '展示符合条件的车辆' },
      { triggerObject: '状态筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '车辆列表', responseAction: '刷新', remark: '展示符合条件的车辆' },
      { triggerObject: '供应商筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '车辆列表', responseAction: '刷新', remark: '展示符合条件的车辆' },
      { triggerObject: '活动筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '车辆列表', responseAction: '刷新', remark: '展示符合条件的车辆' },
      { triggerObject: '类型筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '车辆列表', responseAction: '刷新', remark: '展示符合条件的车辆' },
    ],
  },
  'H.3.2': {
    title: '新增/编辑车辆弹窗',
    table: [
      { triggerObject: '所属供应商下拉', triggerAction: '选择', responseCondition: '供应商存在', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，供应商联系人新增时自动填入，不可修改' },
      { triggerObject: '所属活动下拉', triggerAction: '选择', responseCondition: '所属供应商已关联的筹备期/执行期活动', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，下拉列表联动供应商自动刷新' },
      { triggerObject: '车牌号输入框', triggerAction: '填写', responseCondition: '非空且在所属活动下唯一', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '车牌号输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入车牌号"' },
      { triggerObject: '车牌号输入框', triggerAction: '填写', responseCondition: '已存在', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"该车牌号已存在"' },
      { triggerObject: '车辆类型下拉', triggerAction: '选择', responseCondition: '轿车/SUV/商务车/中巴/大巴/越野车', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '品牌型号输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '非必填项' },
      { triggerObject: '车身颜色输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '非必填项' },
      { triggerObject: '核载人数输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '非必填项，只能填写数字' },
      { triggerObject: '驾照要求下拉', triggerAction: '选择', responseCondition: '有/无', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '可用日期范围选择器', triggerAction: '选择', responseCondition: '日期范围', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，需在活动时间范围内，可维护多条可用日期' },
      { triggerObject: '车辆照片上传按钮', triggerAction: '点击', responseCondition: 'JPG/PNG格式，至少1张，最多5张，单张≤10MB', responseObject: '系统', responseAction: '上传文件', remark: '必填项' },
      { triggerObject: '车辆照片上传按钮', triggerAction: '点击', responseCondition: '文件格式不支持', responseObject: '系统', responseAction: '提示"仅支持JPG/PNG格式"', remark: '—' },
      { triggerObject: '年检合格证上传按钮', triggerAction: '点击', responseCondition: 'JPG/PNG/PDF格式，最多3份，单份≤10MB', responseObject: '系统', responseAction: '上传文件', remark: '必填项' },
      { triggerObject: '年检合格证上传按钮', triggerAction: '点击', responseCondition: '文件格式不支持', responseObject: '系统', responseAction: '提示"仅支持JPG/PNG/PDF格式"', remark: '—' },
      { triggerObject: '保险单上传按钮', triggerAction: '点击', responseCondition: 'JPG/PNG/PDF格式，最多3份，单份≤10MB', responseObject: '系统', responseAction: '上传文件', remark: '必填项' },
      { triggerObject: '保险单上传按钮', triggerAction: '点击', responseCondition: '文件格式不支持', responseObject: '系统', responseAction: '提示"仅支持JPG/PNG/PDF格式"', remark: '—' },
      { triggerObject: '提交审核按钮', triggerAction: '点击', responseCondition: '所有必填项校验通过', responseObject: '系统', responseAction: '创建车辆记录（状态为"待审核"），关闭弹窗，通知活动负责人审核', remark: '—' },
      { triggerObject: '提交审核按钮', triggerAction: '点击', responseCondition: '有必填项未通过校验', responseObject: '表单', responseAction: '不提交，高亮显示未通过项', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '新增车辆弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
  'H.3.3': {
    title: '绑定默认司机弹窗',
    table: [
      { triggerObject: '绑定默认司机按钮', triggerAction: '点击', responseCondition: '车辆审核通过', responseObject: '绑定默认司机弹窗', responseAction: '打开', remark: '显示已审核通过的司机列表' },
      { triggerObject: '绑定默认司机按钮', triggerAction: '点击', responseCondition: '车辆未审核通过', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '司机勾选框', triggerAction: '点击', responseCondition: '司机审核通过且与车辆属于同一活动', responseObject: '勾选框', responseAction: '标记为选中', remark: '一辆车仅可绑定一名默认司机' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '已选择司机', responseObject: '系统', responseAction: '完成绑定，关闭弹窗', remark: '—' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '未选择司机', responseObject: '系统', responseAction: '提示"请选择一名司机"', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '绑定默认司机弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
  'H.3.4': {
    title: '绑定活动地点弹窗',
    table: [
      { triggerObject: '绑定活动地点按钮', triggerAction: '点击', responseCondition: '车辆已关联至活动且活动处于筹备期或执行期', responseObject: '绑定活动地点弹窗', responseAction: '打开', remark: '显示当前活动的工作小组地点列表' },
      { triggerObject: '绑定活动地点按钮', triggerAction: '点击', responseCondition: '车辆未关联至活动或活动已结束', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '地点勾选框', triggerAction: '点击', responseCondition: '地点属于当前活动', responseObject: '勾选框', responseAction: '标记为选中', remark: '支持多选' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '已勾选至少1个地点', responseObject: '系统', responseAction: '完成绑定，关闭弹窗', remark: '绑定地点的车辆，对应工作小组的现场调度员可分配' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '未勾选任何地点', responseObject: '系统', responseAction: '提示"请至少选择1个地点"', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '绑定活动地点弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
  'H.3.5': {
    title: '批量维护驻点场地弹窗',
    table: [
      { triggerObject: '地点勾选框', triggerAction: '点击', responseCondition: '地点属于当前活动', responseObject: '勾选框', responseAction: '标记为选中', remark: '支持多选' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '已勾选至少1个地点', responseObject: '系统', responseAction: '所选车辆均绑定勾选的地点，覆盖原有绑定关系，关闭弹窗', remark: '—' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '未勾选任何地点', responseObject: '系统', responseAction: '提示"请至少选择1个地点"', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '批量维护驻点场地弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
  'H.3.6': {
    title: '批量导入车辆弹窗',
    table: [
      { triggerObject: '下载模板按钮', triggerAction: '点击', responseCondition: '无', responseObject: '系统', responseAction: '下载Excel模板文件', remark: '—' },
      { triggerObject: 'Excel文件上传按钮', triggerAction: '点击', responseCondition: '文件格式正确', responseObject: '系统', responseAction: '校验数据格式和必填项', remark: '单次导入上限500条' },
      { triggerObject: 'Excel文件上传按钮', triggerAction: '点击', responseCondition: '文件格式不正确', responseObject: '系统', responseAction: '提示"请上传正确格式的Excel文件"', remark: '—' },
      { triggerObject: '确认导入按钮', triggerAction: '点击', responseCondition: '有成功记录', responseObject: '系统', responseAction: '创建车辆记录（状态为"待审核"），展示导入结果，关闭弹窗', remark: '—' },
      { triggerObject: '确认导入按钮', triggerAction: '点击', responseCondition: '无成功记录', responseObject: '系统', responseAction: '提示"无有效数据可导入"', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '批量导入车辆弹窗', responseAction: '关闭', remark: '不导入' },
    ],
  },
};

export const driverHelpData: Record<string, HelpData> = {
  'H.4.1': {
    title: '司机管理列表页',
    table: [
      { triggerObject: '新增司机按钮', triggerAction: '点击', responseCondition: '无', responseObject: '新增司机弹窗', responseAction: '打开', remark: '供应商联系人仅可为本供应商新增' },
      { triggerObject: '批量导入按钮', triggerAction: '点击', responseCondition: '无', responseObject: '批量导入弹窗', responseAction: '打开', remark: '供应商、系统管理员和活动总调度员可操作' },
      { triggerObject: '司机姓名链接', triggerAction: '点击', responseCondition: '司机存在', responseObject: '司机详情页', responseAction: '跳转', remark: '—' },
      { triggerObject: '审核状态筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '司机列表', responseAction: '刷新', remark: '展示符合条件的司机' },
      { triggerObject: '状态筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '司机列表', responseAction: '刷新', remark: '展示符合条件的司机' },
      { triggerObject: '供应商筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '司机列表', responseAction: '刷新', remark: '展示符合条件的司机' },
      { triggerObject: '活动筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '司机列表', responseAction: '刷新', remark: '展示符合条件的司机' },
    ],
  },
  'H.4.2': {
    title: '新增/编辑司机弹窗',
    table: [
      { triggerObject: '所属供应商下拉', triggerAction: '选择', responseCondition: '司机供应商或综合供应商', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，供应商联系人新增时自动填入，不可修改' },
      { triggerObject: '所属活动下拉', triggerAction: '选择', responseCondition: '所属供应商已关联的筹备期/执行期活动', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，下拉列表联动供应商自动刷新' },
      { triggerObject: '姓名输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '姓名输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入姓名"' },
      { triggerObject: '手机号输入框', triggerAction: '填写', responseCondition: '非空且唯一', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，用于登录账号' },
      { triggerObject: '手机号输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入手机号"' },
      { triggerObject: '手机号输入框', triggerAction: '填写', responseCondition: '已存在', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"该手机号已注册"' },
      { triggerObject: '身份证号输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '非必填项' },
      { triggerObject: '驾照类型下拉', triggerAction: '选择', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '非必填项' },
      { triggerObject: '驾照有效期至输入框', triggerAction: '选择日期', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '非必填项' },
      { triggerObject: '紧急联系人输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '非必填项' },
      { triggerObject: '紧急联系电话输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '非必填项' },
      { triggerObject: '可用日期范围选择器', triggerAction: '选择', responseCondition: '日期范围', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，需在活动时间范围内，可维护多条可用日期' },
      { triggerObject: '驾驶证正本上传按钮', triggerAction: '点击', responseCondition: 'JPG/PNG格式，1张，≤10MB', responseObject: '系统', responseAction: '上传文件', remark: '必填项' },
      { triggerObject: '驾驶证正本上传按钮', triggerAction: '点击', responseCondition: '文件格式不支持', responseObject: '系统', responseAction: '提示"仅支持JPG/PNG格式"', remark: '—' },
      { triggerObject: '驾驶证副本上传按钮', triggerAction: '点击', responseCondition: 'JPG/PNG格式，1张，≤10MB', responseObject: '系统', responseAction: '上传文件', remark: '必填项' },
      { triggerObject: '驾驶证副本上传按钮', triggerAction: '点击', responseCondition: '文件格式不支持', responseObject: '系统', responseAction: '提示"仅支持JPG/PNG格式"', remark: '—' },
      { triggerObject: '照片上传按钮', triggerAction: '点击', responseCondition: 'JPG/PNG格式，1张，≤10MB', responseObject: '系统', responseAction: '上传文件', remark: '非必填项' },
      { triggerObject: '照片上传按钮', triggerAction: '点击', responseCondition: '文件格式不支持', responseObject: '系统', responseAction: '提示"仅支持JPG/PNG格式"', remark: '—' },
      { triggerObject: '其他资料上传按钮', triggerAction: '点击', responseCondition: '文件类型为PDF/DOC/DOCX/XLS/XLSX/ZIP/RAR/JPG/JPEG/PNG，单文件≤10MB', responseObject: '系统', responseAction: '上传文件', remark: '非必填项' },
      { triggerObject: '其他资料上传按钮', triggerAction: '点击', responseCondition: '文件格式不支持', responseObject: '系统', responseAction: '提示"仅支持PDF/DOC/DOCX/XLS/XLSX/ZIP/RAR/JPG/JPEG/PNG格式"', remark: '—' },
      { triggerObject: '提交审核按钮', triggerAction: '点击', responseCondition: '所有必填项校验通过', responseObject: '系统', responseAction: '创建司机记录（状态为"待审核"），关闭弹窗，通知活动负责人审核', remark: '—' },
      { triggerObject: '提交审核按钮', triggerAction: '点击', responseCondition: '有必填项未通过校验', responseObject: '表单', responseAction: '不提交，高亮显示未通过项', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '新增司机弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
  'H.4.3': {
    title: '批量导入司机弹窗',
    table: [
      { triggerObject: '下载模板按钮', triggerAction: '点击', responseCondition: '无', responseObject: '系统', responseAction: '下载Excel模板文件', remark: '—' },
      { triggerObject: 'Excel文件上传按钮', triggerAction: '点击', responseCondition: '文件格式正确', responseObject: '系统', responseAction: '校验数据格式和必填项', remark: '单次导入上限500条' },
      { triggerObject: 'Excel文件上传按钮', triggerAction: '点击', responseCondition: '文件格式不正确', responseObject: '系统', responseAction: '提示"请上传正确格式的Excel文件"', remark: '—' },
      { triggerObject: '确认导入按钮', triggerAction: '点击', responseCondition: '有成功记录', responseObject: '系统', responseAction: '创建司机记录（状态为"待审核"），展示导入结果，关闭弹窗', remark: '—' },
      { triggerObject: '确认导入按钮', triggerAction: '点击', responseCondition: '无成功记录', responseObject: '系统', responseAction: '提示"无有效数据可导入"', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '批量导入司机弹窗', responseAction: '关闭', remark: '不导入' },
    ],
  },
};

export const auditHelpData: Record<string, HelpData> = {
  'H.5.1': {
    title: '资源审核列表页',
    table: [
      { triggerObject: '待审核tab', triggerAction: '点击', responseCondition: '资源存在且状态为"待审核"', responseObject: '审核列表', responseAction: '刷新', remark: '展示待审核资源' },
      { triggerObject: '审核记录tab', triggerAction: '点击', responseCondition: '资源存在且状态为"通过"/"驳回"', responseObject: '已审核列表', responseAction: '刷新', remark: '展示已审核记录' },
      { triggerObject: '类型筛选下拉（车辆/司机）', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '审核列表', responseAction: '刷新', remark: '展示符合条件的待审核资源' },
      { triggerObject: '所属活动筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '审核列表', responseAction: '刷新', remark: '展示符合条件的待审核资源' },
      { triggerObject: '供应商筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '审核列表', responseAction: '刷新', remark: '展示符合条件的待审核资源' },
      { triggerObject: '车辆/司机搜索输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '审核列表', responseAction: '刷新', remark: '展示符合条件的待审核资源' },
      { triggerObject: '记录勾选框', triggerAction: '点击', responseCondition: '记录存在', responseObject: '勾选框', responseAction: '标记为选中', remark: '用于批量审核' },
      { triggerObject: '批量通过按钮', triggerAction: '点击', responseCondition: '已勾选至少1条记录', responseObject: '系统', responseAction: '批量审核通过，资源状态变为"可调配"', remark: '仅活动总调度员可操作' },
      { triggerObject: '批量通过按钮', triggerAction: '点击', responseCondition: '未勾选任何记录', responseObject: '系统', responseAction: '不响应', remark: '按钮置灰' },
      { triggerObject: '批量驳回按钮', triggerAction: '点击', responseCondition: '已勾选至少1条记录', responseObject: '系统', responseAction: '弹出驳回原因输入框', remark: '仅活动总调度员可操作' },
      { triggerObject: '批量驳回按钮', triggerAction: '点击', responseCondition: '未勾选任何记录', responseObject: '系统', responseAction: '不响应', remark: '按钮置灰' },
      { triggerObject: '详情按钮', triggerAction: '点击', responseCondition: '资源存在且状态为"待审核"', responseObject: '审核详情页', responseAction: '跳转', remark: '仅活动总调度员可操作' },
    ],
  },
  'H.5.2': {
    title: '审核详情页',
    table: [
      { triggerObject: '审核通过按钮', triggerAction: '点击', responseCondition: '资源状态为"待审核"', responseObject: '系统', responseAction: '资源状态变为"可调配"，自动关联至所选活动', remark: '仅活动总调度员可操作' },
      { triggerObject: '审核通过按钮', triggerAction: '点击', responseCondition: '资源状态非"待审核"', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '审核驳回按钮', triggerAction: '点击', responseCondition: '资源状态为"待审核"', responseObject: '系统', responseAction: '弹出驳回原因输入框（必填）', remark: '仅活动总调度员可操作' },
      { triggerObject: '审核驳回按钮', triggerAction: '点击', responseCondition: '资源状态非"待审核"', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '预览审核材料按钮', triggerAction: '点击', responseCondition: '材料为图片或PDF', responseObject: '预览弹窗', responseAction: '打开', remark: '图片可放大查看，PDF可在线预览' },
      { triggerObject: '预览审核材料按钮', triggerAction: '点击', responseCondition: '材料为其他类型', responseObject: '系统', responseAction: '不响应', remark: '隐藏预览按钮' },
      { triggerObject: '下载审核材料按钮', triggerAction: '点击', responseCondition: '材料存在', responseObject: '系统', responseAction: '触发文件下载', remark: '—' },
    ],
  },
};

export const taskHelpData: Record<string, HelpData> = {
  'H.6.1': {
    title: '任务调度列表页',
    table: [
      { triggerObject: '新建任务按钮', triggerAction: '点击', responseCondition: '-', responseObject: '创建任务弹窗', responseAction: '打开', remark: '调度员可见' },
      { triggerObject: '所属活动筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '任务列表', responseAction: '刷新', remark: '展示符合条件的任务' },
      { triggerObject: '状态筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '任务列表', responseAction: '刷新', remark: '展示符合条件的任务' },
      { triggerObject: '任务日期时间筛选器', triggerAction: '选择', responseCondition: '开始时间≤结束时间', responseObject: '任务列表', responseAction: '刷新', remark: '展示符合条件的任务' },
      { triggerObject: '现场调度员筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '任务列表', responseAction: '刷新', remark: '展示符合条件的任务' },
      { triggerObject: '异常状态筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '任务列表', responseAction: '刷新', remark: '展示符合条件的任务' },
      { triggerObject: '搜索输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '任务列表', responseAction: '刷新', remark: '展示符合条件的任务' },
      { triggerObject: '任务列表', triggerAction: '点击', responseCondition: '任务存在', responseObject: '任务详情页', responseAction: '跳转', remark: '按权限控制' },
      { triggerObject: '派发按钮', triggerAction: '点击', responseCondition: '任务状态为"待派发"', responseObject: '系统', responseAction: '任务状态变为"已派发"', remark: '活动调度员可操作' },
      { triggerObject: '任务审批按钮', triggerAction: '点击', responseCondition: '任务状态为"待审批"', responseObject: '系统', responseAction: '弹出审核弹窗', remark: '仅活动总调度员/现场负责人可操作' },
    ],
  },
  'H.6.2': {
    title: '创建/编辑任务弹窗',
    table: [
      { triggerObject: '所属活动下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，可选择状态为"筹备"或"执行期"的活动' },
      { triggerObject: '任务名称输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '任务名称输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入任务名称"' },
      { triggerObject: '任务类型下拉', triggerAction: '选择', responseCondition: '接送机/办事出行/会议通勤/考察调研/其他', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '任务日期时间选择器', triggerAction: '选择', responseCondition: '开始时间≤结束时间', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '任务日期时间选择器', triggerAction: '选择', responseCondition: '开始时间>结束时间', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"开始时间不能晚于结束时间"' },
      { triggerObject: '乘车人数输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，只能填写整数' },
      { triggerObject: '乘车人数输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入乘车人数"' },
      { triggerObject: '乘车人输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '联系电话输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '现场调度员下拉', triggerAction: '选择', responseCondition: '活动关联的调度员', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，默认当前登录用户' },
      { triggerObject: '出发地输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '目的地输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '添加途经点按钮', triggerAction: '点击', responseCondition: '途经点数量<10个', responseObject: '表单', responseAction: '添加途经点输入框', remark: '支持拖拽排序和删除' },
      { triggerObject: '车型检索下拉', triggerAction: '选择', responseCondition: '—', responseObject: '公共检索结果列表', responseAction: '实时过滤，仅展示该车型可调配车辆', remark: '公共检索区，各检索条件共享；不影响已添加的车辆；选"全部车型"恢复' },
      { triggerObject: '核载人数检索下拉', triggerAction: '选择', responseCondition: '—', responseObject: '公共检索结果列表', responseAction: '实时过滤，仅展示该核载人数可调配车辆', remark: '公共检索区，不影响已添加的车辆；选"全部核载"恢复' },
      { triggerObject: '车牌号检索输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '公共检索结果列表', responseAction: '实时过滤，仅展示车牌号包含输入值的可调配车辆', remark: '公共检索区，不区分大小写；不影响已添加的车辆；清空恢复' },
      { triggerObject: '检索结果列表项', triggerAction: '点击', responseCondition: '审核通过的"可调配"车辆，未被本任务已添加行选用', responseObject: '已分配车辆列表', responseAction: '追加为新一列"车辆卡片+司机下拉+删除"，自动带出默认司机（如已绑定且可用且未被其他行占用）', remark: '公共检索区，重新检索不影响已添加的车辆；该车辆从检索结果中排除；展示车牌号、车辆类型、核载人数、品牌；自动带出的司机可手动更换' },
      { triggerObject: '司机选择下拉', triggerAction: '选择', responseCondition: '审核通过的"可调配"司机，未被本任务其他行选用，满足时间段冲突校验、驾照匹配校验', responseObject: '表单字段', responseAction: '校验通过', remark: '每辆车必须分配一名司机；同一任务内司机不可重复，展示司机姓名、手机号、驾照类型' },
      { triggerObject: '司机选择下拉', triggerAction: '选择', responseCondition: '选择的司机已被本任务其他行选用', responseObject: '表单字段', responseAction: '校验失败', remark: '该选项从下拉中排除，提示"该司机已在本任务中分配"' },
      { triggerObject: '删除车辆按钮', triggerAction: '点击', responseCondition: '已添加车辆行', responseObject: '已分配车辆列表', responseAction: '删除该行车辆与司机', remark: '可删除任意已添加行；删除后该车辆重新出现在公共检索结果列表' },
      { triggerObject: '保存按钮', triggerAction: '点击', responseCondition: '所有必填项校验通过，且每辆已添加车辆均已分配司机', responseObject: '系统', responseAction: '创建/更新任务记录，关闭弹窗', remark: '现场调度员创建的任务状态为"待审批"；创建时可暂不分配（不添加任何车辆）' },
      { triggerObject: '保存并派发按钮', triggerAction: '点击', responseCondition: '活动处于执行期且所有车辆均已分配司机', responseObject: '系统', responseAction: '创建任务并派发，状态变为"待接收"，通知各司机', remark: '仅执行期可用' },
      { triggerObject: '保存并派发按钮', triggerAction: '点击', responseCondition: '活动处于筹备期或存在未分配司机的车辆', responseObject: '系统', responseAction: '不响应', remark: '按钮置灰' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '创建任务弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
  'H.6.3': {
    title: '任务详情页',
    table: [
      { triggerObject: '异常告警区域', triggerAction: '查看', responseCondition: '任务触发异常规则', responseObject: '异常告警区域', responseAction: '显示异常告警信息', remark: '—' },
      { triggerObject: '地图区域', triggerAction: '查看', responseCondition: '任务状态为"执行中"或"已完成"', responseObject: '地图区域', responseAction: '显示司机当前位置或行动轨迹', remark: '—' },
      { triggerObject: '派发按钮', triggerAction: '点击', responseCondition: '活动处于执行期，任务状态为"待派发"且已分配车辆和司机', responseObject: '系统', responseAction: '任务状态变为"待接收"', remark: '仅执行期可用' },
      { triggerObject: '改派按钮', triggerAction: '点击', responseCondition: '任务状态为"待接收"或"已接收"', responseObject: '改派任务弹窗', responseAction: '打开', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '任务状态非"已完成"', responseObject: '系统', responseAction: '弹出确认框', remark: '—' },
      { triggerObject: '催办按钮', triggerAction: '点击', responseCondition: '任务状态为"待接收"', responseObject: '系统', responseAction: '向司机发送站内通知，按钮冷却30秒', remark: '—' },
      { triggerObject: '审核暂停申请按钮', triggerAction: '点击', responseCondition: '任务状态为"执行中"且司机已提交暂停申请', responseObject: '暂停审批弹窗', responseAction: '打开', remark: '—' },
    ],
  },
  'H.6.4': {
    title: '任务审批弹窗',
    table: [
      { triggerObject: '通过按钮', triggerAction: '点击', responseCondition: '任务状态为"待审批"', responseObject: '系统', responseAction: '任务状态变为"待派发"，通知任务创建者', remark: '依据流程图执行' },
      { triggerObject: '不通过按钮', triggerAction: '点击', responseCondition: '任务状态为"待审批"', responseObject: '系统', responseAction: '弹出不通过原因输入框（必填）', remark: '—' },
    ],
  },
  'H.6.5': {
    title: '派发任务确认弹窗',
    table: [
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '活动处于执行期且已分配车辆和司机', responseObject: '系统', responseAction: '任务状态变为"待接收"，通知司机，关闭弹窗', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '派发任务确认弹窗', responseAction: '关闭', remark: '任务保持"待派发"状态' },
    ],
  },
  'H.6.6': {
    title: '改派任务弹窗',
    table: [
      { triggerObject: '新车辆选择下拉', triggerAction: '选择', responseCondition: '审核通过的"可调配"车辆', responseObject: '表单字段', responseAction: '校验通过', remark: '—' },
      { triggerObject: '新司机选择下拉', triggerAction: '选择', responseCondition: '审核通过的"可调配"司机', responseObject: '表单字段', responseAction: '校验通过', remark: '—' },
      { triggerObject: '确认改派按钮', triggerAction: '点击', responseCondition: '已选择新资源且校验通过', responseObject: '系统', responseAction: '完成改派，通知原司机和新司机，关闭弹窗', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '改派任务弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
  'H.6.7': {
    title: '取消任务确认弹窗',
    table: [
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '任务状态非"已完成"', responseObject: '系统', responseAction: '任务状态变为"已取消"，通知司机，关闭弹窗', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '取消任务确认弹窗', responseAction: '关闭', remark: '任务保持原状态' },
    ],
  },
  'H.6.8': {
    title: '暂停审批弹窗',
    table: [
      { triggerObject: '通过按钮', triggerAction: '点击', responseCondition: '任务状态为"执行中"且司机已提交暂停申请', responseObject: '系统', responseAction: '任务状态变为"已暂停"，通知司机，关闭弹窗', remark: '—' },
      { triggerObject: '不通过按钮', triggerAction: '点击', responseCondition: '任务状态为"执行中"且司机已提交暂停申请', responseObject: '系统', responseAction: '弹出不通过原因输入框（必填）', remark: '—' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '暂停审批弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
};

export const driverMobileHelpData: Record<string, HelpData> = {
  'H.7.1': {
    title: '司机端任务页（首页）',
    table: [
      { triggerObject: '页面', triggerAction: '首次进入', responseCondition: '未确认告知书', responseObject: '告知书确认弹窗', responseAction: '弹出', remark: '—' },
      { triggerObject: '页面', triggerAction: '首次进入', responseCondition: '已确认告知书', responseObject: '页面', responseAction: '正常显示任务列表', remark: '—' },
      { triggerObject: '统计卡片（待接收）', triggerAction: '点击', responseCondition: '无', responseObject: '任务列表', responseAction: '筛选展示待接收状态的任务列表', remark: '—' },
      { triggerObject: '统计卡片（已接收）', triggerAction: '点击', responseCondition: '无', responseObject: '任务列表', responseAction: '筛选展示已接收状态的任务列表', remark: '—' },
      { triggerObject: '统计卡片（执行中）', triggerAction: '点击', responseCondition: '无', responseObject: '任务列表', responseAction: '筛选展示执行中状态的任务列表', remark: '—' },
      { triggerObject: '任务卡片', triggerAction: '点击', responseCondition: '任务存在', responseObject: '任务详情页', responseAction: '进入', remark: '—' },
      { triggerObject: '下拉刷新区域', triggerAction: '下拉', responseCondition: '无', responseObject: '任务列表', responseAction: '刷新任务数据', remark: '—' },
      { triggerObject: '历史任务按钮', triggerAction: '点击', responseCondition: '无', responseObject: '历史任务列表页', responseAction: '进入', remark: '—' },
    ],
  },
  'H.7.2': {
    title: '告知书确认弹窗',
    table: [
      { triggerObject: '我已阅读并同意按钮', triggerAction: '点击', responseCondition: '无', responseObject: '系统', responseAction: '记录告知书确认状态，关闭弹窗，不再重复弹出', remark: '—' },
      { triggerObject: '拒绝按钮', triggerAction: '点击', responseCondition: '无', responseObject: '系统', responseAction: '提示"拒绝后部分功能可能受限"，可选择继续拒绝或重新确认', remark: '—' },
    ],
  },
  'H.7.3': {
    title: '司机端任务详情页',
    table: [
      { triggerObject: '接收按钮', triggerAction: '点击', responseCondition: '任务状态为"待接收"', responseObject: '系统', responseAction: '任务状态变为"已接收"，通知现场调度员', remark: '—' },
      { triggerObject: '接收按钮', triggerAction: '点击', responseCondition: '任务状态非"待接收"', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '拒绝按钮', triggerAction: '点击', responseCondition: '任务状态为"待接收"或"已接收"', responseObject: '拒绝任务弹窗', responseAction: '打开', remark: '—' },
      { triggerObject: '拒绝按钮', triggerAction: '点击', responseCondition: '任务状态非"待接收"或"已接收"', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '开始执行按钮', triggerAction: '点击', responseCondition: '任务状态为"已接收"', responseObject: '系统', responseAction: '弹出确认框', remark: '—' },
      { triggerObject: '开始执行按钮', triggerAction: '点击', responseCondition: '任务状态非"已接收"', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '暂停任务按钮', triggerAction: '点击', responseCondition: '任务状态为"执行中"', responseObject: '暂停任务弹窗', responseAction: '打开', remark: '—' },
      { triggerObject: '暂停任务按钮', triggerAction: '点击', responseCondition: '任务状态非"执行中"', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '继续执行按钮', triggerAction: '点击', responseCondition: '任务状态为"已暂停"', responseObject: '系统', responseAction: '任务状态变为"执行中"，恢复GPS位置上报（不需审批）', remark: '—' },
      { triggerObject: '继续执行按钮', triggerAction: '点击', responseCondition: '任务状态非"已暂停"', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '完成任务按钮', triggerAction: '点击', responseCondition: '任务状态为"执行中"', responseObject: '系统', responseAction: '弹出确认框', remark: '—' },
      { triggerObject: '完成任务按钮', triggerAction: '点击', responseCondition: '任务状态非"执行中"', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '故障上报按钮', triggerAction: '点击', responseCondition: '任务状态为"已接收"或"执行中"', responseObject: '故障上报弹窗', responseAction: '打开', remark: '—' },
      { triggerObject: '故障上报按钮', triggerAction: '点击', responseCondition: '任务状态非"已接收"或"执行中"', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '司机电话链接', triggerAction: '点击', responseCondition: '号码存在', responseObject: '系统', responseAction: '触发一键拨号', remark: '—' },
      { triggerObject: '现场调度员电话链接', triggerAction: '点击', responseCondition: '号码存在', responseObject: '系统', responseAction: '触发一键拨号', remark: '—' },
    ],
  },
  'H.7.4': {
    title: '拒绝任务弹窗',
    table: [
      { triggerObject: '拒绝原因输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '拒绝原因输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请填写拒绝原因"' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '拒绝原因已填写', responseObject: '系统', responseAction: '任务状态变为"已拒绝"，通知现场调度员和活动总调度员，关闭弹窗', remark: '—' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '拒绝原因未填写', responseObject: '系统', responseAction: '不响应', remark: '按钮置灰' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '拒绝任务弹窗', responseAction: '关闭', remark: '任务保持原状态' },
    ],
  },
  'H.7.5': {
    title: '暂停任务弹窗',
    table: [
      { triggerObject: '暂停原因输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '暂停原因输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请填写暂停原因"' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '暂停原因已填写', responseObject: '系统', responseAction: '任务状态变为"已暂停"，GPS采集暂停，通知活动总调度员审核，关闭弹窗', remark: '—' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '暂停原因未填写', responseObject: '系统', responseAction: '不响应', remark: '按钮置灰' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '暂停任务弹窗', responseAction: '关闭', remark: '任务保持"执行中"' },
    ],
  },
  'H.7.6': {
    title: '故障上报弹窗',
    table: [
      { triggerObject: '故障描述输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '故障描述输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请填写故障描述"' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '故障描述已填写', responseObject: '系统', responseAction: '任务标记为异常（E6），关联车辆状态置为"不可用"，通知现场调度员和活动总调度员，关闭弹窗', remark: '—' },
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '故障描述未填写', responseObject: '系统', responseAction: '不响应', remark: '按钮置灰' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '故障上报弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
};

export const dispatcherMobileHelpData: Record<string, HelpData> = {
  'H.8.1': {
    title: '调度员移动端任务页',
    table: [
      { triggerObject: '活动选择器', triggerAction: '点击', responseCondition: '无', responseObject: '活动选择器', responseAction: '下拉显示可切换的活动列表', remark: '现场调度员仅可查看有权限的活动' },
      { triggerObject: '统计卡片', triggerAction: '点击', responseCondition: '无', responseObject: '任务列表', responseAction: '筛选展示对应状态的任务列表', remark: '默认展示异常任务（如有），否则展示待接收' },
      { triggerObject: '任务卡片', triggerAction: '点击', responseCondition: '任务存在', responseObject: '任务详情页', responseAction: '进入', remark: '—' },
      { triggerObject: '任务卡片', triggerAction: '长按', responseCondition: '任务存在', responseObject: '快捷操作菜单', responseAction: '弹出', remark: '根据状态和活动时期显示不同操作（派发/改派/取消）' },
      { triggerObject: '快速创建任务按钮', triggerAction: '点击', responseCondition: '活动处于筹备期或执行期', responseObject: '快速创建任务弹窗', responseAction: '打开', remark: '—' },
      { triggerObject: '快速创建任务按钮', triggerAction: '点击', responseCondition: '活动处于结束期', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
    ],
  },
  'H.8.2': {
    title: '快速创建任务弹窗',
    table: [
      { triggerObject: '任务名称输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '任务名称输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入任务名称"' },
      { triggerObject: '任务类型下拉', triggerAction: '选择', responseCondition: '接送机/办事出行/会议通勤/考察调研/公务用车/商务接待/其他', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '开始日期/开始时间', triggerAction: '选择', responseCondition: '开始时间≤结束时间，日期默认当天', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '开始日期/开始时间', triggerAction: '选择', responseCondition: '开始时间>结束时间', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"开始时间不能晚于结束时间"' },
      { triggerObject: '结束日期/结束时间', triggerAction: '选择', responseCondition: '结束时间≥开始时间', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项；支持跨天任务' },
      { triggerObject: '出发地输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '出发预计时间', triggerAction: '选择', responseCondition: '—', responseObject: '表单字段', responseAction: '记录出发预计时间', remark: '选填项' },
      { triggerObject: '目的地输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '到达预计时间', triggerAction: '选择', responseCondition: '—', responseObject: '表单字段', responseAction: '记录到达预计时间', remark: '选填项' },
      { triggerObject: '添加途经点按钮', triggerAction: '点击', responseCondition: '途经点数量<10个', responseObject: '表单', responseAction: '添加途经点输入框（含预计时间）', remark: '选填项' },
      { triggerObject: '添加途经点按钮', triggerAction: '点击', responseCondition: '途经点数量≥10个', responseObject: '系统', responseAction: '不响应', remark: '按钮置灰' },
      { triggerObject: '乘车人输入框', triggerAction: '填写', responseCondition: '—', responseObject: '表单字段', responseAction: '校验通过', remark: '选填项' },
      { triggerObject: '联系电话输入框', triggerAction: '填写', responseCondition: '—', responseObject: '表单字段', responseAction: '校验通过', remark: '选填项' },
      { triggerObject: '乘车人数输入框', triggerAction: '填写', responseCondition: '正整数', responseObject: '表单字段', responseAction: '校验通过', remark: '选填项，用于匹配车辆座位数' },
      { triggerObject: '任务描述输入框', triggerAction: '填写', responseCondition: '—', responseObject: '表单字段', responseAction: '校验通过', remark: '选填项' },
      { triggerObject: '车型检索下拉', triggerAction: '选择', responseCondition: '—', responseObject: '公共检索结果列表', responseAction: '实时过滤，仅展示该车型可调配车辆', remark: '公共检索区，各检索条件共享；移动端不提供核载人数检索；不影响已添加的车辆；选"全部车型"恢复' },
      { triggerObject: '车牌号检索输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '公共检索结果列表', responseAction: '实时过滤，仅展示车牌号包含输入值的可调配车辆', remark: '公共检索区，不区分大小写；不影响已添加的车辆；清空恢复' },
      { triggerObject: '检索结果列表项', triggerAction: '点击', responseCondition: '审核通过的"可调配"车辆，未被本任务已添加行选用', responseObject: '已分配车辆列表', responseAction: '追加为新一列"车辆卡片+司机下拉+删除"，自动带出默认司机（如已绑定且可用且未被其他行占用）', remark: '公共检索区，重新检索不影响已添加的车辆；该车辆从检索结果中排除；展示车牌号、车辆类型、品牌；自动带出的司机可手动更换' },
      { triggerObject: '司机选择下拉', triggerAction: '选择', responseCondition: '审核通过的"可调配"司机，未被本任务其他行选用', responseObject: '表单字段', responseAction: '校验通过', remark: '每辆车必须分配一名司机；同一任务内司机不可重复' },
      { triggerObject: '司机选择下拉', triggerAction: '选择', responseCondition: '选择的司机已被本任务其他行选用', responseObject: '表单字段', responseAction: '校验失败', remark: '该选项从下拉中排除' },
      { triggerObject: '删除车辆按钮', triggerAction: '点击', responseCondition: '已添加车辆行', responseObject: '已分配车辆列表', responseAction: '删除该行车辆与司机', remark: '可删除任意已添加行；删除后该车辆重新出现在公共检索结果列表' },
      { triggerObject: '创建任务按钮', triggerAction: '点击', responseCondition: '所有必填项校验通过，且每辆已添加车辆均已分配司机', responseObject: '系统', responseAction: '创建任务记录，关闭弹窗', remark: '创建时可暂不分配（不添加任何车辆）' },
      { triggerObject: '创建并派发按钮', triggerAction: '点击', responseCondition: '活动处于执行期且所有车辆均已分配司机', responseObject: '系统', responseAction: '创建任务并派发，状态变为"待接收"，通知各司机', remark: '—' },
      { triggerObject: '创建并派发按钮', triggerAction: '点击', responseCondition: '活动处于筹备期或存在未分配司机的车辆', responseObject: '系统', responseAction: '不响应', remark: '按钮显示为"创建任务"' },
    ],
  },
};

export const trackHelpData: Record<string, HelpData> = {
  'H.9.1': {
    title: '轨迹大屏页面',
    table: [
      { triggerObject: '活动选择器', triggerAction: '切换', responseCondition: '活动存在', responseObject: '地图区域', responseAction: '刷新地图，显示新活动的司机位置', remark: '—' },
      { triggerObject: '地图上的司机图标', triggerAction: '点击', responseCondition: '司机存在且处于执行中', responseObject: '司机信息卡片', responseAction: '弹出', remark: '显示司机姓名、手机号、当前任务等' },
      { triggerObject: '右侧面板司机列表项', triggerAction: '点击', responseCondition: '司机存在', responseObject: '地图区域', responseAction: '自动定位至该司机位置，弹出司机信息卡片', remark: '—' },
      { triggerObject: '查看任务详情按钮', triggerAction: '点击', responseCondition: '任务存在', responseObject: '任务详情页', responseAction: '跳转', remark: '—' },
      { triggerObject: '全屏模式按钮', triggerAction: '点击', responseCondition: '无', responseObject: '页面', responseAction: '进入全屏模式', remark: '适配大屏/投屏展示' },
    ],
  },
  'H.9.2': {
    title: '轨迹回放弹窗',
    table: [
      { triggerObject: '播放按钮', triggerAction: '点击', responseCondition: '轨迹点≥2个', responseObject: '系统', responseAction: '开始播放轨迹，显示当前播放时间点、已行驶距离、行驶时长', remark: '—' },
      { triggerObject: '播放按钮', triggerAction: '点击', responseCondition: '轨迹点<2个', responseObject: '系统', responseAction: '不响应', remark: '按钮置灰' },
      { triggerObject: '暂停按钮', triggerAction: '点击', responseCondition: '正在播放', responseObject: '系统', responseAction: '暂停轨迹播放', remark: '—' },
      { triggerObject: '暂停按钮', triggerAction: '点击', responseCondition: '未播放', responseObject: '系统', responseAction: '不响应', remark: '按钮隐藏' },
      { triggerObject: '倍速选择器（1x/2x/4x/8x）', triggerAction: '选择', responseCondition: '正在播放或已暂停', responseObject: '系统', responseAction: '调整播放速度', remark: '—' },
      { triggerObject: '进度条', triggerAction: '拖动', responseCondition: '轨迹数据存在', responseObject: '系统', responseAction: '跳转到指定时间点的轨迹位置', remark: '—' },
    ],
  },
};

export const dispatcherHelpData: Record<string, HelpData> = {
  'H.10.1': {
    title: '调度员管理列表页',
    description: '集中管理所有现场调度员。可按调度员姓名、所属活动、单位名称组合筛选；编辑时所属活动不可修改；删除前会校验是否存在未结束任务。',
    table: [
      { triggerObject: '新增调度员按钮', triggerAction: '点击', responseCondition: '无', responseObject: '新增调度员弹窗', responseAction: '打开', remark: '系统管理员、活动总调度员可操作' },
      { triggerObject: '批量导入按钮', triggerAction: '点击', responseCondition: '无', responseObject: '批量导入弹窗', responseAction: '打开', remark: '系统管理员、活动总调度员可操作' },
      { triggerObject: '下载导入模板按钮', triggerAction: '点击', responseCondition: '无', responseObject: '系统', responseAction: '下载调度员导入模板文件', remark: '模板字段：单位名称、调度员姓名、手机号、所属活动名称、职务、身份证号' },
      { triggerObject: '调度员搜索输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '调度员列表', responseAction: '刷新', remark: '按调度员姓名模糊搜索' },
      { triggerObject: '所属活动筛选下拉', triggerAction: '选择', responseCondition: '筛选条件有效', responseObject: '调度员列表', responseAction: '刷新', remark: '展示符合条件的调度员' },
      { triggerObject: '单位名称搜索输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '调度员列表', responseAction: '刷新', remark: '按单位名称模糊搜索' },
      { triggerObject: '编辑按钮', triggerAction: '点击', responseCondition: '调度员记录存在', responseObject: '编辑调度员弹窗', responseAction: '打开', remark: '预填充该调度员信息；所属活动字段不可修改' },
      { triggerObject: '删除按钮', triggerAction: '点击', responseCondition: '作为现场调度员的任务中，未结束任务数量为0', responseObject: '删除确认框', responseAction: '弹出', remark: '—' },
      { triggerObject: '删除按钮', triggerAction: '点击', responseCondition: '作为现场调度员的任务中，存在未结束任务', responseObject: '系统', responseAction: '弹窗提示绑定的活动和任务名称，不执行删除', remark: '提示格式：该调度员绑定活动【XXXX 活动名称】，尚有未结束任务【任务名称 1】、【任务名称 2】。请对相关任务进行处置，待任务办结后再进行删除。' },
    ],
  },
  'H.10.2': {
    title: '新增/编辑调度员弹窗',
    description: '编辑时所属活动不可修改；状态切换为"禁用"前会校验是否存在未结束任务；同一手机号+同一姓名允许跨多个活动有多条记录，不视为重复。\n\n【用户管理联动规则（规格要求，开发人员需知）】调度员与用户管理中的"现场调度员"账号一一对应（按手机号匹配）：新增时按手机号自动创建/复用用户账号；编辑时按字段变更同步用户昵称/用户名/手机号/启用状态；删除/禁用时同步将用户状态置为"禁用"（不删除用户账号）。\n\n【demo 实现状态】当前 demo 仅保留调度员记录本身的 CRUD，未接入用户管理联动。',
    table: [
      { triggerObject: '单位名称输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '单位名称输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入单位名称"' },
      { triggerObject: '调度员姓名输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，用作用户账号昵称' },
      { triggerObject: '调度员姓名输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入调度员姓名"' },
      { triggerObject: '手机号输入框', triggerAction: '填写', responseCondition: '有效手机号；且该手机号在已存在的调度员记录中：①无记录（全新手机号），或②所有记录的姓名=当前输入姓名（即同一人跨活动），不与他人冲突，编辑时除自身外其他记录符合前述规则', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，用作用户账号用户名和登录手机号；同一人（同姓名+同手机号）允许跨多个活动有多条记录，不视为重复' },
      { triggerObject: '手机号输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入手机号"' },
      { triggerObject: '手机号输入框', triggerAction: '填写', responseCondition: '无效手机号格式', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入有效手机号"' },
      { triggerObject: '手机号输入框', triggerAction: '填写', responseCondition: '该手机号在已存在的调度员记录中，有记录的姓名≠当前输入姓名（即被其他人占用），编辑时同样排除自身记录后仍冲突', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"该手机号已被其他调度员使用，请使用其他手机号"；若出现部分相等、部分不等（数据异常），提示"该手机号已被不同姓名的调度员使用，数据异常，请先联系管理员处理"' },
      { triggerObject: '所属活动下拉（新增时）', triggerAction: '选择', responseCondition: '活动状态为筹备期或执行期', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项' },
      { triggerObject: '所属活动下拉（新增时）', triggerAction: '选择', responseCondition: '活动状态为结束期', responseObject: '表单字段', responseAction: '不展示在下拉列表中', remark: '结束期活动不在可选范围' },
      { triggerObject: '所属活动下拉（新增时）', triggerAction: '点击', responseCondition: '活动下拉为空', responseObject: '系统', responseAction: '提示"暂无可用的活动，请先创建活动"', remark: '—' },
      { triggerObject: '所属活动控件（编辑时）', triggerAction: '点击', responseCondition: '弹窗处于编辑模式', responseObject: '所属活动控件', responseAction: '渲染为只读（禁用下拉或显示为纯文本），不可修改', remark: '编辑时所属活动字段不允许修改' },
      { triggerObject: '职务输入框', triggerAction: '填写', responseCondition: '非空', responseObject: '表单字段', responseAction: '校验通过', remark: '必填项，如"现场调度员"、"调度科科长"等' },
      { triggerObject: '职务输入框', triggerAction: '填写', responseCondition: '为空', responseObject: '表单字段', responseAction: '校验失败', remark: '显示"请输入职务"' },
      { triggerObject: '身份证号输入框', triggerAction: '填写', responseCondition: '任意', responseObject: '表单字段', responseAction: '校验通过', remark: '选填项' },
      { triggerObject: '状态下拉（编辑时）', triggerAction: '选择', responseCondition: '切换为"可用"', responseObject: '表单字段', responseAction: '校验通过', remark: '编辑时可切换；变更后自动同步用户管理中对应用户的状态为"启用"' },
      { triggerObject: '状态下拉（编辑时）', triggerAction: '选择', responseCondition: '切换为"禁用"且该调度员关联的未结束任务数量为0', responseObject: '表单字段', responseAction: '校验通过', remark: '变更后自动同步用户管理中对应用户的状态为"禁用"' },
      { triggerObject: '状态下拉（编辑时）', triggerAction: '选择', responseCondition: '切换为"禁用"且该调度员关联的未结束任务数量>0', responseObject: '系统', responseAction: '弹窗提示绑定的活动和任务名称，不执行禁用修改', remark: '提示格式：该调度员绑定活动【XXXX 活动名称】，尚有未结束任务【任务名称 1】、【任务名称 2】。请对相关任务进行处置，待任务办结后再进行修改。' },
      { triggerObject: '保存按钮（新增时）', triggerAction: '点击', responseCondition: '所有必填项校验通过', responseObject: '系统', responseAction: '创建调度员记录，自动处理用户账号，关闭弹窗', remark: '账号处理规则：①若该手机号在用户管理中不存在→自动创建用户账号（昵称=调度员姓名、用户名=手机号、手机号=手机号、角色=现场调度员、状态=启用）；②若该手机号已存在用户→将该用户状态置为"可用"并关联；若已有该手机号对应用户的昵称≠当前姓名，校验不通过（不允许姓名冲突）' },
      { triggerObject: '保存按钮（新增时）', triggerAction: '点击', responseCondition: '有必填项未通过校验', responseObject: '表单', responseAction: '不提交，高亮显示未通过项', remark: '—' },
      { triggerObject: '保存按钮（编辑时）', triggerAction: '点击', responseCondition: '所有必填项校验通过且状态变更校验通过', responseObject: '系统', responseAction: '更新调度员记录，同步用户管理中的昵称/手机号/状态等信息，关闭弹窗', remark: '同步规则：若修改了姓名→同步用户昵称；若修改了手机号→同步用户名和手机号；若修改了状态→同步用户启用/禁用；所属活动不会被更新' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '新增/编辑调度员弹窗', responseAction: '关闭', remark: '不保存' },
    ],
  },
  'H.10.3': {
    title: '批量导入调度员弹窗',
    description: '上传 CSV 文件后展示校验结果预览，按条标注成功/失败及失败原因；提交后只导入校验通过的记录，并对被跳过的条目统计反馈。\n\n【用户管理联动规则（规格要求，开发人员需知）】批量导入的账号处理规则与"新增调度员"一致：按手机号匹配，已有用户则置为"可用"并关联，无账号则创建。\n\n【demo 实现状态】当前 demo 仅创建调度员记录，未接入用户管理联动。',
    table: [
      { triggerObject: '下载模板按钮', triggerAction: '点击', responseCondition: '无', responseObject: '系统', responseAction: '下载调度员导入模板文件', remark: '模板字段：单位名称、调度员姓名、手机号、所属活动名称、职务、身份证号' },
      { triggerObject: 'CSV文件上传按钮', triggerAction: '点击', responseCondition: '文件格式正确且已选择文件', responseObject: '系统', responseAction: '校验文件内容格式，展示校验结果预览', remark: '单次导入上限500条；同手机号+同姓名允许跨活动多条记录；同手机号+不同姓名的记录视为被他人占用，标注为"该手机号已被其他姓名的调度员占用"跳过；导入文件内出现同手机号+不同姓名冲突，后续标注"该手机号在导入文件内已被不同姓名使用，存在冲突"跳过' },
      { triggerObject: 'CSV文件上传按钮', triggerAction: '点击', responseCondition: '文件格式不正确', responseObject: '系统', responseAction: '提示"请上传正确格式的CSV文件"', remark: '—' },
      { triggerObject: '确认导入按钮', triggerAction: '点击', responseCondition: '存在成功记录（校验通过的记录）', responseObject: '系统', responseAction: '按条创建调度员记录，自动处理用户账号，展示导入结果，关闭弹窗', remark: '账号处理规则与"新增调度员"一致（已存在且同姓名置为可用；无账号则创建）；批量导入后调度员状态均为"可用"；同手机号+同姓名+同活动的重复导入记录以第一次为准，后续标注"重复"跳过' },
      { triggerObject: '确认导入按钮', triggerAction: '点击', responseCondition: '不存在成功记录', responseObject: '系统', responseAction: '提示"无有效数据可导入"', remark: '—' },
      { triggerObject: '导入结果详情', triggerAction: '查看', responseCondition: '存在校验不通过的记录', responseObject: '系统', responseAction: '标注每条的跳过原因（手机号格式错误、活动名称不匹配、被其他姓名调度员占用的手机号、文件内冲突、重复等）', remark: '不执行导入' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '批量导入调度员弹窗', responseAction: '关闭', remark: '不执行导入' },
    ],
  },
  'H.10.4': {
    title: '删除调度员确认框',
    description: '点击列表"删除"按钮且通过未结束任务校验后弹出；点击"确认删除"才真正执行删除。\n\n【用户管理联动规则（规格要求，开发人员需知）】删除调度员时，同步将用户管理中对应用户的状态置为"禁用"（不删除用户账号）。\n\n【demo 实现状态】当前 demo 仅删除调度员记录，未接入用户管理联动。',
    table: [
      { triggerObject: '确认按钮', triggerAction: '点击', responseCondition: '该调度员关联的未结束任务数量为0', responseObject: '系统', responseAction: '删除调度员记录，同步用户管理中对应用户的状态为"禁用"（不删除用户账号），关闭弹窗', remark: '校验范围：作为任务"现场调度员"字段，任务状态不为"已完成"且不为"已取消"的视为未结束' },
      { triggerObject: '取消按钮', triggerAction: '点击', responseCondition: '无', responseObject: '删除确认框', responseAction: '关闭', remark: '不执行删除' },
    ],
  },
};