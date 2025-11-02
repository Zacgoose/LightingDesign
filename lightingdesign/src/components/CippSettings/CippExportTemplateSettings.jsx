import { useState } from "react";
import {
  Button,
  Typography,
  Box,
  FormControl,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Slider,
  Divider,
  Alert,
} from "@mui/material";
import { Save, RestartAlt } from "@mui/icons-material";
import CippButtonCard from "/src/components/CippCards/CippButtonCard";
import { useSettings } from "/src/hooks/use-settings";
import CippFormComponent from "../CippComponents/CippFormComponent";
import { useForm } from "react-hook-form";

const JOB_INFO_FIELDS = [
  { value: "jobNumber", label: "Job Number" },
  { value: "customerName", label: "Customer Name" },
  { value: "address", label: "Address" },
  { value: "floorName", label: "Floor Name" },
  { value: "date", label: "Date" },
  { value: "pageNumber", label: "Page Number" },
];

const LOGO_POSITIONS = [
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
];

const JOB_INFO_POSITIONS = [
  { value: "title-block", label: "Title Block (Full Width)" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

const CippExportTemplateSettings = () => {
  const settings = useSettings();
  const defaultTemplate = settings?.exportTemplate || {};

  const [selectedFields, setSelectedFields] = useState(
    defaultTemplate.jobInfoFields || ["jobNumber", "customerName", "address", "floorName", "date"]
  );

  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      showLogo: defaultTemplate.showLogo ?? true,
      logoPosition: defaultTemplate.logoPosition || "top-left",
      logoSize: defaultTemplate.logoSize || 60,
      showJobInfo: defaultTemplate.showJobInfo ?? true,
      jobInfoPosition: defaultTemplate.jobInfoPosition || "title-block",
      showPageNumbers: defaultTemplate.showPageNumbers ?? true,
      titleBlockHeight: defaultTemplate.titleBlockHeight || 40,
      titleBlockColor: defaultTemplate.titleBlockColor || "#F0F0F0",
    },
  });

  const handleFieldToggle = (fieldValue) => {
    setSelectedFields((prev) => {
      if (prev.includes(fieldValue)) {
        return prev.filter((f) => f !== fieldValue);
      } else {
        return [...prev, fieldValue];
      }
    });
  };

  const handleSave = () => {
    const formData = formControl.getValues();
    const templateData = {
      ...formData,
      jobInfoFields: selectedFields,
    };

    // Update local settings
    settings.handleUpdate({
      exportTemplate: templateData,
    });
  };

  const handleReset = () => {
    const defaultSettings = {
      showLogo: true,
      logoPosition: "top-left",
      logoSize: 60,
      showJobInfo: true,
      jobInfoPosition: "title-block",
      showPageNumbers: true,
      titleBlockHeight: 40,
      titleBlockColor: "#F0F0F0",
    };

    formControl.reset(defaultSettings);
    setSelectedFields(["jobNumber", "customerName", "address", "floorName", "date"]);

    settings.handleUpdate({
      exportTemplate: {
        ...defaultSettings,
        jobInfoFields: ["jobNumber", "customerName", "address", "floorName", "date"],
      },
    });
  };

  return (
    <CippButtonCard
      title="Export Template Settings"
      cardSx={{ display: "flex", flexDirection: "column" }}
      CardButton={
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" size="small" onClick={handleSave} startIcon={<Save />}>
            Save Template
          </Button>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RestartAlt />}>
            Reset
          </Button>
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Customize the layout and content of exported PDF designs. Configure logo placement, job
          information fields, and title block appearance.
        </Typography>

        <Alert severity="info">
          These settings will be applied to all design exports. Make sure to upload a logo in the
          Branding Settings if you want it to appear on exports.
        </Alert>

        {/* Logo Settings */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Logo Settings
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={formControl.watch("showLogo")}
                onChange={(e) => formControl.setValue("showLogo", e.target.checked)}
              />
            }
            label="Show logo on exports"
          />

          {formControl.watch("showLogo") && (
            <Box sx={{ ml: 4, mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Logo Position
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={formControl.watch("logoPosition")}
                  onChange={(e) => formControl.setValue("logoPosition", e.target.value)}
                >
                  {LOGO_POSITIONS.map((pos) => (
                    <FormControlLabel
                      key={pos.value}
                      value={pos.value}
                      control={<Radio size="small" />}
                      label={pos.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Logo Size: {formControl.watch("logoSize")}pt
                </Typography>
                <Slider
                  value={formControl.watch("logoSize")}
                  onChange={(e, value) => formControl.setValue("logoSize", value)}
                  min={30}
                  max={120}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Job Information Settings */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Job Information
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={formControl.watch("showJobInfo")}
                onChange={(e) => formControl.setValue("showJobInfo", e.target.checked)}
              />
            }
            label="Show job information on exports"
          />

          {formControl.watch("showJobInfo") && (
            <Box sx={{ ml: 4, mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Information Position
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={formControl.watch("jobInfoPosition")}
                  onChange={(e) => formControl.setValue("jobInfoPosition", e.target.value)}
                >
                  {JOB_INFO_POSITIONS.map((pos) => (
                    <FormControlLabel
                      key={pos.value}
                      value={pos.value}
                      control={<Radio size="small" />}
                      label={pos.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Fields to Display
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {JOB_INFO_FIELDS.map((field) => (
                    <FormControlLabel
                      key={field.value}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedFields.includes(field.value)}
                          onChange={() => handleFieldToggle(field.value)}
                        />
                      }
                      label={field.label}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Title Block Settings */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Title Block Appearance
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={formControl.watch("showPageNumbers")}
                onChange={(e) => formControl.setValue("showPageNumbers", e.target.checked)}
              />
            }
            label="Show page numbers"
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Title Block Height: {formControl.watch("titleBlockHeight")}mm
            </Typography>
            <Slider
              value={formControl.watch("titleBlockHeight")}
              onChange={(e, value) => formControl.setValue("titleBlockHeight", value)}
              min={30}
              max={80}
              step={5}
              marks
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Title Block Background Color
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <input
                type="color"
                value={formControl.watch("titleBlockColor") || "#F0F0F0"}
                onChange={(e) => formControl.setValue("titleBlockColor", e.target.value)}
                style={{
                  width: "50px",
                  height: "40px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              />
              <CippFormComponent
                type="textField"
                name="titleBlockColor"
                formControl={formControl}
                label="Hex Color"
                sx={{ width: "120px" }}
                validators={{
                  pattern: {
                    value: /^#[0-9A-F]{6}$/i,
                    message: "Please enter a valid hex color (e.g., #F0F0F0)",
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Preview Section */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
            Preview
          </Typography>
          <Box
            sx={{
              p: 2,
              border: "1px solid #ddd",
              borderRadius: 1,
              backgroundColor: formControl.watch("titleBlockColor") || "#F0F0F0",
              position: "relative",
              minHeight: "120px",
            }}
          >
            {formControl.watch("showLogo") && settings?.customBranding?.logo && (
              <Box
                sx={{
                  position: "absolute",
                  ...(formControl.watch("logoPosition") === "top-left" && { top: 8, left: 8 }),
                  ...(formControl.watch("logoPosition") === "top-center" && { top: 8, left: "50%", transform: "translateX(-50%)" }),
                  ...(formControl.watch("logoPosition") === "top-right" && { top: 8, right: 8 }),
                  ...(formControl.watch("logoPosition") === "bottom-left" && { bottom: 8, left: 8 }),
                  ...(formControl.watch("logoPosition") === "bottom-center" && { bottom: 8, left: "50%", transform: "translateX(-50%)" }),
                  ...(formControl.watch("logoPosition") === "bottom-right" && { bottom: 8, right: 8 }),
                }}
              >
                <img
                  src={settings.customBranding.logo}
                  alt="Logo"
                  style={{
                    height: `${formControl.watch("logoSize") / 2}px`,
                    objectFit: "contain",
                  }}
                />
              </Box>
            )}

            {formControl.watch("showJobInfo") && (
              <Box 
                sx={{ 
                  mt: formControl.watch("showLogo") && formControl.watch("logoPosition").startsWith("top") ? 8 : 0,
                  position: formControl.watch("jobInfoPosition") === "title-block" ? "static" : "absolute",
                  ...(formControl.watch("jobInfoPosition") === "top-right" && { top: 8, right: 8 }),
                  ...(formControl.watch("jobInfoPosition") === "bottom-left" && { bottom: 8, left: 8 }),
                  ...(formControl.watch("jobInfoPosition") === "bottom-right" && { bottom: 8, right: 8 }),
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  Lighting Design Export
                </Typography>
                {selectedFields.map((field) => {
                  const fieldData = JOB_INFO_FIELDS.find((f) => f.value === field);
                  return (
                    <Typography key={field} variant="caption" display="block">
                      {fieldData?.label}: [Sample Data]
                    </Typography>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </CippButtonCard>
  );
};

export default CippExportTemplateSettings;
