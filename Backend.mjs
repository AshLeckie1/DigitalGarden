import express from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
import CONFIG from './Config/Config.json' with { type: "json" };


const app = express();

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
};

app.get('/', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    //res.status(403).send("You do not have rights to visit this page");
    res.redirect(`${CONFIG.server}:8080\index.html`)
});

app.listen(CONFIG.NodePort, () => {
    log(`[BOOT] WiseRiver Started!`,"Service")
    log(`[BOOT] Version: ${CONFIG.version}`,"Service")
    log(`[BOOT] Port: ${CONFIG.NodePort}`,"Service");
    log(`[BOOT] Cors Options: ${JSON.stringify(corsOptions)}`,"Service")
}); 

app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())