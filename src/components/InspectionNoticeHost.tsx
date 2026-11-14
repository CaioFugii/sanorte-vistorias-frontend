import { Badge, IconButton, List, ListItemButton, ListItemText, Popover, Snackbar, Typography } from "@mui/material";
import { Notifications } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { InspectionNotice } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { openInspectionNoticeStream } from "@/api/inspectionNoticeStream";
import { useAuthStore } from "@/stores/authStore";
import { router } from "@/app/router";

export function InspectionNoticeHost(): JSX.Element | null {
  const user = useAuthStore((state) => state.user);
  const [notices, setNotices] = useState<InspectionNotice[]>([]);
  const [liveNotice, setLiveNotice] = useState<InspectionNotice | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!user) {
      setNotices([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const loadUnread = async () => {
      try {
        const unread = await appRepository.listInspectionNotices();
        if (!cancelled) setNotices(unread);
      } catch {
        if (!cancelled) setNotices([]);
      }
    };

    const connect = async () => {
      while (!cancelled) {
        try {
          await openInspectionNoticeStream((notice) => {
            if (cancelled) return;
            setNotices((current) =>
              current.some((item) => item.id === notice.id) ? current : [notice, ...current],
            );
            setLiveNotice(notice);
          }, controller.signal);
        } catch {
          // reconecta abaixo, salvo quando o efeito desmonta
        }
        if (cancelled || controller.signal.aborted) return;
        await new Promise<void>((resolve) => {
          retryTimer = setTimeout(resolve, 3000);
        });
      }
    };

    void loadUnread();
    void connect();

    return () => {
      cancelled = true;
      controller.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [user]);

  if (!user) return null;

  const openNotice = async (notice: InspectionNotice) => {
    setAnchorEl(null);
    setLiveNotice(null);
    setNotices((current) => current.filter((item) => item.id !== notice.id));
    try {
      await appRepository.markInspectionNoticeRead(notice.id);
    } catch {
      // a lista local já escondeu o aviso; a próxima carga restaura se a API falhar
    }
    void router.navigate(`/inspections/${notice.inspectionId}`);
  };

  return (
    <>
      <IconButton
        color="inherit"
        aria-label="Avisos de pendência"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ color: "#fff" }}
      >
        <Badge badgeContent={notices.length} color="error">
          <Notifications />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <List sx={{ width: 360, maxWidth: "90vw", py: 0 }}>
          {notices.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              Nenhum aviso de pendência.
            </Typography>
          ) : (
            notices.map((notice) => (
              <ListItemButton key={notice.id} onClick={() => void openNotice(notice)}>
                <ListItemText
                  primary={notice.message}
                  secondary={new Date(notice.createdAt).toLocaleString("pt-BR")}
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Popover>
      <Snackbar
        open={Boolean(liveNotice)}
        autoHideDuration={6000}
        onClose={() => setLiveNotice(null)}
        message={liveNotice?.message ?? ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
    </>
  );
}
