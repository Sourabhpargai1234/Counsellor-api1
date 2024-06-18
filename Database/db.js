import mongoose from 'mongoose'
import 'dotenv/config'


const connectDB = async() => {
    try{
        const MongoDB_URI = process.env.MongoDB_URI
        const connectionInstance = await mongoose.connect(MongoDB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,})
        console.log(`Connected to: ${connectionInstance.connection.host}`)
    }
    catch(error){
        console.log("Error occured: ",error)
        process.exit(1)
    }
}
export default connectDB