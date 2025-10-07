import { 
  HomeIcon, 
  BriefcaseIcon,
  UsersIcon,
  DocumentChartBarIcon,
  WrenchIcon 
} from "@heroicons/react/24/outline";
import { SvgIcon } from "@mui/material";

export const nativeMenuItems = [
  {
    title: "Dashboard",
    path: "/",
    icon: (
      <SvgIcon>
        <HomeIcon />
      </SvgIcon>
    ),
    permissions: ["LightingDesigner.*"],
  },
  {
    title: "Jobs",
    path: "/jobs",
    icon: (
      <SvgIcon>
        <BriefcaseIcon />
      </SvgIcon>
    ),
    permissions: ["LightingDesigner.Jobs.*"],
  },
  {
    title: "Customers",
    path: "/customers",
    icon: (
      <SvgIcon>
        <UsersIcon />
      </SvgIcon>
    ),
    permissions: ["LightingDesigner.Customers.*"],
  },
  {
    title: "Reports",
    path: "/reports",
    icon: (
      <SvgIcon>
        <DocumentChartBarIcon />
      </SvgIcon>
    ),
    permissions: ["LightingDesigner.Reports.*"],
  },
  {
    title: "Settings",
    type: "header",
    icon: (
      <SvgIcon>
        <WrenchIcon />
      </SvgIcon>
    ),
    permissions: [
      "LightingDesigner.Settings.*", "*",
    ],
    items: [
      {
        title: "Application Settings",
        path: "/settings/settings",
        roles: ["admin", "superadmin"],
        permissions: ["CIPP.AppSettings.*"],
      },
      {
        title: "Logbook",
        path: "/settings/logs",
        roles: ["editor", "admin", "superadmin"],
        permissions: ["CIPP.Core.*"],
      },
      {
        title: "Super Admin",
        roles: ["superadmin"],
        permissions: ["CIPP.SuperAdmin.*"],
        items: [
          {
            title: "Settings",
            path: "/settings/super-admin/user-roles",
            roles: ["superadmin"],
            permissions: ["CIPP.SuperAdmin.*"],
          },
          {
            title: "Timers",
            path: "/settings/super-admin/timers",
            roles: ["superadmin"],
            permissions: ["CIPP.SuperAdmin.*"],
          },
          {
            title: "Table Maintenance",
            path: "/settings/super-admin/table-maintenance",
            roles: ["superadmin"],
            permissions: ["CIPP.SuperAdmin.*"],
          },
          {
            title: "Onboarding",
            path: "/settings/super-admin/onboardingv2",
            roles: ["superadmin"],
            permissions: ["CIPP.SuperAdmin.*"],
          },
        ],
      },
    ],
  },
];