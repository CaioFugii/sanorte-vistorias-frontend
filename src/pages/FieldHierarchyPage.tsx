import { Box, Tab, Tabs } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui";
import { CoordinatorsPage } from "@/pages/CoordinatorsPage";
import { FieldSupervisorsPage } from "@/pages/FieldSupervisorsPage";
import { ForemenPage } from "@/pages/ForemenPage";

const TABS = [
  { id: "coordenadores", label: "Coordenadores" },
  { id: "supervisores", label: "Supervisores" },
  { id: "encarregados", label: "Encarregados" },
] as const;

type HierarchyTab = (typeof TABS)[number]["id"];

function parseTab(value: string | null): HierarchyTab {
  return TABS.some((tab) => tab.id === value) ? (value as HierarchyTab) : "coordenadores";
}

export const FieldHierarchyPage = (): JSX.Element => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const selectTab = (next: HierarchyTab) => {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next === "coordenadores") params.delete("tab");
        else params.set("tab", next);
        return params;
      },
      { replace: true }
    );
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Administração"
        title="Hierarquia de campo"
        subtitle="Cadastro de coordenadores, supervisores e encarregados. Este cadastro não cria usuário nem senha."
      />
      <Tabs
        value={tab}
        onChange={(_, value: HierarchyTab) => selectTab(value)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        {TABS.map((item) => (
          <Tab key={item.id} value={item.id} label={item.label} />
        ))}
      </Tabs>
      {tab === "coordenadores" && <CoordinatorsPage embedded />}
      {tab === "supervisores" && <FieldSupervisorsPage embedded />}
      {tab === "encarregados" && <ForemenPage embedded />}
    </Box>
  );
};
