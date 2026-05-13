import type { VocalData, PlainTextMergeNode, XmlMergeNode } from '../types';

export function createPlainTextLeaf(text: string): PlainTextMergeNode {
  return { text, children: null };
}

export function createXmlLeaf(vocal: VocalData): XmlMergeNode {
  return { vocal, children: null };
}

export function createPlainTextLeafArray(syllables: string[]): PlainTextMergeNode[] {
  return syllables.map(createPlainTextLeaf);
}

export function createXmlLeafArray(vocals: VocalData[]): XmlMergeNode[] {
  return vocals.map(createXmlLeaf);
}

export function mergePlainTextNodes(
  first: PlainTextMergeNode,
  second: PlainTextMergeNode,
  mergedText: string
): PlainTextMergeNode {
  return { text: mergedText, children: [first, second] };
}

export function mergeXmlNodes(
  first: XmlMergeNode,
  second: XmlMergeNode,
  mergedVocal: VocalData
): XmlMergeNode {
  return { vocal: mergedVocal, children: [first, second] };
}

export function expandXmlToLeaves(node: XmlMergeNode): XmlMergeNode[] {
  if (!node.children) {
    return [node];
  }
  return [
    ...expandXmlToLeaves(node.children[0]),
    ...expandXmlToLeaves(node.children[1])
  ];
}

export function canSplitPlainTextNode(node: PlainTextMergeNode): boolean {
  return node.children !== null;
}

export function canSplitXmlNode(node: XmlMergeNode): boolean {
  return node.children !== null;
}
