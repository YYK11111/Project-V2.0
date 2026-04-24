import { BadRequestException, ConflictException } from "@nestjs/common";
import {
  DOCUMENT_ERROR_CODES,
  DOCUMENT_SCHEMA_VERSION,
  DocumentMark,
  DocumentNode,
  DocumentNodeRule,
  DocumentNodeType,
  DocumentRoot,
  documentMarkWhitelist,
  documentNodeWhitelist,
} from "./document.schema";

const documentMarkSet = new Set<string>(documentMarkWhitelist);

const documentNodeSet = new Set<string>(Object.keys(documentNodeWhitelist));

interface ValidationContext {
  path: string;
}

function createDocumentException(
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return new BadRequestException({
    message,
    code,
    ...details,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNodeRule(nodeType: DocumentNodeType): DocumentNodeRule {
  return documentNodeWhitelist[nodeType] as DocumentNodeRule;
}

function isDocumentRoot(node: unknown): node is DocumentRoot {
  return isRecord(node) && node.type === "doc" && Array.isArray(node.content);
}

function validateMarks(
  node: DocumentNode,
  path: string,
  nodeType: DocumentNodeType,
) {
  if (node.marks === undefined) {
    return;
  }
  if (!Array.isArray(node.marks)) {
    throw createDocumentException(
      DOCUMENT_ERROR_CODES.invalidSchema,
      "文档 marks 结构非法",
      { path },
    );
  }

  const nodeSchema = getNodeRule(nodeType);
  const allowedMarks =
    nodeSchema.allowedMarks === undefined
      ? documentMarkSet
      : new Set<string>(nodeSchema.allowedMarks);

  node.marks.forEach((mark: DocumentMark, index) => {
    if (!isRecord(mark) || typeof mark.type !== "string") {
      throw createDocumentException(
        DOCUMENT_ERROR_CODES.invalidSchema,
        "文档 marks 结构非法",
        { path: `${path}.marks[${index}]` },
      );
    }

    if (!documentMarkSet.has(mark.type)) {
      throw createDocumentException(
        DOCUMENT_ERROR_CODES.unsupportedMark,
        `文档包含不支持的 mark 类型: ${mark.type}`,
        { path: `${path}.marks[${index}]`, markType: mark.type },
      );
    }

    if (!allowedMarks.has(mark.type)) {
      throw createDocumentException(
        DOCUMENT_ERROR_CODES.invalidSchema,
        `节点 ${node.type} 不允许使用 mark: ${mark.type}`,
        { path: `${path}.marks[${index}]`, markType: mark.type },
      );
    }
  });
}

function validateChildren(
  node: DocumentNode,
  path: string,
  nodeType: DocumentNodeType,
) {
  const nodeSchema = getNodeRule(nodeType);
  const hasContent = node.content !== undefined;

  if (hasContent && !Array.isArray(node.content)) {
    throw createDocumentException(
      DOCUMENT_ERROR_CODES.invalidSchema,
      "文档 content 结构非法",
      { path: `${path}.content` },
    );
  }

  if (nodeSchema.allowContent === false) {
    if (Array.isArray(node.content) && node.content.length > 0) {
      throw createDocumentException(
        DOCUMENT_ERROR_CODES.invalidSchema,
        `节点 ${node.type} 不允许包含子节点`,
        { path },
      );
    }
    return;
  }

  if (!Array.isArray(node.content)) {
    throw createDocumentException(
      DOCUMENT_ERROR_CODES.invalidContent,
      `节点 ${node.type} 缺少 content`,
      { path },
    );
  }

  if (node.content.length === 0 && node.type !== "doc") {
    throw createDocumentException(
      DOCUMENT_ERROR_CODES.invalidContent,
      `节点 ${node.type} 的 content 不能为空`,
      { path },
    );
  }

  const allowedChildren = new Set<string>([
    ...(nodeSchema.blockChildren || []),
    ...(nodeSchema.inlineChildren || []),
  ]);

  node.content.forEach((child, index) => {
    if (!isRecord(child) || typeof child.type !== "string") {
      throw createDocumentException(
        DOCUMENT_ERROR_CODES.invalidSchema,
        "文档子节点结构非法",
        { path: `${path}.content[${index}]` },
      );
    }

    if (!documentNodeSet.has(child.type)) {
      throw createDocumentException(
        DOCUMENT_ERROR_CODES.unsupportedNode,
        `文档包含不支持的节点类型: ${child.type}`,
        { path: `${path}.content[${index}]`, nodeType: child.type },
      );
    }

    if (!allowedChildren.has(child.type)) {
      throw createDocumentException(
        DOCUMENT_ERROR_CODES.invalidSchema,
        `节点 ${node.type} 不允许包含子节点类型: ${child.type}`,
        { path: `${path}.content[${index}]`, childType: child.type },
      );
    }

    validateDocumentNode(child, { path: `${path}.content[${index}]` });
  });
}

function validateText(
  node: DocumentNode,
  path: string,
  nodeType: DocumentNodeType,
) {
  const nodeSchema = getNodeRule(nodeType);
  if (nodeSchema.allowText) {
    if (typeof node.text !== "string") {
      throw createDocumentException(
        DOCUMENT_ERROR_CODES.invalidContent,
        `节点 ${node.type} 缺少 text`,
        { path },
      );
    }
    return;
  }

  if (node.text !== undefined) {
    throw createDocumentException(
      DOCUMENT_ERROR_CODES.invalidSchema,
      `节点 ${node.type} 不允许直接包含 text`,
      { path },
    );
  }
}

function validateDocumentNode(node: DocumentNode, context: ValidationContext) {
  if (!documentNodeSet.has(node.type)) {
    throw createDocumentException(
      DOCUMENT_ERROR_CODES.unsupportedNode,
      `文档包含不支持的节点类型: ${node.type}`,
      { path: context.path, nodeType: node.type },
    );
  }

  const nodeType = node.type as DocumentNodeType;
  validateText(node, context.path, nodeType);
  validateMarks(node, context.path, nodeType);
  validateChildren(node, context.path, nodeType);
}

export function validateDocumentSchemaVersion(contentVersion?: number | null) {
  if (contentVersion === undefined || contentVersion === null) {
    return;
  }
  if (Number(contentVersion) !== DOCUMENT_SCHEMA_VERSION) {
    throw createDocumentException(
      DOCUMENT_ERROR_CODES.schemaUnsupported,
      `当前仅支持文档 schema 版本 ${DOCUMENT_SCHEMA_VERSION}`,
      { contentVersion },
    );
  }
}

export function ensureDocumentEditable(contentStatus?: string | null) {
  if (!contentStatus || contentStatus === "ready") {
    return;
  }
  throw new ConflictException({
    message: "当前文档仍为旧版只读状态，禁止直接更新",
    code: DOCUMENT_ERROR_CODES.legacyReadonly,
    contentStatus,
  });
}

export function validateDocumentJson(
  contentJson: Record<string, unknown> | null | undefined,
): DocumentRoot {
  if (!contentJson) {
    throw createDocumentException(
      DOCUMENT_ERROR_CODES.contentRequired,
      "contentJson 不能为空",
    );
  }

  if (!isRecord(contentJson)) {
    throw createDocumentException(
      DOCUMENT_ERROR_CODES.invalidSchema,
      "contentJson 必须为对象",
    );
  }

  if (contentJson.type !== "doc") {
    throw createDocumentException(
      DOCUMENT_ERROR_CODES.invalidRoot,
      "文档根节点必须为 doc",
      { nodeType: contentJson.type },
    );
  }

  if (!isDocumentRoot(contentJson)) {
    throw createDocumentException(
      DOCUMENT_ERROR_CODES.invalidRoot,
      "文档根节点必须包含 content 数组",
      { nodeType: contentJson.type },
    );
  }

  validateDocumentNode(contentJson, { path: "root" });
  return contentJson;
}
