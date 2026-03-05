import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function downloadInvoicePDF(invoiceElement: HTMLDivElement, invoiceNo: string) {
  const canvas = await html2canvas(invoiceElement, {
    backgroundColor: "#ffffff",
    scale: 2,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
  heightLeft -= pdf.internal.pageSize.getHeight();

  while (heightLeft > 0) {
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, -heightLeft, pageWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();
  }

  pdf.save(`${invoiceNo}.pdf`);
}
