import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { spawn } from 'child_process';
import path from 'path';
import 'dotenv/config';

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        //console.log("here i am",user)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async(req, res) => {
    //algorithm
    //get user details from frontend
    //validation - field should not be empty
    //check if user already exists: username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in database
    //remove password and refresh token field from response
    //check for user creation
    //return response

    const {fullName, email, username, password} = req.body
    console.log(req.body)
    //console.log(req.files)

    if(
        [fullName, email, username, password].some((field) => 
        field?.trim()=== "")
    ){
        return res.status(417).json(
            new ApiResponse(417,"", "All fields required")
        )
    }
    const existedUser = await User.findOne({
        $or: [{ username } , { email }]
    })
    if(existedUser){
        return res.status(409).json(
            new ApiResponse(409,"", "User existed with same username or email")
        )
    }
    if(!username){
        return res.status(417).json(
            new ApiResponse(417,"", "Username is required")
        )
    }


    const user = await User.create({
        fullName,
        email,
        password,
        username :username?.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select( 
        "-password "  //yeh nahi chahiye ki display ho
    )
    if(!createdUser) {
        return res.status(417).json(
            new ApiResponse(417,"", "All fields required")
        )
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async(req, res) => {
    //req.body-> data lelo
    //username, email
    //validating user in database
    //if user found check password
    //if ok generate access token(short lived) and refresh tokens(long lived)
    const {username, email, password} = req.body
    if(!(username || email)){
        throw new ApiError(400, 'Username or email required')
    }
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        return res.status(404)
        .json(
            new ApiResponse(
                404,{},
                "User never existed"
            )
        )
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        return res.status(401)
        .json(
            new ApiResponse(
                401,{},
                "Password mismatched"
            )
        )
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    //console.log('Generated tokens:', { accessToken, refreshToken });

    if (!refreshToken) {
        return res.status(401)
        .json(
            new ApiResponse(
                403,{},
                "Refresh Token not generated"
            )
        )
    }

    const loggedInUser = await User.findById(user._id).select("-password, -refreshToken")
 
    const options = {
     httpOnly: true,
     secure: true,
     sameSite: 'None'
    }
    return res.status(200).cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
        new ApiResponse(
            200, {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )
})

const getUserProfile = asyncHandler(async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(400).json(new ApiResponse(400, {}, "Refresh token missing"));
        }

        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(404).json(new ApiResponse(404, {}, "User not existed"));
        }

        res.status(200).json(new ApiResponse(200, user, "User profile fetched successfully"));
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json(new ApiResponse(500, {}, "Error fetching user profile"));
    }
});

const editUserProfile = asyncHandler(async (req, res) => {
    const { refreshToken } =req.cookies;
    const { fullName } = req.body;

  
    if (!refreshToken) {
        return res.status(400).json(new ApiResponse(400, {}, "Refresh token missing"));
    }
    if (!fullName) {
        return res.status(400).json(new ApiResponse(400, {}, "fullName missing"));
    }
    if (!req.files) {
        return res.status(400).json(new ApiResponse(400, {}, "Files missing"));
    }

    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].buffer;
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].buffer;
    }


    // Upload to Cloudinary and get the URLs
    const avatarUpload = avatarLocalPath ? await uploadOnCloudinary(avatarLocalPath, 'avatar') : null;
    const coverImageUpload = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath, 'coverImage') : null;

    const [avatar, coverImage] = await Promise.all([avatarUpload, coverImageUpload]);


    let updateFields = {};
    if (fullName) {
        updateFields.fullName = fullName;
    }
    if (avatar && avatar.url) {
        updateFields.avatar = avatar.url;
    }
    if (coverImage && coverImage.url) {
        updateFields.coverImage = coverImage.url;
    }

    const user = await User.findOneAndUpdate(
        { refreshToken },
        { $set: updateFields },
        { new: true }
    );

    if (!user) {
        return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }
    

    res.status(200).json(user);
});





/*let pythonProcess;
let resultCallbacks = [];

// Function to start the Python process
function startPythonProcess() {
    const scriptPath = path.resolve('src/AI-Model//main.py');
    pythonProcess = spawn('python', [scriptPath]);

    pythonProcess.stdout.on('data', (data) => {
        const responses = data.toString().trim().split('\n');
        responses.forEach(response => {
            try {
                const result = JSON.parse(response);
                if (resultCallbacks.length > 0) {
                    const callback = resultCallbacks.shift();
                    callback(null, result);
                }
            } catch (err) {
                console.error(`Error parsing response: ${err}`);
                if (resultCallbacks.length > 0) {
                    const callback = resultCallbacks.shift();
                    callback(err);
                }
            }
        });
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
        console.error(`Python process exited with code: ${code}`);
        startPythonProcess(); // Restart the Python process if it exits
    });

    pythonProcess.on('error', (error) => {
        console.error(`Error starting Python process: ${error.message}`);
    });
}

// Start the Python process
startPythonProcess();






const aiModel = asyncHandler((req, res) => {
    const { context, question } = req.body;
    if (!context || !question) {
        return res.status(400).send('Missing context or question');
    }

    // Prepare the input data
    const inputData = JSON.stringify({ context, question });

    // Set up a callback to handle the result
    const resultCallback = (err, result) => {
        if (err) {
            res.status(500).send(`Error processing request: ${err.message}`);
        } else {
            res.json(result);
        }
    };

    // Add the callback to the queue
    resultCallbacks.push(resultCallback);

    // Send the input data to the Python process
    pythonProcess.stdin.write(`${inputData}\n`);
});


// Function to start the Python process
*/


const llmModel = asyncHandler((req,res) => {
    const question = req.body.question2;
    if (!question) {
      return res.status(400).send('Question is required.');
    }
  
    const pythonScriptPath = path.resolve('src/AI-Model//main2.py');
  
    // Spawn a new process to execute the Python script
    const child = spawn('python', [pythonScriptPath, question])
  
    let pythonOutput = '';
  
    // Handle stdout (standard output) from the Python script
    child.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });
  
    // Handle stderr (standard error) from the Python script
    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
  
    // Handle the close event when the process finishes
    child.on('close', (code) => {
      console.log(`Child process exited with code ${code}`);
      res.send(pythonOutput);
    });
})




export {registerUser,loginUser, getUserProfile, editUserProfile, llmModel}