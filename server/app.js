const express = require('express');
const fs = require("fs");
const path = require('path');
const translateText=require("../api");
const axios=require('axios');

const app = express();
const port = 8080;
// const _projectId = 'boostcamp';
// const _keyFilename = path.join(__dirname, '../keys/boostcamp-9c749912510c.json');
const projectId = 'my-ocr-proj';
const keyFilename = path.join(__dirname, '../keys/my-ocr-proj-3ead5d620204.json');

app.use(express.json());

require("dotenv").config();

function uploadDirCheck(){
  try{
    fs.accessSync(__dirname+"/uploads");
  }
  catch{
    fs.mkdirSync(__dirname+"/uploads");
  }
}

function nameMaker(){
  const d=new Date(); // month+day+hour+minute+second
  let fileName=d.getMonth().toString();
  fileName+=d.getDay().toString();
  fileName+=d.getHours().toString();
  fileName+=d.getMinutes().toString();
  fileName+=(d.getSeconds().toString()+".txt");
  return fileName;
}


async function ocrConvert(filename){
  const vision = require('@google-cloud/vision');
  // Creates a client
  const client = new vision.ImageAnnotatorClient({
    projectId, keyFilename
  });
  // Performs text detection on the local file
  console.log(filename);
  const [result] = await client.textDetection(filename);
  const detections = result.textAnnotations[0].description;
  // fs.writeFileSync(`./${fn}.txt`, str, "utf8");
  return new Promise(resolve => resolve(detections));
}

const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, path.join(__dirname, 'uploads'))
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // cb 콜백함수를 통해 전송된 파일 이름 설정
  }
})
const upload = multer({ storage: storage })

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'front')));

app.post('/upload', upload.single('userfile'), async (req, res) => {
  let result= await ocrConvert(req.file.path);
  if(req.body.translate){
    result= await translateText(result);
  }
  fs.writeFileSync(__dirname+`/uploads/${nameMaker()}`,result,'utf8');
  res.status(201).json({
    result,
    filepath: '/uploads/'+req.file.filename 
  });
});

app.get('/:filename', (req,res)=>{
    let file = __dirname+'/uploads/'+req.params.filename;
    res.download(file);
})


app.listen(port, function() {
  console.log('ex-app listen port : '+ port);
  uploadDirCheck();
});

