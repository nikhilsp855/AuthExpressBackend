const util = require("util");
const multer = require("multer");
const {GridFsStorage} = require("multer-gridfs-storage");
//const { ConnectionClosedEvent } = require("mongodb");
const { MongoClient }  = require('mongodb');

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(Buffer.from(base64,'base64').toString().split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  
    return JSON.parse(jsonPayload);
}

async function updateListingByNameSetImage(client, nameOfListing, updatedListing) {

    //console.log("updatedListingByNameEditFieldCost = nameOfListing : ",nameOfListing,", updatedListing : ",updatedListing);
    const result = await client.db("login_register").collection("logRegSP").updateOne({name : nameOfListing},{ $set : updatedListing});
}

async function updateDatabase(req, originalname,filename) {

    try {
        
        const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri);
    }catch {
    
        console.log("res.status(500).send()");
    }
    try {
    
        await client.connect();
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if(token!=null) {
            
            var payload = parseJwt(token);
            await updateListingByNameSetImage(client,payload.name,{profilePic : filename});
        }
    }catch(e) {

        console.error(e);
        console.log("res.status(500).send()");
    }finally {

        await client.close();
    }

}


var storage = new GridFsStorage({
  url: "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {


    const filename = `${Date.now()}-Manish-${file.originalname}`;
    updateDatabase(req,file.originalname,filename);
    
//    console.log("file = ",file);
    const match = ["image/png", "image/jpeg"];

    //console.log("payload.name = ",payload.name)
    if (match.indexOf(file.mimetype) === -1) {
        //const filename = `${Date.now()}-Manish-${file.originalname}`;
      return filename;
    }

    return {
      bucketName: "photos",
      //filename: `${Date.now()}-Manish-${file.originalname}`
      filename: filename
    };
  }
});

var uploadFile = multer({ storage: storage }).single("file");
var uploadFilesMiddleware = util.promisify(uploadFile);
module.exports = uploadFilesMiddleware;