import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { format } from "date-fns";

export interface DocumentSection {
  heading?: string;
  content: string | string[];
  level?: typeof HeadingLevel[keyof typeof HeadingLevel];
}

export interface DocumentMetadata {
  title: string;
  version: string;
  projectName: string;
  artefactName: string;
  date: Date;
}

export class DocumentGenerator {
  static async generateDocument(
    metadata: DocumentMetadata,
    sections: DocumentSection[]
  ): Promise<Blob> {
    const children: Paragraph[] = [];

    // Title page
    children.push(
      new Paragraph({
        text: metadata.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Version: ${metadata.version}`,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Date: ${format(metadata.date, "dd MMMM yyyy")}`,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Project: ${metadata.projectName}`,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({ text: "" }) // Page break simulation
    );

    // Content sections
    sections.forEach((section) => {
      if (section.heading) {
        children.push(
          new Paragraph({
            text: section.heading,
            heading: section.level || HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );
      }

      if (Array.isArray(section.content)) {
        section.content.forEach((text) => {
          children.push(
            new Paragraph({
              text,
              spacing: { after: 200 },
            })
          );
        });
      } else {
        children.push(
          new Paragraph({
            text: section.content,
            spacing: { after: 200 },
          })
        );
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    return await Packer.toBlob(doc);
  }

  static generateFileName(
    projectName: string,
    artefactName: string,
    date: Date = new Date()
  ): string {
    const formattedDate = format(date, "yyyy-MM-dd");
    const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9]/g, "-");
    const sanitizedArtefactName = artefactName.replace(/[^a-zA-Z0-9]/g, "-");
    return `${formattedDate}-${sanitizedProjectName}-${sanitizedArtefactName}-O.docx`;
  }

  static downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
