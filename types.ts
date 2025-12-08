export enum ToolCategory {
  ANALYSIS = '数据分析',
  CONVERSION = '数据转换',
  BASIC = '基本工具'
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