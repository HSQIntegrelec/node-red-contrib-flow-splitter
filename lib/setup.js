const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

/**
 * Returns a Project object
 * @param {*} nrSettings Node-RED settings
 * @returns {Project}
 */
function getProject(nrSettings) {
  if (nrSettings.editorTheme.projects.enabled) {
    var cfgProjectPath = path.join(nrSettings.userDir, '.config.projects.json');
    if (fs.existsSync(cfgProjectPath)) {
      var readJsonCfgFile = JSON.parse(fs.readFileSync(cfgProjectPath))
      if (!('projects' in readJsonCfgFile) || Object.keys(readJsonCfgFile['projects']).length == 0) {
        logger.warn("Projects are enabled in Node-RED base settings but no project exist.")
        return {
          path: null,
          isProject: true,
          activeProjectName: null
        }
      }
      return {
        path: path.join(nrSettings.userDir, 'projects', readJsonCfgFile.activeProject),
        isProject: true,
        activeProjectName: readJsonCfgFile.activeProject
      }
    }
    cfgProjectPath = path.join(nrSettings.userDir, '.config.json');
    if (fs.existsSync(cfgProjectPath)) {
      var readJsonCfgFile = JSON.parse(fs.readFileSync(cfgProjectPath))
      return {
        path: path.join(nrSettings.userDir, 'projects', readJsonCfgFile.activeProject),
        isProject: true,
        activeProjectName: readJsonCfgFile.activeProject
      }
    } else {
      logger.warn("Projects are enabled in Node-RED base settings but no project exist.")
      return {
        path: null,
        isProject: true,
        activeProjectName: null
      }
    }
  } else {
    return {
      path: nrSettings.userDir,
      isProject: false,
      activeProjectName: nrSettings.flowFile
    }
  }
}

/**
 * Returns a FlowFile object given its project
 * @param {Project} project 
 * @returns {FlowFile}
 */
function getFlowFile(project) {
  var fileName = null;
  var fileContent = null;
  if (!fs.existsSync(path.join(project.path, 'package.json'))) {
    logger.error(`Given project.path is not a node-red project`)
  }
  else {
    if (project.isProject) {
      try {
        var projectPackageJson = JSON.parse(fs.readFileSync(path.join(project.path, 'package.json')))
        fileName = projectPackageJson["node-red"].settings.flowFile
      } catch (errorFileName) {
        logger.warn(`Could not get flow file name from package.json : ${errorFileName}`)
      }
      try {
        fileContent = JSON.parse(fs.readFileSync(path.join(project.path, projectPackageJson["node-red"].settings.flowFile)))
      } catch (errorFileContent) {
        logger.error(`Could not get flow file content : ${errorFileContent}`)
      }
    } else {
      fileName = project.activeProjectName
      try {
        fileContent = JSON.parse(fs.readFileSync(path.join(project.path, project.activeProjectName)))
      } catch (errorFileContent) {
        logger.error(`Could not get flow file content : ${errorFileContent}`)
      }
    }
  }
  return {
    fileName: fileName,
    fileContent: fileContent
  }
}

/**
 * Returns splitter config file object
 * @param {*} projectPath 
 * @param {*} cfgFilename 
 * @returns {Config}
 */
function getCfgFile(projectPath, cfgFilename) {
  if (!fs.existsSync(path.join(projectPath, cfgFilename))) {
    logger.debug(`Missing node-red-contrib-flow-splitter config file '${cfgFilename}' at root of the project ${projectPath}`);
    return null
  }
  else {
    try {
      return cfg = JSON.parse(fs.readFileSync(path.join(projectPath, cfgFilename)));
    } catch (error) {
      logger.error(`Failed returning/parsing node-red-contrib-flow-splitter config file '${cfgFilename}' : ${error}`);
      return null
    }
  }
}

function ensureFolderTree(projectPath, sourceDirectoryName) {
  var directories = [
    path.join(projectPath, sourceDirectoryName, 'tabs'),
    path.join(projectPath, sourceDirectoryName, 'subflows'),
    path.join(projectPath, sourceDirectoryName, 'config-nodes'),
  ];
  try {
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    })
  } catch (error) {
    logger.error(`Creation of source directories failed : ${error}`)
    return false
  } finally {
    return true
  }
};

module.exports = {
  getProject,
  getFlowFile,
  ensureFolderTree,
  getCfgFile,
};