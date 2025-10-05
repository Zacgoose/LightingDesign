import { 
  HomeIcon, 
  BriefcaseIcon,
  UsersIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon 
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
    //permissions: ["CIPP.Core.*"],
    permissions: ["Lighting.Designer.*"],
  },
  {
    title: "Jobs",
    path: "/jobs",
    icon: (
      <SvgIcon>
        <BriefcaseIcon />
      </SvgIcon>
    ),
    //permissions: ["CIPP.Core.*"],
    permissions: ["Lighting.Designer.Jobs.*"],
  },
  {
    title: "Customers",
    path: "/customers",
    icon: (
      <SvgIcon>
        <UsersIcon />
      </SvgIcon>
    ),
    //permissions: ["CIPP.Core.*"],
    permissions: ["Lighting.Designer.Customers.*"],
  },
  {
    title: "Reports",
    path: "/reports",
    icon: (
      <SvgIcon>
        <DocumentChartBarIcon />
      </SvgIcon>
    ),
    //permissions: ["CIPP.Core.*"],
    permissions: ["Lighting.Designer.Reports.*"],
  },
];