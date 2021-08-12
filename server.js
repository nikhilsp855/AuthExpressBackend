require('dotenv').config();

const { MongoClient }  = require('mongodb');

const express = require("express");
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');


app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/verify', require('./routes/verify'));



const users = [];

//const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
//const client = new MongoClient(uri);


async function createUser(client, newListing) {

    const existingUser = await client.db("login_register").collection("logReg").findOne({name : newListing.name});
    var status = 0;
    if(!existingUser) {
    
        const result = await client.db("login_register").collection("logReg").insertOne(newListing);
        console.log(`New listing created with following id : ${result.insertedId}`);
    }else {

        console.log(`Already exists user ${newListing.name}. Please choose other email id`);
        status = 1;
    }
    return status;
}


async function createSP(client, newListing) {

    const existingUser = await client.db("login_register").collection("logRegSP").findOne({name : newListing.name});
    var status = 0;
    if(!existingUser) {
    
        const result = await client.db("login_register").collection("logRegSP").insertOne(newListing);
        console.log(`New listing created with following id : ${result.insertedId}`);
    }else {

        console.log(`Already exists user ${newListing.name}. Please choose other email id`);
        status = 1;
    }
    return status;
}


async function findUser(client, credential) {

    const result = await client.db("login_register").collection("logReg").findOne({name : credential.name});

    if(result && await bcrypt.compare(credential.password,result.password)) {
        
        console.log(`Found a listing in the collection with the name ${credential.name}`);
        console.log(result);

        return true;
        
        
    }else {

        console.log(`No listings found with the name ${credential.name}`);
        return false;
    }
}

async function findSP(client, credential) {

    const result = await client.db("login_register").collection("logRegSP").findOne({name : credential.name});

    if(result && await bcrypt.compare(credential.password,result.password)) {
        
        console.log(`Found a listing in the collection with the name ${credential.name}`);
        console.log(result);

        return true;
        
        
    }else {

        console.log(`No listings found with the name ${credential.name}`);
        return false;
    }
}

async function findSPReturnCustomer(client, credential) {

    const result = await client.db("login_register").collection("logRegSP").findOne({name : credential.name});
    if(result) {

        //console.log("result.customer = ",result.customer);
        return result.customer;
    }
    return [];
}

async function getServiceProviders(client, credential) {
    
    return client.db("login_register").collection("logRegSP").find({$and:[{city:{$eq:credential.city}},{servname:{$eq:credential.servname}}]}) 
    .toArray()
    .then(items=>{
      items.forEach(console.log);

      return items;
    })
    .catch(err => console.error(`Failed to find documents: ${err}`))
}

async function findSPReturnSubServices(client, credential) {

    const result = await client.db("login_register").collection("logRegSP").findOne({name : credential.name});
    if(result) {

        //console.log("result.subServices = ",result.subServices);
        return result.subServices;
    }
    return [];
}

function authenticateToken(req,res,next) {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if(token == null) return res.sendStatus(401)

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{

        if(err) return  res.sendStatus(403)
        req.user = user
        next()
    })
}

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(Buffer.from(base64,'base64').toString().split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  
    return JSON.parse(jsonPayload);
}


async function updateListingByName(client, nameOfListing, updatedListing) {

    const result = await client.db("login_register").collection("logRegSP").updateOne({name : nameOfListing},{ $push : updatedListing})
}

async function updateListingByNameEditFieldName(client, nameOfListing, updatedListing) {

    console.log("updatedListingByNameEditFieldCost = nameOfListing : ",nameOfListing,", updatedListing : ",updatedListing);
    const result = await client.db("login_register").collection("logRegSP").updateOne({name : nameOfListing,"subServices.id":updatedListing.id},{ $set : {"subServices.$.name":updatedListing.editedField.name}})
}

async function updateListingByNameEditFieldCost(client, nameOfListing, updatedListing) {

    console.log("updatedListingByNameEditFieldCost = nameOfListing : ",nameOfListing,", updatedListing : ",updatedListing);
    const result = await client.db("login_register").collection("logRegSP").updateOne({name : nameOfListing,"subServices.id":updatedListing.id},{ $set : {"subServices.$.cost":updatedListing.editedField.cost}})
}

async function updateListingByNameEditFieldTime(client, nameOfListing, updatedListing) {

    console.log("updatedListingByNameEditFieldCost = nameOfListing : ",nameOfListing,", updatedListing : ",updatedListing);
    const result = await client.db("login_register").collection("logRegSP").updateOne({name : nameOfListing,"subServices.id":updatedListing.id},{ $set : {"subServices.$.time":updatedListing.editedField.time}})
}

