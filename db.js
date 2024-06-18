import mongoose from 'mongoose'
import 'dotenv/config'
var dbHOST= process.env.MongoDBURI


const connectDB = async() => {
    try{
        const connectionInstance = await mongoose.connect(dbHOST)
        console.log(`Connected to: ${connectionInstance.connection.host}`)
    }
    catch(error){
        console.log("Error occured: ",error)
        process.exit(1)
    }
}
export default connectDB