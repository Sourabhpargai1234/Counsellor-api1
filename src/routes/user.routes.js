import { Router } from "express";
import { registerUser, loginUser, getUserProfile, editUserProfile, llmModel} from "../controllers/user.controller.js";
import  {upload}  from "../middlewares/multer.middleware.js";

const router = Router()

router.get('/', (req, res) => {
    res.send('I am at routes folder check on postman to test me');
});
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
//router.route("/qa").post(aiModel)
router.route("/llm").post(llmModel)
router.route("/profile").get(getUserProfile)

router.route("/edit").patch(upload.fields([{ name: 'avatar' }, { name: 'coverImage' }]), editUserProfile)


export default router