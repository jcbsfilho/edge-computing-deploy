const { request } = require("node:https");

/**
 * create headers for requests
 * @param {string} azionPersonalToken value personal token azion
 * @returns
 */
const makeHeaders = (azionPersonalToken) => {
  return {
    Accept: "application/json; version=3",
    Authorization: `token ${azionPersonalToken}`,
    "Content-Type": "application/json",
  };
};

/**
 * request client https
 * @param {string} baseurl base url
 * @param {string} path path api
 * @param {string} method method request
 * @param {object} input input body
 * @param {string} token azion personal token
 * @returns
 */
const requestApi = async (baseurl, path, method, input, token) => {
  const options = {
    method: method,
    hostname: baseurl,
    path: path,
    headers: makeHeaders(token),
  };

  let p = new Promise((resolve, reject) => {
    const req = request(options, (res) => {
      res.setEncoding("utf8");
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("error", (err) => {
        if (res.statusCode < 200 || res.statusCode > 299) {
          const message = responseBody || res?.statusMessage || 'Error undefined'
          try {
            let results = {}
            if(responseBody){
              results = JSON.parse(responseBody);
            }
            return reject({ message: `${message} - ${path}`, results, status: res.statusCode });
          } catch (error) {
            return reject({ message: `${message} - ${path}`, results: {}, status: res.statusCode });
          }
        }
      });

      res.on("end", (err) => {
        try {
          if (res?.statusCode < 200 || res?.statusCode >= 300) {
            const message = responseBody || res?.statusMessage || 'Error undefined'
            return reject({ message: `${message} - ${path}` });
          }
          if (responseBody) {
            const { results } = JSON.parse(responseBody);
            return resolve({ results, status: res.statusCode });
          }
          resolve({ results: responseBody, status: res.statusCode });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (input) {
      const postData = JSON.stringify(input);
      req.write(postData);
    }
    req.end();
  });

  return p;
};

/**
 * create edge application
 * @param {string} baseurl base url
 * @param {object} input input body
 * @param {string} token azion personal token
 * @returns
 */
const createEdgeApplication = async (baseurl, input, token) => {
  const postData = {
    name: input?.name,
    delivery_protocol: "http,https",
    host_header: "host",
    browser_cache_settings: "honor",
    cdn_cache_settings: "honor",
    cdn_cache_settings_maximum_ttl: 60,
  };
  return requestApi(baseurl, "/edge_applications", "POST", postData, token);
};

/**
 * update rules engine to function
 * @param {string} baseurl base url
 * @param {string} applicationId edge application id
 * @param {object} input input body
 * @param {string} token azion personal token
 * @returns
 */
const updateRuleEngineFunction = async (baseurl, applicationId, input, token) => {
  const resultsGetRuleEngine = await requestApi(
    baseurl,
    `/edge_applications/${applicationId}/rules_engine/request/rules`,
    "GET",
    null,
    token
  ).catch((err) => {
    throw err;
  });

  const { results: resultGetRuleEngine } = resultsGetRuleEngine || {};

  const [defaultRule] = resultGetRuleEngine;

  const postData = {
    ...defaultRule,
    behaviors: [
      {
        name: "run_function",
        target: input?.instanceFunctionId,
      },
    ],
  };

  return requestApi(
    baseurl,
    `/edge_applications/${applicationId}/rules_engine/request/rules/${defaultRule.id}`,
    "PATCH",
    postData,
    token
  );
};

/**
 * delete edge application
 * @param {string} baseurl base url
 * @param {string} applicationId edge application id
 * @param {string} token azion personal token
 * @returns
 */
const deleteEdgeApplication = async (baseurl, applicationId, token) => {
  return requestApi(baseurl, `/edge_applications/${applicationId}`, "DELETE", null, token);
};

/**
 * path edge application
 * @param {string} baseurl base url
 * @param {string} applicationId edge application id
 * @param {object} input input body
 * @param {string} token azion personal token
 * @returns
 */
const patchEdgeApplication = async (baseurl, applicationId, input, token) => {
  return requestApi(baseurl, `/edge_applications/${applicationId}`, "PATCH", input, token);
};

/**
 * create instance to edge application
 * @param {string} baseurl base url
 * @param {string} applicationId edge application id
 * @param {object} input input body
 * @param {string} token azion personal token
 * @returns
 */
const createInstanceEdgeApplication = async (baseurl, applicationId, input, token) => {
  const postData = {
    name: input?.name,
    edge_function_id: input?.functionId,
    args: input?.args || {},
  };
  return requestApi(
    baseurl,
    `/edge_applications/${applicationId}/functions_instances`,
    "POST",
    postData,
    token
  );
};

/**
 * create domain to edge application
 * @param {string} baseurl base url
 * @param {object} input input body
 * @param {string} token azion personal token
 * @returns
 */
const createDomain = async (baseurl, input, token) => {
  const postData = {
    name: input?.name,
    cnames: [],
    cname_access_only: false,
    digital_certificate_id: null,
    edge_application_id: input?.edgeApplicationId,
    is_active: true,
  };
  return requestApi(baseurl, `/domains`, "POST", postData, token);
};

/**
 * create edge function
 * @param {string} baseurl base url
 * @param {object} input input body
 * @param {string} token azion personal token
 * @returns
 */
const createFunction = async (baseurl, input, token) => {
  const postData = {
    name: input?.name,
    code: input?.code,
    language: "javascript",
    initiator_type: "edge_application",
    json_args: input?.args,
    active: true,
  };
  return requestApi(baseurl, `/edge_functions`, "POST", postData, token);
};

/**
 * patchFunction edge function
 * @param {string} baseurl base url
 * @param {object} input input body
 * @param {string} token azion personal token
 * @returns
 */
const patchFunction = async (baseurl, input, token) => {
  const postData = {
    code: input?.code,
    json_args: input?.args,
    active: true,
  };
  return requestApi(baseurl, `/edge_functions/${input?.id}`, "PATCH", postData, token);
};

module.exports = {
  requestApi,
  createDomain,
  createEdgeApplication,
  updateRuleEngineFunction,
  deleteEdgeApplication,
  patchEdgeApplication,
  createInstanceEdgeApplication,
  createFunction,
  patchFunction,
};
