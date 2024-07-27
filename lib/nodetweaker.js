/**
 * Fix the group typed node. Remove "h" and "w" properties creating git conflicts.
 * @param {node} node 
 * @returns {node} node
 */
function fixGroupNode(node) {
  const clone = JSON.parse(JSON.stringify(node));
  if (node.type && node.type === "group") {
    if (node.w) {
      delete clone.w
    }
    if (node.h) {
      delete clone.h
    }
  }
  return clone
}

module.exports.fixGroupNode = fixGroupNode;
