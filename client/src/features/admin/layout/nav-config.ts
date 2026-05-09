import { 
  BookOpen, 
  Users, 
  LayoutDashboard, 
  BrainCircuit,
  Database,
  School,
  Swords
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavSubItem {
  title: string;
  to: string;
}

export interface NavItem {
  title: string;
  to?: string;
  icon: LucideIcon;
  subItems?: NavSubItem[];
}

export interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const ADMIN_NAV_CONFIG: NavGroup[] = [
  {
    groupName: "Giám sát & Báo cáo",
    items: [
      {
        title: "Báo cáo & Thống kê",
        to: "/admin/analytics",
        icon: LayoutDashboard,
      },
      {
        title: "Báo cáo Đấu trường",
        to: "/admin/arena-reports",
        icon: Swords,
      }
    ]
  },
  {
    groupName: "Hệ thống",
    items: [
      {
        title: "Cấu hình AI",
        to: "/admin/ai-config",
        icon: BrainCircuit,
      }
    ]
  },
  {
    groupName: "Dữ liệu & Tri thức",
    items: [
      {
        title: "Kho tri thức RAG",
        to: "/admin/knowledge",
        icon: Database,
      },
      {
        title: "Ngân hàng Ôn tập",
        to: "/admin/revision",
        icon: BookOpen,
      }
    ]
  },
  {
    groupName: "Quản lý Học đường",
    items: [
      {
        title: "Danh sách Lớp học",
        to: "/admin/classes",
        icon: School,
      },
      {
        title: "Người dùng hệ thống",
        to: "/admin/users",
        icon: Users,
      }
    ]
  }
];
