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
    roles: ["superadmin"],
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
    roles: ["superadmin"],
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
    roles: ["superadmin"],
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
    roles: ["superadmin"],
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
    roles: ["superadmin"],
    permissions: ["LightingDesigner.Admin.Read*"],
    items: [
      {
        title: "Application Settings",
        path: "/settings/settings",
        roles: ["superadmin"],
        permissions: ["LightingDesigner.Admin.Read*"],
      },
      {
        title: "Logbook",
        path: "/settings/logs",
        roles: ["superadmin"],
        permissions: ["LightingDesigner.Admin.Read*"],
      },
      {
        title: "Super Admin",
        roles: ["superadmin"],
        permissions: ["LightingDesigner.SuperAdmin.ReadWrite"],
        items: [
          {
            title: "Settings",
            path: "/settings/super-admin/user-roles",
            roles: ["superadmin"],
            permissions: ["LightingDesigner.SuperAdmin.ReadWrite"],
          },
          {
            title: "Timers",
            path: "/settings/super-admin/timers",
            roles: ["superadmin"],
            permissions: ["LightingDesigner.SuperAdmin.ReadWrite"],
          },
          {
            title: "Table Maintenance",
            path: "/settings/super-admin/table-maintenance",
            roles: ["superadmin"],
            permissions: ["LightingDesigner.SuperAdmin.ReadWrite"],
          },
          {
            title: "Onboarding",
            path: "/settings/super-admin/onboardingv2",
            roles: ["superadmin"],
            permissions: ["LightingDesigner.SuperAdmin.ReadWrite"],
          },
        ],
      },
    ],
  },
];