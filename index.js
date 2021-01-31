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

const getFilteredHtml = (pageHtml) => {
  const $ = cheerio.load(pageHtml);

  // loop through all img urls in the html code and check them for inapp content, change them accordingly
  $('img').each(async (i, elm) => {
    const imgSrc = $(this).attr('src')
    await computerVision(imgSrc).then(isInapp => {
      console.log(isInapp);
      if (isInapp) {
        imgElems[i].attribs['src'] = "https://tatiaris.com/img/www_filter/not_gore_example.jpeg"
      }
    })
  });

  return Promise.resolve(cheerio.html($))
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
  })

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