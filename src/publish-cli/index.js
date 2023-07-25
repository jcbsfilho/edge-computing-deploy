import { purge } from "../services/azion-api.js";
import { commitAutomation, execCommandWithPath, parseJsonFile, readFile, writeFileJSON } from "../util/common.js";
import { logInfo } from "../util/logger.js";
import * as dotenv from "dotenv";

/**
 *
 * @param {string} url
 * @param {string} token
 * @param {*} modules
 * @param {Object} sourceCode
 * @param {string} sourceCode.path
 * @param {string} sourceCode.configPath
 * @param {string} sourceCode.functionPath
 * @param {string} sourceCode.functionArgsPath
 * @param {string} sourceCode.versionBuildPath
 * @param {boolean} sourceCode.isImport
 * @param {string} sourceCode.buildPreset
 * @param {string} sourceCode.buildMode
 * @param {*} sourceCode.info
 * @returns {Promise}
 */
const publishOrUpdateCLI = async (url, token, sourceCode) => {
  logInfo("This process may take a few minutes!");

  // change args path
  let azionConfig = await verifyConfig(sourceCode.path, sourceCode.configPath);
  azionConfig.function.args = sourceCode.functionArgsPath;
  const isUpdateDeploy = azionConfig?.application?.id !== 0;

  await writeFileJSON(`${sourceCode.path}/${sourceCode.configPath}`, azionConfig);

  const { stdout: resultPublish } = await execCommandWithPath(sourceCode.path, `azioncli edge_applications publish`);

  logInfo("deploy done!");

  // load config
  azionConfig = await verifyConfig(sourceCode.path, sourceCode.configPath);

  const [urlDomain] = resultPublish?.match(/\bhttps?:\/\/\S+/gi);

  azionConfig.domain.url = urlDomain;

  // PURGE
  if (isUpdateDeploy && azionConfig["rt-purge"]?.purge_on_publish) {
    logInfo(`purge domain`);
    await purge(url, "url", { urls: [`${azionConfig.domain.url}/`] }, null, token).catch((err) =>
      logInfo("problem to purge domain url")
    );
    await purge(url, "wildcard", { urls: [`${azionConfig.domain.url}/*`] }, null, token).catch((err) =>
      logInfo("problem to purge domain wildcard")
    );
  }

  // commit azion config
  await commitAutomation(sourceCode.path, sourceCode.configPath, azionConfig, true);

  dotenv.config({ path: sourceCode.versionBuildPath });
  azionConfig["version-id"] = process.env.VERSION_ID;

  return Promise.resolve(azionConfig);
};

/**
 *
 * @param {string} sourceCodePath
 * @param {string} configPath
 * @returns
 */
const verifyConfig = async (sourceCodePath, configPath) => {
  let config = await readFile(`${sourceCodePath}/${configPath}`).catch((err) => {
    // file not exist
    logInfo("config azion not exist, create new edge application");
  });
  if (config) {
    config = parseJsonFile(config);
  }
  if (!config?.application?.id || config?.application?.id === 0) {
    // config exist, but application id not exit or equal 0
    return undefined;
  }
  return config;
};

export { publishOrUpdateCLI };
