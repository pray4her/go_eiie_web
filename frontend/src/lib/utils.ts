import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCategory(category: string): string {
  // Extract prefix before " - " if exists
  const prefix = category.split(" - ")[0];
  
  switch (prefix) {
    case "Resume/CV":
      return "简历";
    case "Identity Documents":
      return "身份证明";
    case "Educational Credentials":
      return "学历证明";
    case "Employment Verification":
      return "工作证明";
    case "Research Project Proof":
    case "Research Project Documentation":
      return "项目证明";
    case "Research Paper Proof":
    case "Original Research Paper":
      return "论文";
    case "Research/Technical Report Proof":
      return "研究报告";
    case "Book/Book Chapter Proof":
    case "Book Proof":
      return "著作证明";
    case "Conference Proof":
    case "Conference Documentation":
      return "会议证明";
    case "Patent Proof":
    case "Patent Documentation":
      return "专利证明";
    case "Honors/Titles Proof":
    case "Honors Documentation":
      return "荣誉证明";
    case "Academic Appointment Proof":
    case "Academic Appointment Documentation":
      return "兼职证明";
    case "Other Evidence":
      return "其他证明";
    case "Other File":
      return "其他文件";
    default:
      return "文件";
  }
}

// 文件类型选项（根据后端接口返回的格式）
export const FILE_TYPE_OPTIONS = [
  { value: "Resume/CV", label: "简历" },
  { value: "Identity Documents", label: "身份证明" },
  { value: "Educational Credentials", label: "学历证明" },
  { value: "Employment Verification", label: "工作证明" },
  { value: "Research Project Proof", label: "项目证明" },
  { value: "Research Paper Proof", label: "论文证明" },
  { value: "Research/Technical Report Proof", label: "研究报告" },
  { value: "Book/Book Chapter Proof", label: "书籍证明" },
  { value: "Conference Proof", label: "会议证明" },
  { value: "Patent Proof", label: "专利证明" },
  { value: "Honors/Titles Proof", label: "荣誉证明" },
  { value: "Academic Appointment Proof", label: "兼职证明" },
  { value: "Other Evidence", label: "其他证明" },
  { value: "Other File", label: "其他文件" },
] as const;

// 文件类型标签映射
export function getFileTypeLabel(fileType: string | undefined | null): string {
  if (!fileType) return "未设置";
  
  const typeMap: Record<string, string> = {
    "Resume/CV": "简历",
    "Identity Documents": "身份证明",
    "Educational Credentials": "学历证明",
    "Employment Verification": "工作证明",
    "Research Project Proof": "项目证明",
    "Research Paper Proof": "论文证明",
    "Research/Technical Report Proof": "研究报告",
    "Book/Book Chapter Proof": "书籍证明",
    "Conference Proof": "会议证明",
    "Patent Proof": "专利证明",
    "Honors/Titles Proof": "荣誉证明",
    "Academic Appointment Proof": "兼职证明",
    "Other Evidence": "其他证明",
    "Other File": "其他文件",
  };
  
  return typeMap[fileType] || fileType;
}
