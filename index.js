module.exports = function (RED) {
  const path = require('path');
  const axios = require('axios');
  const setup = require('./lib/setup');
  const crafter = require('./lib/crafter');
  const filemaker = require('./lib/filemaker');
  const { logger } = require('./lib/logger');

  const CFG_FILENAME = '.config.flow-splitter.json';
  const DEFAULT_CFG = {
    fileFormat: 'yaml',
    destinationFolder: 'src',
    tabsOrder: [],
  };

  // Code to launch on every restart of the flows = boot or deploy event
  RED.events.on('flows:started', async function () {
    onReload();
  });

  /**
   * Main function. To be executed on each flow restart
   * @returns {undefined}
   */
  function onReload() {

    // Project data and hostname + port from settings
    const hostname = RED.settings.uiHost || 'localhost';
    const port = RED.settings.uiPort || 1880;
    const project = setup.getProject(RED.settings);
    if (project.isProject && !project.path) {
      logger.error("Cannot find path of flows.json")
      return
    }

    // Retrieve active flows.json or src
    const projectFlows = setup.getFlowFile(project)
    if (!projectFlows.fileContent) {

      // 1. Case where only src files were committed or flows.json has been deleted
      logger.info("JSON flow file from package does not exist. Rebuilding from sources.")

      // Return config file : .config.flow-splitter.json
      cfg = setup.getCfgFile(project.path, CFG_FILENAME);
      if (!cfg) {
        logger.error(`Can not create flow file from source files, missing mandatory config file '${CFG_FILENAME}'`)
        return
      }

      // Generate a concatenated 'flowFileObj' Array Object from src
      if (!projectFlows.fileName) {
        logger.error(`Missing flow filename from package.json`)
        return
      }
      flowFileObj = filemaker.rebuildFlowsJson(project.path, cfg)
      if (!(typeof flowFileObj == "object") || Object.prototype.toString.call(flowFileObj) !== '[object Array]' || flowFileObj.length == 0) {
        logger.warn(`Flow file is undefined or empty`)
      }

      // Create the flows.json file in project directory from 'flowFileObj'
      if (!filemaker.makeFlowsJson(flowFileObj, project.path, projectFlows.fileName)) {
        logger.error(`Failed rebuilding flow JSON file '${projectFlows.fileName}'`)
        return
      }
      logger.info(`Flow file '${projectFlows.fileName}' has been rebuilt correctly from sources for '${project.activeProjectName}'`)

      // Push newly created flows.json to RED API
      logger.info('Pushing flows to RED API...')
      const baseUrl = `http://${hostname}:${port}`;
      logger.debug(`baseUrl = ${baseUrl}`);
      axios.post(`${baseUrl}/flows`, flowFileObj).then(response => {
        logger.info('Flows updated successfully in Node-RED.');
      }).catch(error => {
        if (error.response && typeof error.response.data == "object") {
          errorMessage = JSON.stringify(error.response.data);
        } else {
          errorMessage = error.response.data;
        }
        logger.critical(`Error updating flows: ${error.message} : ${error.response ? `${error.response.status} - ${errorMessage}` : 'undefined'}`);
      });

    } else {
      // 2. Case where flows.json exists (on deploy)
      logger.info("Splitting JSON flow file...");

      // Return config file : .config.flow-splitter.json
      cfg = setup.getCfgFile(project.path, CFG_FILENAME);
      if (!cfg) {
        logger.info(`Config file '${CFG_FILENAME}' does not exist. Splitting flows with default parameters and creating the config file.`)
        cfg = DEFAULT_CFG;
      }

      // Clean the src folder to recreate all the files
      if (!filemaker.clearSrcFolder(path.join(project.path, cfg.destinationFolder))) {
        logger.warn(`Failed to clean folder '${path.join(project.path, cfg.destinationFolder)}'`)
      }

      // Recreate folder tree
      if (!setup.ensureFolderTree(project.path, cfg.destinationFolder)) {
        logger.error('Could not construct the source directory.')
        return
      }

      // Craft the individual flows into a flowSet Object
      const splitProjectFlowSet = crafter.splitFlows(projectFlows.fileContent);

      // Retrieve the position of each tab
      const tabsOrder = crafter.getTabsOrder(projectFlows.fileContent);
      cfg.tabsOrder = tabsOrder;

      // Generate the files
      const FileMaker = new filemaker.FileMaker(path.join(project.path, cfg.destinationFolder), splitProjectFlowSet, cfg.fileFormat);
      if (!FileMaker.createSplitFiles()) {
        logger.error(`Failed to generate split source files`)
        return
      }

      logger.info("Split succeeded")

      // Create the cfg if it does not exist
      if (!filemaker.makeOrUpdateCfg(project, CFG_FILENAME, cfg)) {
        logger.warn(`Could not write the config file '${CFG_FILENAME}'`)
      }

    }
  }
};
