const jwt = require("jsonwebtoken");
const JWT_SECRET = "Thisprojectissecured";

const fetchuser =(req,res,next)=>{
    //Get user from JWT token and add Id to req object
    const token=req.header('auth-token');
    if(!token){
        return res.status(401).send({error:"Token missing,Please authenticate using a valid token"})
    }
    try {
        const data = jwt.verify(token,JWT_SECRET);
req.user =data;
next();
    } catch (error) {
       return res.status(401).send({error:" Invalid Token ,Please authenticate using a valid token"})
    }
    
}


module.exports = fetchuser;