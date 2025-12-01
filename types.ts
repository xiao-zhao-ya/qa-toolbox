export enum ToolCategory {
  DATA = '数据 & 格式',
  TIME = '时间工具',
  HTTP = 'HTTP & 网络',
  ENCODE = '编码 & 加密',
  TEXT = '文本 & 正则',
  GEN = '数据生成'
}

export interface Tool {
  id: string;
  name: string;
  desc: string;
  path: string;
  category: ToolCategory;
  icon: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}