async function updateListingByNameDeleteSubService(client, nameOfListing, updatedListing) {

    console.log("updatedListingByNameEditFieldCost = nameOfListing : ",nameOfListing,", updatedListing : ",updatedListing);
    const result = await client.db("login_register").collection("logRegSP").updateOne({name : nameOfListing},{ $pull : { subServices : { id : updatedListing.id }}});
}


app.get('/printHello',authenticateToken,(req,res)=>{

    console.log('Hello');
});

app.get('/logReg',(req,res)=>{

    res.json(users);
});

app.post('/login/register',async (req, res)=>{

        const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri);
            await client.connect();
            //console.log(req.body.pno)
            const hashedPassword = await bcrypt.hash(req.body.password,10);
            const status = await createUser(client,{

                name : req.body.username,
                password : hashedPassword,
                pno:req.body.pno
            })
            .then(user=>{
                res.json("success");
            })
            .catch(err=>res.status(400).json("user already exists"));
    
});


app.post('/splogin/registerSP',async (req, res)=>{

    const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
    var client = new MongoClient(uri);
        await client.connect();
        //console.log(req.body.pno)
        const hashedPassword = await bcrypt.hash(req.body.password,10);
        const status = await createSP(client,{

            name : req.body.username,
            password : hashedPassword,
            pno:req.body.pno,
            email : req.body.email,
            servname : req.body.servname,
            city:req.body.city
           /* customer : [

                {id:1, pic : null, name: 'Emma Watson', address: 'Pune, Vasai road, Block no.16', date: '17/07/2020 - 20/09/2020',payment: 'Rs. 40,000',status:'green'},
                {id:2,pic : null, name: 'Dwayne Johnson', address: 'Pune, Vasai road, Block no.16', date: '25/01/2021 - 15/08/2021',payment: 'Rs. 40,000',status:'yellow'},
                {id:3,pic : null, name: 'Salman Khan', address: 'Pune, Vasai road, Block no.16', date: '20/03/2021 - 21/05/2021',payment: 'Rs. 40,000',status:'red'},
                {id:4,pic : null, name: 'Akshay Kumar', address: 'Pune, Vasai road, Block no.16', date: '17/02/2021 - 20/04/2021',payment: 'Rs. 40,000',status:'green'},
                {id:5,pic : null, name: 'Gal Gadot', address: 'Pune, Vasai road, Block no.16', date: '13/03/2021 - 20/09/2021',payment: 'Rs. 40,000',status:'red'},
            
                {id:6, pic : null, name: 'six', address: 'Pune, Vasai road, Block no.16', date: '17/07/2020 - 20/09/2020',payment: 'Rs. 40,000',status:'green'},
                {id:7,pic : null, name: 'seven', address: 'Pune, Vasai road, Block no.16', date: '25/01/2021 - 15/08/2021',payment: 'Rs. 40,000',status:'yellow'},
                {id:8,pic : null, name: 'eight', address: 'Pune, Vasai road, Block no.16', date: '20/03/2021 - 21/05/2021',payment: 'Rs. 40,000',status:'red'},
                {id:9,pic : null, name: 'nine', address: 'Pune, Vasai road, Block no.16', date: '17/02/2021 - 20/04/2021',payment: 'Rs. 40,000',status:'green'},
                {id:10,pic : null, name: 'ten', address: 'Pune, Vasai road, Block no.16', date: '13/03/2021 - 20/09/2021',payment: 'Rs. 40,000',status:'red'},
            
            
                {id:11, pic : null, name: 'Eleven', address: 'Pune, Vasai road, Block no.16', date: '17/07/2020 - 20/09/2020',payment: 'Rs. 40,000',status:'green'},
                {id:12,pic : null, name: 'twelve', address: 'Pune, Vasai road, Block no.16', date: '25/01/2021 - 15/08/2021',payment: 'Rs. 40,000',status:'yellow'},
                {id:13,pic : null, name: 'thirteen', address: 'Pune, Vasai road, Block no.16', date: '20/03/2021 - 21/05/2021',payment: 'Rs. 40,000',status:'red'},
                {id:14,pic : null, name: 'fourteen', address: 'Pune, Vasai road, Block no.16', date: '17/02/2021 - 20/04/2021',payment: 'Rs. 40,000',status:'green'},
                {id:15,pic : null, name: 'fifteen', address: 'Pune, Vasai road, Block no.16', date: '13/03/2021 - 20/09/2021',payment: 'Rs. 40,000',status:'red'}
            ]*/
            //file : req.body.file
        })
        .then(user=>{
            res.json("success");
        })
        .catch(err=>res.status(400).json("user already exists"));

});


app.post('/login/loginuser',async (req, res) => {

    try {
        
        const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri);
    }catch {

        res.status(500).send();
    }

        try {
    
            await client.connect();
            const isFound = await findUser(client,{name : req.body.name, password : req.body.password});
            console.log(req.body.name)
            if(isFound) {
                
                const user = {name : req.body.name};
                const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET);
                res.json({accessToken : accessToken});
                res.status(201).send();
            }else {
                res.status(202).send();
            }
        } catch(e) {

            console.error(e);
            res.status(500).send();
        }finally {

            await client.close();
        }
        //res.status(201).send();
    
});

