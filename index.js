require("dotenv").config();
const express = require('express');
const graphqlHTTP = require('express-graphql').graphqlHTTP;
const schema = require('./schema/schema')
const app = express();
const cors = require('cors')
const mongoose = require("mongoose");

mongoose
    .connect(process.env.DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    })
    .then(() => {
        console.log("Connected to database");
    })
    .catch((error) => {
        throw new Error(error);
    });

app.use(cors());

app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
}));
//heroku port
app.listen(process.env.PORT || 3000, () => {
    console.log('Listening on port 3000');
}); 