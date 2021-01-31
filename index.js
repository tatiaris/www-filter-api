const async = require('async')
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;
const express = require('express')
const cheerio = require('cheerio')
const bodyParser = require("body-parser");
const app = express()
const cors = require('cors')
const port = 8000
const jsonParser = bodyParser.json()
var fs = require("fs");

const key1 = "fd1ef4a0860f4dd4b50974e3ce93c1c9"
const key2 = "6c500212b73a4c8bbe5ad71d799484fd"
const endpoint = "https://cv-www-filter.cognitiveservices.azure.com/"

const computerVisionClient = new ComputerVisionClient(new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key1 } }), endpoint);
const computerVision = async (adultURLImage) => {
  const adult = (await computerVisionClient.analyzeImage(adultURLImage, {
    visualFeatures: ['Adult']
  })).adult;

  const isInApp = adult.isAdultContent || adult.isRacyContent || adult.isGoryContent;
  return Promise.resolve(isInApp)
}

const getFilteredHtml = async (pageHtml) => {
  let $ = cheerio.load(pageHtml);
  let imgFilter = new Promise((resolve, reject) => {
    $('img').each(function(i, elm) {
      let old_src = $(this).attr('src');
      let new_src = old_src;

      computerVision(`https://tatiaris.com${old_src}`).then(isInapp => {
        console.log(old_src, isInapp);
        if (isInapp) {
          new_src = "https://tatiaris.com/img/www_filter/not_gore_example.jpeg"
        }
      }).catch(err => console.log(err))
      $(this).attr("src", new_src);
      if (i === $('img').length -1) resolve();
    })
  })

  // filtering bad words
  var badWords = fs.readFileSync("./naughty.txt", "utf-8").split("\n");
  var regex = new RegExp( badWords.join( "|" ), "i");
  while (cleanHtml.match(regex)) {
      cleanHtml = cleanHtml.replace(regex, '*')
  }

  return Promise.resolve($.html())
}

app.use(cors());

app.get('/', (req, res) => {
  res.send('www filter api is running!')
})

app.post('/', jsonParser, async (req, res) => {
  let { pageUrl, pageHtml } = req.body;
  let cleanHtml = "";

  await getFilteredHtml(pageHtml).then(filteredHtml => {
    cleanHtml = filteredHtml;
    console.log(cleanHtml);
  }).catch(err => console.log(err))

  const responseData = {
    sucess: true,
    message: "success",
    pageUrl: pageUrl,
    newHtml: cleanHtml,
    blockedAmount: {
      words: 23,
      images: 12,
      forms: 2
    }
  }

  res.json(responseData);
})

app.listen(process.env.PORT || port, () => {
  console.log(`www filter api listening at`, process.env.PORT || `http://localhost:${port}`)
})