app.post('/splogin/loginSP',async (req, res) => {

    try {
        
        const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri);
    }catch {

        res.status(500).send();
    }

        try {
    
            await client.connect();
            const isFound = await findSP(client,{name : req.body.username, password : req.body.password});

            if(isFound) {
                
                const user = {name : req.body.username};
                const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET);
                res.json({accessToken : accessToken});
                res.status(201).send();
            }else {
                res.status(202).send();
            }
        } catch(e) {

            console.error(e);
            res.status(500).send();
        }finally {

            await client.close();
        }
        //res.status(201).send();
    
});


app.post('/getserviceproviders',async (req, res) => {

    try {
        
        const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri);
    }catch {

        res.status(500).send();
    }

        try {
    
            await client.connect();
            
            console.log(req.body.service)
            const providers= await getServiceProviders(client,{city : req.body.city, servname:req.body.service});
            console.log(providers)
            res.json({providers});

            if(providers) {
            
                res.status(201).send();
            }else {
            
                res.status(202).send();
            }
        }
     catch(e) {

        console.error(e);
        res.status(500).send();
    }finally {

        await client.close();
    }
    
});



app.post('/serviceproviders',authenticateToken,async (req,res)=>{

    //console.log('Hello');
    try {
        
        const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri);
    }catch {

        res.status(500).send();
    }

    try {
    
        await client.connect();
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if(token!=null) {
            
            const payload = parseJwt(token);
            const customer = await findSPReturnCustomer(client,{name : payload.name});

            res.json({customerList : customer});
            
            if(customer) {
            
                res.status(201).send();
            }else {
            
                res.status(202).send();
            }
        }
    } catch(e) {

        console.error(e);
        res.status(500).send();
    }finally {

        await client.close();
    }
});

app.get('/serviceproviders/updateDetails',authenticateToken,async (req,res)=>{

    //console.log('Hello');
    try {
        
        const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri);
    }catch {

        res.status(500).send();
    }

    try {
    
        await client.connect();
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if(token!=null) {
            
            const payload = parseJwt(token);
            const subServices = await findSPReturnSubServices(client,{name : payload.name});

            res.json({subServices : subServices});
            
            if(subServices) {
            
                res.status(201).send();
            }else {
            
                res.status(202).send();
            }
        }
    } catch(e) {

        console.error(e);
        res.status(500).send();
    }finally {

        await client.close();
    }
});

app.post('/serviceproviders/updateDetails/addSubService',authenticateToken,async (req,res)=>{

    //console.log('Hello');
    try {
        
        const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri);
    }catch {

        res.status(500).send();
    }

    try {
    
        await client.connect();
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if(token!=null) {
            
            const payload = parseJwt(token);
            //console.log("req.body.newService = ",req.body.newService);
            await updateListingByName(client,payload.name,{subServices : req.body.newService});
            res.status(201).send();
        }
    } catch(e) {

        console.error(e);
        res.status(500).send();
    }finally {

        await client.close();
    }
});

app.post('/serviceproviders/updateDetails/editSubService',authenticateToken,async (req,res)=>{

    //console.log("editSubService called");
    try {
        
        const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri);
    }catch {

        res.status(500).send();
    }

    try {
    
        await client.connect();
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if(token!=null) {
            
            const payload = parseJwt(token);
            console.log("req.body.newService = ",req.body.editedField);
            if(req.body.editedField.name) {
                
                await updateListingByNameEditFieldName(client,payload.name,{editedField : req.body.editedField,id : req.body.id});
            }else if(req.body.editedField.cost) {
            
                await updateListingByNameEditFieldCost(client,payload.name,{editedField : req.body.editedField,id : req.body.id});
            }else {
             
                await updateListingByNameEditFieldTime(client,payload.name,{editedField : req.body.editedField,id : req.body.id});
            }
            res.status(201).send();
        }
    } catch(e) {

        console.error(e);
        res.status(500).send();
    }finally {

        await client.close();
    }
});

app.post('/serviceproviders/updateDetails/deleteSubService',authenticateToken,async (req,res)=>{

    //console.log("editSubService called");
    try {
        
        const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri);
    }catch {

        res.status(500).send();
    }

    try {
    
        await client.connect();
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if(token!=null) {
            
            const payload = parseJwt(token);
                
            await updateListingByNameDeleteSubService(client,payload.name,{id : req.body.id});
            
            res.status(201).send();
        }
    } catch(e) {

        console.error(e);
        res.status(500).send();
    }finally {

        await client.close();
    }
});

app.listen(4000);