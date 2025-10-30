export const formatDurationHrs = (mins?: number) =>
  typeof mins === "number" && mins >= 0
    ? mins / 60 >= 1
      ? `${(Math.round(mins / 30) / 2).toFixed(1)} Hours`
      : `${mins} Minutes`
    : "—";

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : "—";

export const asHyphen = (v?: string | number | null) =>
  v == null || v === "" ? "—" : String(v);

export const formatLevel = (level?: string) => {
  switch (level) {
    case "beginner":
      return "Beginner";
    case "intermediate":
      return "Intermediate";
    case "advanced":
      return "Advanced";
    case "expert":
      return "Expert";
    default:
      return "—";
  }
};

export const getAssetIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return "fa-file-pdf";
    case "video":
      return "fa-play";
    case "image":
      return "fa-image";
    case "link":
      return "fa-link";
    default:
      return "fa-file";
  }
};

export const getAssetTypeLabel = (type: string) => {
  switch (type) {
    case "pdf":
      return "PDF";
    case "video":
      return "Video";
    case "image":
      return "Image";
    case "link":
      return "Link";
    default:
      return "File";
  }
};
