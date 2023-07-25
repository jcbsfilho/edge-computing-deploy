import {
  execCommandWithPath,
  execSpawn,
  generateUUID,
  readFile,
} from "../util/common.js";
import { logInfo, logSuccess } from "../util/logger.js";

/**
 *
 * @param {string} sourcePath
 * @param {string} repoUrl
 * @param {Object} config
 * @param {string} config.applicationName
 * @param {string} config.buildPreset
 * @param {string} config.buildMode
 * @param {string} config.buildEntry default ./main.js
 * @param {string} config.path default ./azion/azion.json
 * @param {boolean} config.isCLI default true
 * @param {string} azionToken
 * @returns {Promise} Promise object { sourceCodePath, repoInfo, isImportRepo? }
 */
const initOrLoad = async (sourcePath, repoUrl, config, azionToken) => {
  const [repoOwner, repoName] = repoUrl.split("/");
  await execCommandWithPath("/", "mkdir -p /github/home/.config");
  await execCommandWithPath("/", "touch /github/home/.config/azioncli.yaml");
  await execSpawn("/", `azioncli configure --token ${azionToken}`);

  await readFile(`${sourcePath}/${config.path}`).catch(async (_err) => {
    logInfo("create azion config file.");
    const uniqueApplicationName = `${config.applicationName}-${generateUUID()}`;
    config.applicationName = uniqueApplicationName;
    await execCommandWithPath(
      sourcePath,
      `azioncli edge_applications init --name ${config.applicationName} --type ${config.buildPreset} --mode ${config.buildMode}`
    );
    logSuccess("created azion config done!");
  });

  return Promise.resolve({
    sourceCodePath: sourcePath,
    repoInfo: {
      name: repoName,
      owner: repoOwner,
    },
  });
};

export { initOrLoad };
