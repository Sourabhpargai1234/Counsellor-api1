import {v2 as cloudinary} from "cloudinary"
//import fs from "fs"
import streamifier from "streamifier";
import "dotenv/config"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

/*
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // Log success message
        console.log("File uploaded on Cloudinary:", response.url);

        // Check if the file exists before attempting to delete it
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("Local file deleted successfully:", localFilePath);
        } else {
            console.error("Local file not found:", localFilePath);
        }

        return response;
    } catch (error) {
        // Handle upload failure
        console.error("Error uploading file to Cloudinary:", error);

        // Remove the locally saved temporary file if upload failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("Local file deleted due to upload failure:", localFilePath);
        } else {
            console.error("Local file not found to delete:", localFilePath);
        }

        return null;
    }
};*/

const uploadOnCloudinary = async (buffer, folder) => {
    try {
        if (!buffer) return null;

        // Upload the buffer directly to Cloudinary
        const response = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: "auto", folder: folder },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            streamifier.createReadStream(buffer).pipe(stream);
        });

        // Log success message
        console.log("File uploaded on Cloudinary:", response.url);

        return response;
    } catch (error) {
        // Handle upload failure
        console.error("Error uploading file to Cloudinary:", error);
        return null;
    }
};

export {uploadOnCloudinary};