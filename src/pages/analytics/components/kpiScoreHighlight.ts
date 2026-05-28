export type ScoreHighlight = {
  textColor: string;
  borderColor: string;
  backgroundColor: string;
};

export function getKpiScoreHighlight(percent: number): ScoreHighlight {
  if (percent > 80) {
    return {
      textColor: "#2e7d32",
      borderColor: "#a5d6a7",
      backgroundColor: "#f1f8e9",
    };
  }

  if (percent > 60 && percent < 80) {
    return {
      textColor: "#ed6c02",
      borderColor: "#ffcc80",
      backgroundColor: "#fff8e1",
    };
  }

  return {
    textColor: "#d32f2f",
    borderColor: "#ef9a9a",
    backgroundColor: "#ffebee",
  };
}
