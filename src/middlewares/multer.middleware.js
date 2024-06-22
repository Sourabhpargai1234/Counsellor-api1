import multer from "multer";
import os from 'os'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      const tempDir = os.tmpdir(); // This will correctly handle the temporary directory across different OS environments
      cb(null, tempDir);
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
  }
});


//const upload = multer({ dest: '/public/temp/' });
const upload = multer({ storage });

export default upload;