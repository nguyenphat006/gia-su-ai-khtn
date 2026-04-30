import { 
  Settings, 
  BookOpen, 
  Users, 
  LayoutDashboard, 
  FileText,
  ShieldCheck,
  BrainCircuit,
  Database
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavSubItem {
  title: string;
  to: string;
}

export interface NavItem {
  title: string;
  to?: string; // If has subItems, 'to' might be optional or used as a prefix
  icon: LucideIcon;
  subItems?: NavSubItem[];
}

export interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const ADMIN_NAV_CONFIG: NavGroup[] = [
  {
    groupName: "Hệ thống",
    items: [
      {
        title: "Bảng điều khiển",
        to: "/admin/dashboard", // Future use
        icon: LayoutDashboard,
      },
      {
        title: "Cấu hình AI",
        icon: BrainCircuit,
        subItems: [
          { title: "System Prompt", to: "/admin/ai-config" },
          { title: "Model Settings", to: "/admin/ai-settings" }, // Future use
        ]
      }
    ]
  },
  {
    groupName: "Dữ liệu & Tri thức",
    items: [
      {
        title: "Kho tri thức",
        icon: Database,
        subItems: [
          { title: "Tài liệu RAG", to: "/admin/knowledge" },
          { title: "Lịch sử nạp", to: "/admin/knowledge/history" }, // Future use
        ]
      },
      {
        title: "Nội dung bài học",
        to: "/admin/lessons", // Future use
        icon: FileText,
      }
    ]
  },
  {
    groupName: "Người dùng",
    items: [
      {
        title: "Quản lý người dùng",
        to: "/admin/users", // Future use
        icon: Users,
      },
      {
        title: "Quyền hạn",
        to: "/admin/roles", // Future use
        icon: ShieldCheck,
      }
    ]
  }
];
