const tweaker = require("./nodetweaker");
const { logger } = require('./logger');

/**
 * Transform the node name (string) to valid filename (string).
 * @param {string} nodeName name of the node (flow, subflow or config) to normalize
 * @return {string} normalized node name
 */
function normalizeNodeFileName(nodeName) {
  let normalized = nodeName.replace(/[^a-zA-Z0-9\.]/g, '-').replace(/----/g, '-').replace(/---/g, '-').replace(/--/g, '-').replace(/--/g, '-').toLowerCase();
  if (normalized[0] === '-') {
    normalized = normalized.substring(1, normalized.length)
  }
  if (normalized[normalized.length - 1] === '-') {
    normalized = normalized.substring(0, normalized.length - 1)
  }
  return normalized
}


/**
 * Transform a flows.json to return an object dictionary splitting nodes from tabs, subflows, config-nodes
 * @param {object} source flows to split (should be an object array of objects)
 * @return {object} dictionary giving all tabs, subflows and config-nodes
 */
function splitFlows(source) {
  resultDict = {
    'config-nodes': [],
    'tabs': [],
    'subflows': []
  };
  baseNodes = [];

  // Get all level-1 node elements = tabs, subflows class and config-nodes
  source.forEach(element => {
    if (element && element.type === "tab") {
      resultDict.tabs.push({
        id: element.id,
        name: element.label,
        normalizedName: normalizeNodeFileName(element.label),
        content: [element]
      })
    }
    else if (element.type && element.type === "subflow") {
      var subflowTemplateName = element.name ? element.name : (element.category ? `${element.category}-${element.id}` : element.id);
      resultDict.subflows.push({
        id: element.id,
        name: subflowTemplateName,
        normalizedName: normalizeNodeFileName(subflowTemplateName),
        content: [element]
      })
    }
    else if (!('z' in element)) {
      var configNodeName = element.name ? element.name : (element.type ? `${element.type}-${element.id}` : element.id);
      resultDict['config-nodes'].push({
        id: element.id,
        name: element.name ? element.name : element.id,
        normalizedName: normalizeNodeFileName(configNodeName),
        content: [element]
      })
    }
    else {
      baseNodes.push(tweaker.fixGroupNode(element));
    }
  });

  // Disambiguate tabs, subflows and config-nodes that have the same name (to avoid future file overwrite)
  resultDict.tabs = transformDuplicates(resultDict.tabs);
  resultDict.subflows = transformDuplicates(resultDict.subflows);
  resultDict['config-nodes'] = transformDuplicates(resultDict['config-nodes']);

  // Loop through each remaining base node to attach it to a subflow or a tab content
  baseNodes.forEach(element => {
    if ('z' in element) {
      for (var key in resultDict) {
        resultDict[key].forEach(node => {
          if (node.id === element.z) {
            node.content.push(element)
          }
        });
      }
    }
    else {
      logger.error(`Element ${element.id} is neither a tab, neither a subflow class, neither a config-node and does not have any 'z' attribute`)
    }
  });

  // Order all content of each resultDict child with the node id (if it's not the child id itself)
  resultDict.tabs = orderNodes(resultDict.tabs);
  resultDict.subflows = orderNodes(resultDict.subflows);
  resultDict['config-nodes'] = orderNodes(resultDict['config-nodes']);

  return resultDict;
}

/**
 * Transforms a ambiguated array of nodes by transforming the duplicates keys : name and normalizedName.
 * @param {object} resultDictChild 
 * @returns {resultDictChild} disambiguated and deep copied resultDictChild
 */
function transformDuplicates(resultDictChild) {
  arrClone = JSON.parse(JSON.stringify(resultDictChild));
  const nameCount = {};

  // First loop to count occurrences of each name
  arrClone.forEach(node => {
    nameCount[node.name] = (nameCount[node.name] || 0) + 1;
  });

  // Second loop to transform the name of duplicates
  return arrClone.map(node => {
    if (nameCount[node.name] > 1) {
      return {
        ...node,
        name: `${node.name}-${node.id}`,
        normalizedName: normalizeNodeFileName(`${node.name}-${node.id}`)
      };
    }
    return node;
  });
}

/**
 * Elementary function to compare the id properties of 2 objects a and b
 * @param {object} a node object with 'id' property
 * @param {object} b node object with 'id' property
 * @returns {number}
 */
function compare(a, b) {
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  }
  return 0;
}

/**
 * Elementary function to move an element inside an array from its 'oldIndex' to the 'newIndex'
 * @param {*} arr 
 * @param {*} oldIndex 
 * @param {*} newIndex 
 * @returns arr
 */
function arrayMove(arr, oldIndex, newIndex) {
  if (newIndex >= arr.length) {
    var k = newIndex - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
  return arr;
};

/**
 * Order the content of a resultDict child unsign elementary functions
 * @param {ResultDictChild} resultDictChild 
 * @returns {ResultDictChild} resultDictChild with ordered content
 */
function orderNodes(resultDictChild) {
  arrClone = JSON.parse(JSON.stringify(resultDictChild));
  arrClone.forEach(child => {
    if (child.content && child.content.length > 0) {
      child.content.sort(compare);
      mainIndex = child.content.map(e => e.id).indexOf(child.id);
      child.content = arrayMove(child.content, mainIndex, 0);
    }
  });
  return arrClone;
}

/**
 * Returns an array of all tab Ids in the correct display order.
 * @param {object} source flows to split (should be an object array of objects)
 * @returns {object} ordered tab.id array
 */
function getTabsOrder(source) {
  tabOrderById = [];
  for (let i = 0; i < source.length; i++) {
    const element = source[i];
    if (element && element.id && element.type === "tab") {
      tabOrderById.push(element.id)
    }
  }
  return tabOrderById;
}


module.exports = {
  normalizeNodeFileName,
  splitFlows,
  getTabsOrder,
};
