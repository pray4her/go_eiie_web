/**
 * 受保护区顶栏导航项：与 (protected)/layout 中行为保持一致（含前缀匹配）。
 */
export type ProtectedNavItem = {
  href: string;
  label: string;
  /** 当前路径是否视为该导航项激活 */
  isActive: (pathname: string) => boolean;
};

export const PROTECTED_NAV_ITEMS: ProtectedNavItem[] = [
  { href: '/dashboard', label: '信息提取', isActive: (p) => p === '/dashboard' },
  { href: '/generate-text', label: '200字生成', isActive: (p) => p === '/generate-text' },
  { href: '/generate-image', label: '提取签名', isActive: (p) => p === '/generate-image' },
  { href: '/generate-resume', label: '外发简历', isActive: (p) => p === '/generate-resume' },
  { href: '/resume-process', label: '简历处理', isActive: (p) => p.startsWith('/resume-process') },
  { href: '/customer-analyses', label: '客户分析', isActive: (p) => p.startsWith('/customer-analyses') },
  { href: '/prompts', label: 'Prompt 管理', isActive: (p) => p.startsWith('/prompts') },
];
