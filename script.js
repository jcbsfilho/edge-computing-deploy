#!/usr/bin/env node

import {
  execSpawn,
  makeOutput,
  parseJsonFile,
  readFile,
  writeFileJSON,
} from "./src/util/common.js";
import { initOrLoad } from "./src/init/index.js";
import { logColor, logConsole, logFailure, logInfo, logSuccess } from "./src/util/logger.js";
import { publishOrUpdateCLI } from "./src/publish-cli/index.js";

/**
 * environments
 */

// INPUT
const {
  INPUT_APPLICATIONNAME,
  INPUT_AZIONPERSONALTOKEN,
  INPUT_FUNCTIONARGSFILEPATH,
  INPUT_BUILDPRESET,
  INPUT_BUILDMODE,
  INPUT_BUILDCODEENTRY,
  _ENVIRONMENT,
} = process.env;

// ENV GITHUB
const { GITHUB_WORKSPACE, GITHUB_REPOSITORY } = process.env;

/**
 * constants
 */
const BASE_URL_AZION_API = _ENVIRONMENT === "production" ? "api-origin.azionapi.net" : "stage-api-origin.azion.net";

/**
 * main function where you run the script
 * @returns {void}
 */
const main = async () => {
  // create initial log
  logInfo("Azion Edge Computing");
  logInfo("Build and Deploy applications on the Edge with Azion.");
  logInfo(`Preset · ${INPUT_BUILDPRESET}`);

  let APPLICATION_NAME_VALID = INPUT_APPLICATIONNAME;

  if (!INPUT_APPLICATIONNAME) {
    const [_, REPO_NAME] = GITHUB_REPOSITORY.split("/");
    APPLICATION_NAME_VALID = REPO_NAME;
  }

  // init repo or load repo
  const azionConfigPath = `azion/azion.json`;
  const { sourceCodePath } = await initOrLoad(
    GITHUB_WORKSPACE,
    GITHUB_REPOSITORY,
    {
      applicationName: APPLICATION_NAME_VALID,
      buildPreset: INPUT_BUILDPRESET,
      buildMode: INPUT_BUILDMODE,
      path: azionConfigPath,
      buildEntry: INPUT_BUILDCODEENTRY
    },
    INPUT_AZIONPERSONALTOKEN
  );

  // build code by vulcan preset
  logColor("white", "gray", "Build Code", "🗄");
  logInfo("This process may take a few minutes!");
  await execSpawn(sourceCodePath, `azioncli edge_applications build`);
  logSuccess("build code done!");

  // publish
  logColor("white", "gray", "Deploy", "🚀");
  const workerFunctionPath = `${sourceCodePath}/.edge/worker.js`;
  const workerArgsPath = `${INPUT_FUNCTIONARGSFILEPATH}`;
  const versionBuildPath = `${sourceCodePath}/.edge/.env`;

  // create args to function
  const ARGS_FUNCTION = await readFile(`${sourceCodePath}/${workerArgsPath}`).catch((err) => logInfo('Fail load args file'))
  const ARGS_FUNCTION_VALID = ARGS_FUNCTION || "{}";
  await writeFileJSON(`${sourceCodePath}/${workerArgsPath}`, parseJsonFile(ARGS_FUNCTION_VALID));


  // publish or update
  const inputSourceCode = {
    path: sourceCodePath,
    configPath: azionConfigPath,
    functionPath: workerFunctionPath,
    functionArgsPath: workerArgsPath,
    versionBuildPath: versionBuildPath,
    info: { application: { name: APPLICATION_NAME_VALID } },
    buildPreset: INPUT_BUILDPRESET,
    buildMode: INPUT_BUILDMODE,
  };

  const resultPublish = await publishOrUpdateCLI(
    BASE_URL_AZION_API,
    INPUT_AZIONPERSONALTOKEN,
    inputSourceCode
  );

  logConsole(`@@@@@@ Name: ${resultPublish?.name}`);
  logConsole(`@@@@@@ Domain: ${resultPublish?.domain?.url}`);
  logConsole(`@@@@@@ Domain ID: ${resultPublish?.domain?.id}`);
  logConsole(`@@@@@@ Edge Application ID: ${resultPublish?.application?.id}`);
  logConsole(`@@@@@@ Function ID: ${resultPublish?.function?.id}`);
  if (resultPublish?.["version-id"]) {
    logConsole(`@@@@@@ Version ID: ${resultPublish?.["version-id"]}`);
  }

  // SET OUTPUT
  await makeOutput(GITHUB_WORKSPACE, "applicationId", resultPublish?.application?.id);
  await makeOutput(GITHUB_WORKSPACE, "domainUrl", resultPublish?.domain?.url);

};

/**
 * execute and catch error
 */
main()
  .catch((err) => {
    logFailure(err?.message);
  })
  .finally(async () => {
    // remove personal token when error
    logSuccess("Done!");
  });
