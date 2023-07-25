import * as util from "node:util";
import * as child from "node:child_process";
const exec = util.promisify(child.exec);
import { writeFile, readFile as _readFile } from "fs/promises";
import { logFailure, logInfo } from "./logger.js";

/**
 * Extract and verify github url
 * @param {string} url
 * @returns {object} - repository owner and repository name
 */
const extractGitHubRepoPath = (url) => {
  if (!url) return {};
  const [_, path] = url.match(/(?:git@|https:\/\/)github.com[:/](.*).git/) || [];
  if (!path) return {};
  const [repoOwner, repoName] = path.split("/");
  return { repoOwner, repoName };
};

/**
 * error handler, create the json output for the result
 * @param {string} message
 * @returns {Promise}
 */
const errorHandler = async (message) => {
  logFailure(message)
  const error = { error: true, message };
  return writeFile("/results/output.json", JSON.stringify(error));
};

/**
 * success handler, create the json output for the result
 * @param {*} body
 * @returns {Promise}
 */
const resultHandler = async (body) => {
  return writeFile("/results/output.json", JSON.stringify(body));
};

/**
 *
 * @param {string} repositoryUrl repository url
 * @param {string} ghToken github personal token
 * @param {string} repoOwner repository owner
 * @param {string} repoName repository name
 * @returns {Promise}
 */
const gitCloneRepository = async (repositoryUrl, ghToken, repoOwner, repoName) => {
  const urlWithToken = repositoryUrl.replace("https://", `https://${ghToken}@`);
  await exec(`git clone ${urlWithToken} repos/${repoOwner}/${repoName}`);
  return Promise.resolve(`repos/${repoOwner}/${repoName}`);
};

/**
 *
 * @param {string} path path to execute command
 * @param {string} command command execute
 * @returns {Promise}
 */
const execCommandWithPath = async (path, command) => {
  return await exec(`cd ${path} && ${command}`);
};

/**
 *
 * @param {string} path path to read file
 *
 * @returns {Promise}
 */
const readFile = async (path) => {
  return await _readFile(path, {
    encoding: "utf8",
  });
};

/**
 * writeFileJson
 * @param {string} path path to write
 * @param {*} body
 * @returns {Promise}
 */
const writeFileJSON = async (path, body) => {
  return writeFile(path, JSON.stringify(body, undefined, 2));
};

/**
 * wait
 * @param {number} ms milleseconds
 * @returns {Promise}
 */
const wait = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 *
 * @param {string} sourceCodePath
 * @param {string} pathFile
 * @param {object} content
 * @param {object} commit
 * @returns
 */
const commitAutomation = async (sourceCodePath, pathFile, content, commit) => {
  const [pathWork] = pathFile.split("/");
  await execCommandWithPath(sourceCodePath, `mkdir -p ${pathWork}`);
  await writeFileJSON(`${sourceCodePath}/${pathFile}`, content);
  if (commit) {
    await execCommandWithPath(
      sourceCodePath,
      `
      git config --global --add safe.directory ${sourceCodePath}
      git config user.name "github-actions"
      git config user.email "noreply@github.com"
      git add ${pathFile}
      git commit -m "[bot] Automated Config" || echo 'no changes commit'
      git push || echo 'no changes to push'
      `
    );
    logInfo(`Commit configuration '${pathFile}'!`);
  }
  return Promise.resolve(true);
};

/**
 * generate short id
 * @returns {string}
 */
const generateUUID = () => {
  let firstPart = (Math.random() * 46656) | 0;
  let secondPart = (Math.random() * 46656) | 0;
  firstPart = ("000" + firstPart.toString(36)).slice(-3);
  secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
};

/**
 *
 * @param {object} item
 * @returns
 */
const parseJsonFile = (item) => {
  let parsed;
  try {
    parsed = JSON.parse(item);
    return parsed;
  } catch (error) {
    throw error;
  }
};


const execSpawn = async (path, command) => {
  return new Promise((resolve, reject) => {
    const args = command.split(' ');
    const cmd = args.shift();
    let dataStr = ""

    const processCmd = child.spawn(cmd, args, { shell: true, cwd: path });
    processCmd.stdout.on('data', (data) => {
      dataStr = data.toString()
      if(dataStr.length > 0){
        logInfo(data.toString().trim());
      }
    });

    processCmd.stderr.on('data', (data) => {
      // Some tools and libraries choose to use stderr for process logging or informational messages.
      dataStr = data.toString();
      if (dataStr.toLowerCase().includes('error:')) {
        logInfo(dataStr);
      }
    });

    processCmd.on('error', (error) => {
      reject(error);
    });

    processCmd.on('close', (code) => {
      if (code === 0) {
        resolve(dataStr);
      } else {
        reject(new Error(`Command '${command}' failed with code ${code}`));
      }
    });
  })
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

export {
  extractGitHubRepoPath,
  errorHandler,
  resultHandler,
  gitCloneRepository,
  execCommandWithPath,
  readFile,
  writeFileJSON,
  wait,
  commitAutomation,
  generateUUID,
  parseJsonFile,
  execSpawn,
  makeOutput,
};
