var assert = require('assert');
const puppeteer = require("puppeteer");
const path = require("path")

// opens test.html using headless chrome
// to run tests in open browser, set headless to false.
test('urban/rural categorical map with csvDataSource', async () => {
    let browser = await puppeteer.launch({
        headless: true,
        //sloMo: 80,
        args: ["--window-size=1000,1000"]
    })

    const page = await browser.newPage();

    await page.goto(`file:${path.join(__dirname, 'test.html')}`)

    // evaluate will run the function in the page context
    await page.evaluate(_ => {
        eurostatmap
            .map("ch")
            .svgId("testMap1")
            .withInsets()
            .build();

        eurostatmap
            .map("ch")
            .svgId("testMap2")
            .withInsets([{geo:"GF"}]).insetSize(200).insetZoomExtent([0,99999])
            .build();

        eurostatmap
            .map("ch")
            .svgId("testMap3")
            .geo("LI").scale("01M").withInsets([{geo:"EUR",scale:"60M"}]).insetSize(200).insetZoomExtent([0,99999])
            .build();
    });

    // we're done; close the browser
    await browser.close();

})