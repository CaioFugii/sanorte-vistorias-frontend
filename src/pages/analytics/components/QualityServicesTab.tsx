import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { CurrentMonthByServiceData, QualityByServiceData } from "./models";

const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};

type QualityServicesTabProps = {
  qualityByService: QualityByServiceData;
  currentMonthByService: CurrentMonthByServiceData;
  currentMonthLabel: string;
};

export function QualityServicesTab({
  qualityByService,
  currentMonthByService,
  currentMonthLabel,
}: QualityServicesTabProps): JSX.Element {
  const currentMonthBarMax = Math.max(...(currentMonthByService.services.map((item) => item.qualityPercent) || [0]), 100);

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Paper sx={{ p: 0, height: "100%", overflow: "hidden" }}>
        <Box sx={CHART_HEADER_SX}>
          <Typography variant="subtitle1" fontWeight={800}>
            Desempenho Mensal por Serviço
          </Typography>
          <Typography variant="subtitle2" fontWeight={700}>
            {currentMonthLabel}
          </Typography>
        </Box>

        <Box sx={{ px: 1.5, py: 1.5, bgcolor: "#f7f8fa" }}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Box
              sx={{
                width: 132,
                bgcolor: "#001970",
                color: "#fff",
                borderRadius: 1,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <Box sx={{ px: 1.2, py: 1.25, borderBottom: "1px dashed rgba(255,255,255,0.35)" }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Média Geral
                </Typography>
                <Typography variant="h5" fontWeight={900}>
                  {currentMonthByService.summary.averagePercent.toFixed(1).replace(".", ",")}%
                </Typography>
              </Box>
              <Box sx={{ px: 1.2, py: 1.25, borderBottom: "1px dashed rgba(255,255,255,0.35)" }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Serviços Avaliados
                </Typography>
                <Typography variant="h5" fontWeight={900}>
                  {currentMonthByService.summary.inspectionsCount.toLocaleString("pt-BR")}
                </Typography>
              </Box>
              <Box sx={{ px: 1.2, py: 1.25 }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Pendentes de Ajuste
                </Typography>
                <Typography variant="h5" fontWeight={900}>
                  {currentMonthByService.summary.pendingAdjustmentsCount.toLocaleString("pt-BR")}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ height: 248, display: "flex", alignItems: "flex-end", gap: 1.1 }}>
                {currentMonthByService.services.map((item) => (
                  <Box key={item.serviceKey} sx={{ flex: 1, minWidth: 56 }}>
                    <Box sx={{ height: 210, display: "flex", alignItems: "flex-end" }}>
                      <Box
                        sx={{
                          width: "100%",
                          height: `${(item.qualityPercent / currentMonthBarMax) * 100}%`,
                          bgcolor: "#0b158a",
                          borderRadius: "4px 4px 0 0",
                          position: "relative",
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          sx={{
                            position: "absolute",
                            top: -20,
                            left: "50%",
                            transform: "translateX(-50%)",
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.qualityPercent.toFixed(1).replace(".", ",")}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      display="block"
                      align="center"
                      fontWeight={800}
                      sx={{ mt: 0.5, lineHeight: 1.1 }}
                    >
                      {item.serviceLabel}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={CHART_HEADER_SX}>
          <Typography variant="h6" fontWeight={800}>
            Serviços
          </Typography>
          <Typography variant="subtitle2" fontWeight={700}>
            {currentMonthLabel}
          </Typography>
        </Box>

        <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Serviço</TableCell>
                <TableCell align="center">Qualidade atual</TableCell>
                <TableCell align="center">Qtd vistorias</TableCell>
                <TableCell align="center">Crescimento</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentMonthByService.services.map((service) => {
                const growthData = qualityByService.services.find(
                  (qualityItem) => qualityItem.serviceKey === service.serviceKey
                )?.growth;
                return (
                  <TableRow key={service.serviceKey}>
                    <TableCell>{service.serviceLabel}</TableCell>
                    <TableCell align="center">{service.qualityPercent.toFixed(1).replace(".", ",")}%</TableCell>
                    <TableCell align="center">{service.inspectionsCount.toLocaleString("pt-BR")}</TableCell>
                    <TableCell align="center">
                      {growthData
                        ? `${growthData.growthPercent >= 0 ? "+" : ""}${growthData.growthPercent
                            .toFixed(2)
                            .replace(".", ",")}%`
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
}
