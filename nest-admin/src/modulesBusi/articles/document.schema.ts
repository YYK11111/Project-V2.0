export const DOCUMENT_SCHEMA_VERSION = 1;

export const DOCUMENT_READY_STATUS = "ready" as const;

export const DOCUMENT_LEGACY_STATUS = "legacy_html" as const;

export const DOCUMENT_ERROR_CODES = {
  contentRequired: "DOCUMENT_CONTENT_REQUIRED",
  invalidRoot: "DOCUMENT_INVALID_ROOT",
  invalidSchema: "DOCUMENT_INVALID_SCHEMA",
  unsupportedNode: "DOCUMENT_UNSUPPORTED_NODE",
  unsupportedMark: "DOCUMENT_UNSUPPORTED_MARK",
  legacyReadonly: "DOCUMENT_LEGACY_READONLY",
  invalidContent: "DOCUMENT_INVALID_CONTENT",
  schemaUnsupported: "DOCUMENT_SCHEMA_UNSUPPORTED",
} as const;

export const documentNodeWhitelist = {
  doc: {
    blockChildren: [
      "paragraph",
      "heading",
      "bulletList",
      "orderedList",
      "taskList",
      "blockquote",
      "codeBlock",
      "horizontalRule",
      "divider",
      "image",
      "attachment",
      "video",
      "table",
    ],
    allowText: false,
  },
  paragraph: {
    inlineChildren: ["text", "hardBreak"],
    allowText: false,
  },
  heading: {
    inlineChildren: ["text", "hardBreak"],
    allowText: false,
  },
  bulletList: {
    blockChildren: ["listItem"],
    allowText: false,
  },
  orderedList: {
    blockChildren: ["listItem"],
    allowText: false,
  },
  taskList: {
    blockChildren: ["taskItem"],
    allowText: false,
  },
  listItem: {
    blockChildren: ["paragraph", "bulletList", "orderedList", "taskList"],
    allowText: false,
  },
  taskItem: {
    blockChildren: ["paragraph", "bulletList", "orderedList", "taskList"],
    allowText: false,
  },
  blockquote: {
    blockChildren: [
      "paragraph",
      "heading",
      "bulletList",
      "orderedList",
      "taskList",
      "codeBlock",
    ],
    allowText: false,
  },
  codeBlock: {
    inlineChildren: ["text", "hardBreak"],
    allowText: false,
    allowedMarks: [],
  },
  horizontalRule: {
    allowText: false,
    allowContent: false,
  },
  divider: {
    allowText: false,
    allowContent: false,
  },
  image: {
    allowText: false,
    allowContent: false,
  },
  attachment: {
    allowText: false,
    allowContent: false,
  },
  video: {
    allowText: false,
    allowContent: false,
  },
  table: {
    blockChildren: ["tableRow"],
    allowText: false,
  },
  tableRow: {
    blockChildren: ["tableHeader", "tableCell"],
    allowText: false,
  },
  tableHeader: {
    blockChildren: ["paragraph", "bulletList", "orderedList", "taskList"],
    allowText: false,
  },
  tableCell: {
    blockChildren: ["paragraph", "bulletList", "orderedList", "taskList"],
    allowText: false,
  },
  text: {
    allowText: true,
    allowContent: false,
  },
  hardBreak: {
    allowText: false,
    allowContent: false,
  },
} as const;

export interface DocumentNodeRule {
  blockChildren?: readonly string[];
  inlineChildren?: readonly string[];
  allowText: boolean;
  allowContent?: boolean;
  allowedMarks?: readonly string[];
}

export const documentMarkWhitelist = [
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
] as const;

export type DocumentNodeType = keyof typeof documentNodeWhitelist;

export type DocumentMarkType = (typeof documentMarkWhitelist)[number];

export interface DocumentMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface DocumentNode {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: DocumentMark[];
  content?: DocumentNode[];
}

export interface DocumentRoot extends DocumentNode {
  type: "doc";
  content: DocumentNode[];
}
