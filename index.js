const {
  readFile,
  parseJsonFile,
  exitFailure,
  exitOk,
  logInfo,
  commitAutomation,
  execCommandWithPath,
} = require("./util/common");
const apiAzion = require("./services/azion-api");

// CONTANTS

const URL_API_AZION = "api.azionapi.net";

// INPUT
const {
  INPUT_APPLICATIONNAME,
  INPUT_AZIONPERSONALTOKEN,
  INPUT_COMMITCONFIG,
  INPUT_FUNCTIONFILEPATH,
  INPUT_FUNCTIONARGSFILEPATH,
  INPUT_CONFIGFILEPATH,
} = process.env;

// ENV GITHUB

const { GITHUB_WORKSPACE } = process.env;

const execute = async () => {
  const FUNCTION_FILE_PATH = INPUT_FUNCTIONFILEPATH || "worker/function.js";
  const FUNCTION_ARGS_PATH = INPUT_FUNCTIONARGSFILEPATH || "args.json";
  const CONFIG_FILE_PATH = INPUT_CONFIGFILEPATH || "azion/azion.json";
  const COMMIT = INPUT_COMMITCONFIG === "true" ? true : false;

  //   read files
  let FUNCTION_ARGS = {};
  FUNCTION_ARGS = await readFile(`${GITHUB_WORKSPACE}/${FUNCTION_ARGS_PATH}`).catch((err) => {
    FUNCTION_ARGS = {};
  });

  FUNCTION_ARGS = parseJsonFile(FUNCTION_ARGS);

  const FUNCTION_FILE = await readFile(`${GITHUB_WORKSPACE}/${FUNCTION_FILE_PATH}`).catch((err) => {
    throw new Error(`Your function file is not in build folder '${FUNCTION_FILE_PATH}', please check your code!`);
  });

  let configFile = await readFile(`${GITHUB_WORKSPACE}/${CONFIG_FILE_PATH}`).catch((err) =>
    logInfo("Create config file")
  );
  if (!configFile) {
    configFile = {};
  } else {
    configFile = parseJsonFile(configFile);
  }

  if (!configFile?.application?.id || configFile?.application?.id === 0) {
    logInfo("Starting Create New Application!");
    const { results: resCreateApp } = await createEdgeApplication(
      URL_API_AZION,
      INPUT_AZIONPERSONALTOKEN,
      { application: { name: INPUT_APPLICATIONNAME } },
      FUNCTION_FILE,
      FUNCTION_ARGS
    );
    const functionObj = {
      function: {
        ...resCreateApp.function,
        args: FUNCTION_ARGS_PATH,
        file: FUNCTION_FILE_PATH,
      },
    };
    configFile = resCreateApp
    configFile.function = Object.assign(configFile.function, functionObj.function);
  } else {
    logInfo("Starting Update Application!");
    const { results: resUpdateFunction } = await updateEdgeApplication(
      URL_API_AZION,
      INPUT_AZIONPERSONALTOKEN,
      configFile,
      FUNCTION_FILE,
      FUNCTION_ARGS
    );
    const functionObj = {
      function: {
        ...resUpdateFunction.function,
        args: FUNCTION_ARGS_PATH,
        file: FUNCTION_FILE_PATH,
      },
    };
    configFile.function = Object.assign(configFile.function, functionObj.function);
  }
  await commitAutomation(GITHUB_WORKSPACE, CONFIG_FILE_PATH, configFile, COMMIT);

  // SET OUTPUT
  await makeOutput(GITHUB_WORKSPACE, "applicationId", configFile?.application?.id);

  if (configFile?.domain?.url) logInfo(`Domain url: https://${configFile?.domain?.url}`);
  return Promise.resolve(true);
};

/**
 *
 * @param {string} workdir
 * @param {string} key
 * @param {string} value
 * @returns
 */
const makeOutput = async (workdir, key, value) => {
  if (process.env.GITHUB_OUTPUT) {
    return execCommandWithPath(workdir, `echo "${key}=${value}" >> $GITHUB_OUTPUT`);
  }
};

/**
 *
 * @param {string} url
 * @param {string} token
 * @param {object} config
 * @param {string} functionPath
 * @param {string} functionArgs
 * @returns
 */
const createEdgeApplication = async (url, token, config, functionFile, functionArgs) => {
  const inputCreateApplication = { name: config.application.name };
  const resultCreateEdgeApplication = await apiAzion.createEdgeApplication(url, inputCreateApplication, token);
  logInfo("Edge Application created!");
  const { results: resultEdgeApplication } = resultCreateEdgeApplication || {};

  const inputPathApplication = { edge_functions: true };
  await apiAzion.patchEdgeApplication(url, resultEdgeApplication?.id, inputPathApplication, token);

  //   create function
  const codeFile = functionFile;
  const codeRaw = codeFile?.toString();
  const inputFunction = { name: config.application.name, code: codeRaw, args: functionArgs };
  const resultCreateFunction = await apiAzion.createFunction(url, inputFunction, token).catch(async (err) => {
    await apiAzion.deleteEdgeApplication(url, resultEdgeApplication?.id, token);
    throw err;
  });
  logInfo("Edge Function created!");
  const { results: resultFunction } = resultCreateFunction || {};

  const inputEdgeAppInstance = { name: config.application.name, functionId: resultFunction?.id, args: functionArgs };
  const resultEdgeAppInstance = await apiAzion.createInstanceEdgeApplication(
    url,
    resultEdgeApplication?.id,
    inputEdgeAppInstance,
    token
  );

  const { results: resultInstance } = resultEdgeAppInstance || {};

  //   update rule engine
  const inputRuleEngine = { instanceFunctionId: resultInstance?.id };
  await apiAzion.updateRuleEngineFunction(url, resultEdgeApplication?.id, inputRuleEngine, token);

  // create domain
  const inputDomain = { name: config.application.name, edgeApplicationId: resultEdgeApplication?.id };
  const createResultDomain = await apiAzion.createDomain(url, inputDomain, token);
  logInfo("Edge Domain created!");
  const { results: resultDomain } = createResultDomain || {};

  const results = {
    application: {
      id: resultEdgeApplication?.id,
      name: resultEdgeApplication?.name,
    },
    domain: {
      id: resultDomain?.id,
      name: resultDomain?.name,
      url: resultDomain?.domain_name,
    },
    function: {
      id: resultFunction?.id,
      name: resultFunction?.name,
    },
  };
  return Promise.resolve({ results });
};

/**
 *
 * @param {string} url
 * @param {string} token
 * @param {object} config
 * @param {string} functionPath
 * @param {string} functionArgs
 * @returns
 */
const updateEdgeApplication = async (url, token, config, functionFile, functionArgs) => {
  const codeFile = functionFile;
  const codeRaw = codeFile?.toString();
  const inputFunction = { id: config?.function?.id, name: config?.application.name, code: codeRaw, args: functionArgs };
  const { results: resFunction } = await apiAzion.patchFunction(url, inputFunction, token);

  const results = {
    function: {
      id: resFunction?.id,
      name: resFunction?.name,
    },
  };
  return Promise.resolve({ results });
};

// EXECUTE
execute()
  .catch((err) => {
    exitFailure(err?.message);
  })
  .finally(() => {
    exitOk("Done!");
  });
