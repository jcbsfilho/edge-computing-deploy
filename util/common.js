const { promisify } = require("node:util");
const exec = promisify(require("node:child_process").exec);
const fs = require("fs/promises");

const logInfo = (message) => {
  console.info(`⚡️ info      ${message}`);
};

const exitOk = (message) => {
  console.info(`✔  success   ${message}`);
};

const exitFailure = (message) => {
  console.error(`✖  fatal     ${message}`);
  process.exit(1);
};

const parseJsonFile = (file) => {
  let parsed;
  try {
    parsed = JSON.parse(file);
    return parsed;
  } catch (error) {
    throw error;
  }
};

/**
 *
 * @param {string} path path to read file
 *
 * @returns {Promise}
 */
const readFile = async (path) => {
  return await fs.readFile(path, {
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
  return fs.writeFile(path, JSON.stringify(body, undefined, 2));
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
 * @param {string} workdir
 * @param {string} pathFile
 * @param {object} content
 * @param {object} commit
 * @returns
 */
const commitAutomation = async (workdir, pathFile, content, commit) => {
  const [pathWork] = pathFile.split('/');
  await execCommandWithPath(workdir, `mkdir -p ${pathWork}`);
  await writeFileJSON(`${workdir}/${pathFile}`, content);
  if (commit) {
    await execCommandWithPath(
      workdir,
      `
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

module.exports = {
  readFile,
  parseJsonFile,
  exitFailure,
  exitOk,
  logInfo,
  commitAutomation,
  execCommandWithPath
};
