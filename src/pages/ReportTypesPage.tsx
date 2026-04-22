import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { Description } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReportType } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";

export const ReportTypesPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await appRepository.getReportTypes();
        setReportTypes(result.filter((reportType) => reportType.active));
      } catch {
        setError("Nao foi possivel carregar os tipos de relatorio.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Emissao de Relatorios
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Selecione um modelo de relatorio para preencher os campos dinamicos e gerar o PDF.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!error && reportTypes.length === 0 && <Alert severity="info">Nenhum tipo de relatorio disponivel.</Alert>}

      <Grid container spacing={2}>
        {reportTypes.map((reportType) => (
          <Grid item xs={12} md={6} lg={4} key={reportType.id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Description fontSize="small" />
                  <Typography variant="h6">{reportType.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Codigo: {reportType.code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {reportType.description || "Sem descricao para este modelo."}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/reports/new/${reportType.code}`)}
                  fullWidth
                >
                  Selecionar modelo
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
