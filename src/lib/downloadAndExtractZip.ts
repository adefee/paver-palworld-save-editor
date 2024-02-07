import axios from 'axios';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const downloadAndExtractCheahJsZip = async (url: string, extractPath: string, filePathToCheck: string): Promise<[boolean, string[]]> => {
  const errors: string[] = [];
  try {
    // Download ZIP
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    // Ensure the extraction path exists
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }

    // Extract ZIP
    const zip = new AdmZip(response.data);
    zip.extractAllTo(extractPath, true);

    // Check if specific file exists
    const fullPath = path.join(extractPath, filePathToCheck);
    if (fs.existsSync(fullPath)) {
      console.log(`Found convert.py, able to continue.`);
      return [true, errors];
    } else {
      console.error(`Unable to find convert.py: ${fullPath}`);
      errors.push(`Unable to find convert.py after downloading: ${fullPath}`);
      return [false, errors];
      
    }
  } catch (error) {
    if (`${error}`.startsWith('AxiosError')) {
      console.error(`Error occured while attempting to download CheahJS tools. If you customized the URL or version in your config, ensure it matches a valid Github URL. URL: ${url}`);
      errors.push(`Error occured while attempting to download CheahJS tools. If you customized the URL or version in your config, ensure it matches a valid Github URL. URL: ${url}`);
    }
  }

  return [false, errors];
};

export default downloadAndExtractCheahJsZip
