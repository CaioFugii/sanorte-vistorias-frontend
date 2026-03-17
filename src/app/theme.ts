import { createTheme } from "@mui/material";

export const sanorteTokens = {
  color: {
    blueDark: "#0B1F5B",
    blueMain: "#1E4FAF",
    blueSupport: "#2F6FD6",
    limeAccent: "#9AD61F",
    white: "#FFFFFF",
    grayBg: "#F3F5F7",
    grayBorder: "#D9DEE5",
    textDark: "#1F2937",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  shadow: {
    card: "0 8px 24px rgba(11, 31, 91, 0.06)",
  },
};

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: sanorteTokens.color.blueMain,
      dark: sanorteTokens.color.blueDark,
      light: sanorteTokens.color.blueSupport,
      contrastText: sanorteTokens.color.white,
    },
    secondary: {
      main: sanorteTokens.color.blueSupport,
      contrastText: sanorteTokens.color.white,
    },
    success: {
      main: sanorteTokens.color.limeAccent,
      dark: "#7FAE18",
      contrastText: sanorteTokens.color.blueDark,
    },
    warning: {
      main: "#D28A1A",
    },
    error: {
      main: "#C13C3C",
    },
    background: {
      default: sanorteTokens.color.grayBg,
      paper: sanorteTokens.color.white,
    },
    text: {
      primary: sanorteTokens.color.textDark,
      secondary: "#4B5563",
    },
    divider: sanorteTokens.color.grayBorder,
  },
  shape: {
    borderRadius: sanorteTokens.radius.md,
  },
  typography: {
    fontFamily: '"Public Sans", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: sanorteTokens.color.grayBg,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: sanorteTokens.color.blueDark,
          boxShadow: "0 2px 10px rgba(11, 31, 91, 0.2)",
          borderBottom: `1px solid rgba(255, 255, 255, 0.08)`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: sanorteTokens.color.blueDark,
          color: sanorteTokens.color.white,
          borderRight: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: `1px solid ${sanorteTokens.color.grayBorder}`,
          boxShadow: sanorteTokens.shadow.card,
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: sanorteTokens.radius.sm,
          paddingInline: 16,
        },
        containedPrimary: {
          boxShadow: "0 6px 14px rgba(30, 79, 175, 0.22)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: sanorteTokens.color.white,
          borderRadius: sanorteTokens.radius.sm,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#F8FAFC",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: sanorteTokens.color.blueDark,
          borderBottom: `1px solid ${sanorteTokens.color.grayBorder}`,
        },
      },
    },
  },
});
