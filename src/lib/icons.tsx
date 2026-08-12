import {
  LayoutDashboardIcon,
  UsersIcon,
  HeartIcon,
  GraduationCapIcon,
  UserCogIcon,
  SchoolIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  FileTextIcon,
  AwardIcon,
  FileSpreadsheetIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  TagsIcon,
  ScrollTextIcon,
  WalletIcon,
  ReceiptIcon,
  ChartColumnIcon,
  MegaphoneIcon,
  PartyPopperIcon,
  LibraryIcon,
  BusIcon,
  BoxesIcon,
  BriefcaseIcon,
  CalendarOffIcon,
  BanknoteIcon,
  BarChart3Icon,
  SettingsIcon,
  PackageIcon,
  CreditCardIcon,
  ActivityIcon,
  type LucideIcon,
} from "lucide-react";

export type IconName =
  | "layout-dashboard"
  | "users"
  | "user-heart"
  | "graduation-cap"
  | "user-cog"
  | "school"
  | "book-open"
  | "calendar-check"
  | "file-text"
  | "award"
  | "file-spreadsheet"
  | "calendar-clock"
  | "clipboard-list"
  | "tags"
  | "file-invoice"
  | "wallet"
  | "receipt"
  | "chart-column"
  | "megaphone"
  | "party-popper"
  | "library"
  | "bus"
  | "boxes"
  | "briefcase"
  | "calendar-off"
  | "banknote"
  | "bar-chart-3"
  | "settings"
  | "package"
  | "credit-card"
  | "activity";

const ICONS: Record<IconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboardIcon,
  users: UsersIcon,
  "user-heart": HeartIcon,
  "graduation-cap": GraduationCapIcon,
  "user-cog": UserCogIcon,
  school: SchoolIcon,
  "book-open": BookOpenIcon,
  "calendar-check": CalendarCheckIcon,
  "file-text": FileTextIcon,
  award: AwardIcon,
  "file-spreadsheet": FileSpreadsheetIcon,
  "calendar-clock": CalendarClockIcon,
  "clipboard-list": ClipboardListIcon,
  tags: TagsIcon,
  "file-invoice": ScrollTextIcon,
  wallet: WalletIcon,
  receipt: ReceiptIcon,
  "chart-column": ChartColumnIcon,
  megaphone: MegaphoneIcon,
  "party-popper": PartyPopperIcon,
  library: LibraryIcon,
  bus: BusIcon,
  boxes: BoxesIcon,
  briefcase: BriefcaseIcon,
  "calendar-off": CalendarOffIcon,
  banknote: BanknoteIcon,
  "bar-chart-3": BarChart3Icon,
  settings: SettingsIcon,
  package: PackageIcon,
  "credit-card": CreditCardIcon,
  activity: ActivityIcon,
};

export function iconFor(name: IconName): LucideIcon {
  return ICONS[name] ?? LayoutDashboardIcon;
}
