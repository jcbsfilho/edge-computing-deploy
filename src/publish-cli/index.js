import { purge } from "../services/azion-api.js";
import { commitAutomation, execCommandWithPath, execSpawn, parseJsonFile, readFile, writeFileJSON } from "../util/common.js";
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
 * @param {string} sourceCode.buildPreset
 * @param {string} sourceCode.buildMode
 * @param {string} sourceCode.staticsPath
 * @param {*} sourceCode.info
 * @returns {Promise}
 */
const publishOrUpdateCLI = async (url, token, sourceCode) => {
  logInfo("This process may take a few minutes!");

  // change args path
  let azionConfig = await verifyConfig(sourceCode.path, sourceCode.configPath);
  azionConfig.function.args = sourceCode.functionArgsPath;
  const isUpdateDeploy = azionConfig?.application?.id === 0;

  // TODO: fix because the cli expects the statics folder when using the Vulcan type
  if(sourceCode?.buildMode === "compute"){
    await readFile(`${sourceCode.path}/${sourceCode.staticsPath}`).catch(async (err) => {
      logInfo("created folder!")
      await execCommandWithPath(sourceCode.path, `mkdir -p ${sourceCode.staticsPath}`)
    })
  }

  await writeFileJSON(`${sourceCode.path}/${sourceCode.configPath}`, azionConfig);

  const debug = `${isUpdateDeploy ? "--debug" : ""}`
  const resultPublish = await execSpawn(sourceCode.path, `azioncli edge_applications publish ${debug}`);

  logInfo("deploy done!");

  // load config
  let azionConfigResult = await verifyConfig(sourceCode.path, sourceCode.configPath);

  const [urlDomain] = resultPublish?.match(/\bhttps?:\/\/\S+/gi);

  azionConfigResult.domain.url = urlDomain;

  // PURGE
  if (urlDomain && !isUpdateDeploy && azionConfigResult["rt-purge"]?.purge_on_publish) {
    const [_, domain] = urlDomain.split("//")
    logInfo(`purge domain`);
    await purge(url, "url", { urls: [`${domain}`, `${domain}/`] }, null, token).catch((err) =>
      logInfo("problem to purge domain url")
    );
  }

  // commit azion config
  await commitAutomation(sourceCode.path, sourceCode.configPath, azionConfigResult, true);

  dotenv.config({ path: sourceCode.versionBuildPath });
  azionConfigResult["version-id"] = process.env.VERSION_ID;

  return Promise.resolve(azionConfigResult);
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
