const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Clone target Git repo.
 * @param {string} repoUrl 
 * @param {string} destinationFolder 
 */
const cloneGitRepo = async (repoUrl, destinationFolder) => {
  try {
    const { stdout, stderr } = await execAsync(`git clone ${repoUrl} ${destinationFolder}`);
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }
    console.info("Cloned repo successfully.");
    await execAsync(`cd ..`);
    return true;
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
};

module.exports = cloneGitRepo;
