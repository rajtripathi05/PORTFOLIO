import { portfolio } from "~/data/portfolio";

export const RESUME_FILE_NAME = "Raj_Tripathi_Resume.pdf";

/** Downloads a file without leaving the page. */
export const downloadFile = (href: string, fileName: string): void => {
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const downloadResume = (): void => downloadFile(portfolio.identity.resumePdf, RESUME_FILE_NAME);
