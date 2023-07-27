#!/usr/bin/env node

import { execSpawn, existsFolder, makeOutput, parseJsonFile, readFile, writeFileJSON } from "./src/util/common.js";
import messages from "./src/util/message-log.js";
import { publishOrUpdate } from "./src/publish/index.js";

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
  INPUT_EDGEMODULEACCELERATION,
} = process.env;

// ENV GITHUB
const { GITHUB_WORKSPACE, GITHUB_REPOSITORY } = process.env;

/**
 * constants
 */
const BASE_URL_AZION_API = "api-origin.azionapi.net";

/**
 * main function where you run the script
 * @returns {void}
 */
const main = async () => {
  // create initial log
  messages.yellow("JAMStack Azion Deployment");
  messages.textOnly("Build and Deploy applications on the Edge with Azion");
  messages.textOnly(`Preset · ${INPUT_BUILDPRESET}`);

  let APPLICATION_NAME_VALID = INPUT_APPLICATIONNAME;

  if (!INPUT_APPLICATIONNAME) {
    const [_, REPO_NAME] = GITHUB_REPOSITORY?.split("/");
    APPLICATION_NAME_VALID = REPO_NAME;
  }

  // init repo or load repo
  messages.init.yellow("INIT SCRIPT");
  messages.init.await("initialize repository");
  const azionConfigPath = `azion/azion.json`;
  const sourceCodePath = GITHUB_WORKSPACE;
  messages.init.complete("initialize repository");

  // // install libs if not exist
  await existsFolder(`${sourceCodePath}/node_modules`).catch(async (err) => {
    messages.prebuild.yellow("INSTALL DEPENDENCIES");
    messages.prebuild.await("This process may take a few minutes!");
    await execSpawn(sourceCodePath, "yarn");
    messages.prebuild.complete("install dependencies");
  });

  // // build code by vulcan preset
  messages.build.yellow("BUILD CODE BY VULCAN");
  const BUILD_MODE_VALID = INPUT_BUILDMODE || "deliver";
  let buildCmd = `vulcan build --preset ${INPUT_BUILDPRESET} --mode ${BUILD_MODE_VALID}`;
  if (BUILD_MODE_VALID === "compute") {
    const entry = `${INPUT_BUILDCODEENTRY || "./main.js"}`;
    buildCmd = `vulcan build --preset ${INPUT_BUILDPRESET} --mode ${BUILD_MODE_VALID} --entry ${entry}`;
  }
  await execSpawn(sourceCodePath, buildCmd);
  messages.build.complete("building code");

  // publish
  messages.deploy.yellow("DEPLOY ON EDGE");
  const workerFunctionPath = `${sourceCodePath}/.edge/worker.js`;
  const workerArgsPath = `${INPUT_FUNCTIONARGSFILEPATH}`;
  const versionBuildPath = `${sourceCodePath}/.edge/.env`;

  // create args to function
  const ARGS_FUNCTION = await readFile(`${sourceCodePath}/${workerArgsPath}`).catch((err) => messages.prebuild.info("Fail load args file"));
  const ARGS_FUNCTION_VALID = ARGS_FUNCTION || "{}";
  await writeFileJSON(`${sourceCodePath}/${workerArgsPath}`, parseJsonFile(ARGS_FUNCTION_VALID));

  // enable modules
  const EDGE_MODULE_ACCELERATION_VALID = !!INPUT_EDGEMODULEACCELERATION;

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

  const resultPublish = await publishOrUpdate(
    BASE_URL_AZION_API,
    INPUT_AZIONPERSONALTOKEN,
    { acceleration: EDGE_MODULE_ACCELERATION_VALID },
    inputSourceCode
  );
  messages.deploy.complete("deploy");
  messages.deploy.deployed("Edge Application");

  messages.yellow("DEPLOY INFO");
  messages.textOnly(`Name: ${resultPublish?.application?.name}`);
  messages.textOnly(`Domain: https://${resultPublish?.domain?.url}`);
  messages.textOnly(`Domain ID: ${resultPublish?.domain?.id}`);
  messages.textOnly(`Edge Application ID: ${resultPublish?.application?.id}`);
  messages.textOnly(`Function ID: ${resultPublish?.function?.id}`);

  if (resultPublish?.["version-id"]) {
    messages.textOnly(`Version ID: ${resultPublish?.["version-id"]}`);
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
    messages.error(err?.message);
    process.exit(1);
  })
  .finally(async () => {
    messages.complete("finally script");
  });
