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

    const existingUser = await client.db("login_register").collection("logReg").findOne({email : newListing.email});
    var status = 0;
    if(!existingUser) {
    
        const result = await client.db("login_register").collection("logReg").insertOne(newListing);
        console.log(`New listing created with following id : ${result.insertedId}`);
    }else {

        console.log(`Already exists user ${newListing.email}. Please choose other email id`);
        status = 1;
    }
    return status;
}

async function findUser(client, credential) {

    const result = await client.db("login_register").collection("logReg").findOne({email : credential.email});

    if(result && await bcrypt.compare(credential.password,result.password)) {
        
        console.log(`Found a listing in the collection with the name ${credential.email}`);
        console.log(result);

        return true;
        
        
    }else {

        console.log(`No listings found with the name ${credential.email}`);
    }
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

app.get('/printHello',authenticateToken,(req,res)=>{

    console.log('Hello');
});

app.get('/logReg',(req,res)=>{

    res.json(users);
});

app.post('/login/register',async (req, res)=>{

    try {

        const uri = "mongodb+srv://expressDB:ExpressService@cluster0.egbzj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri);
    }catch {

        res.status(500).send();
    }

        try{

            await client.connect();
    
            const hashedPassword = await bcrypt.hash(req.body.password,10);
            const status = await createUser(client,{
    
                email : req.body.username,
                name : req.body.username,
                password : hashedPassword
            });

            if(status==0) {
                res.status(201).send();
            }else if(status==1) {
                res.status(202).send();
            }
        } catch(e) {

            console.error(e);
        } finally {
    
            await client.close();
        }

        //res.status(201).send();
    
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
            const isFound = await findUser(client,{email : req.body.username, password : req.body.password});

            if(isFound) {
                
                const user = {name : req.body.email};
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

app.listen(4000);