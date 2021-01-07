var assert = require('assert');
const puppeteer = require("puppeteer");
const path = require("path")

// opens test.html using headless chrome
// to run tests in open browser, set headless to false.
test('Different inste settings', async () => {
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
            .insets()
            .build();

        eurostatmap
            .map("ch")
            .svgId("testMap2")
            .insets({geo:"GF"}).insetBoxWidth(200).insetZoomExtent([0,99999])
            .build();

        eurostatmap
            .map("ch")
            .svgId("testMap3")
            .geo("LI").scale("01M").insets({geo:"EUR",scale:"60M"}).insetBoxWidth(200).insetZoomExtent([0,99999])
            .build();
    });

    await browser.close();

})